const Booking = require("../models/Booking");
const TrainingSession = require("../models/TrainingSession");
const User = require("../models/User");

const getDashboardItems = async (userId, userRoles) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isParentOnly = userRoles.length === 1 && userRoles.includes("parent");

    // 1. Get all joined sessions and bookings
    const joinedSessions = await TrainingSession.find({
        date: { $gte: now },
        attendees: userId
    }).select('_id');

    const joinedBookings = await Booking.find({
        date: { $gte: now },
        $or: [{ user: userId }, { attendees: userId }]
    }).select('_id');

    const joinedSessionIds = new Set(joinedSessions.map(s => s._id.toString()));
    const joinedBookingIds = new Set(joinedBookings.map(b => b._id.toString()));

    const allBookings = await Booking.find({
        date: { $gte: now },
        status: "upcoming",
        $or: [{ shared: true }, { user: userId }]
    }).lean();

    const bookings = allBookings
        .filter(b => !joinedBookingIds.has(b._id.toString()))
        .map(b => ({
            ...b,
            type: "booking",
            attendees: b.attendees || []
        }));

    // 3. Get all upcoming sessions
    let sessions = await TrainingSession.find({
        date: { $gte: now }
    }).lean();

    sessions = sessions
        .filter(session => {
            const isRelevant =
                userRoles.includes("coach") ||
                (session.audience === "juniors" && userRoles.includes("parent")) ||
                (session.audience === "masters" && (userRoles.includes("rower") || userRoles.includes("keyholder")));

            const notAlreadyJoined = !joinedSessionIds.has(session._id.toString());

            return isRelevant && notAlreadyJoined;
        })
        .map(s => ({
            ...s,
            type: "session",
            attendees: s.attendees || []
        }));

    return [...bookings, ...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
};



const getJoinedItems = async (userId) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const bookings = await Booking.find({
        date: { $gte: now },
        $or: [{ user: userId }, { attendees: userId }]
    }).lean();

    bookings.forEach(b => {
        b.type = "booking";
        b.attendees = b.attendees || [];
        b.start_time = b.start_time || "N/A";
        b.end_time = b.end_time || "N/A";
        b.location = b.location || "N/A";
    });

    const sessions = await TrainingSession.find({
        date: { $gte: now },
        attendees: userId
    }).lean();

    sessions.forEach(s => {
        s.type = "session";
        s.attendees = s.attendees || [];
    });

    return [...bookings, ...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
};

//Dashboard Bookings Share View
exports.dashboardView = async (req, res) => {
    try {
        const userId = req.user._id;
        const userWithChildren = await User.findById(userId).populate("children").lean();
        const userRoles = userWithChildren.role;
        const available = await getDashboardItems(userId, userRoles);

        res.render("dashboard", { user: userWithChildren, upcoming: available });
    } catch (error) {
        console.error("Error rendering dashboard:", error);
        res.status(500).send("Internal Server Error");
    }
};

//Create a New Training Session (Admin Only)
exports.createTrainingSession = async (req, res) => {
    try {
        if (!req.user || !req.user.role.includes("admin")) {
            return res.status(403).send("Access Denied");
        }

        const { title, description, date, start_time, end_time, location, audience } = req.body;

        if (!title || !date || !start_time || !end_time || !location || !audience) {
            return res.status(400).send("All fields are required");
        }

        const timeRange = `${start_time} - ${end_time}`;

        const newSession = new TrainingSession({
            title,
            description,
            date,
            start_time,
            end_time,
            timeRange,
            location,
            audience,
            createdBy: req.user._id
        });

        await newSession.save();
        res.status(201).json({ message: "Training session created", session: newSession });
    } catch (error) {
        console.error("Error creating training session:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.getTrainingView = async (req, res) => {
    try {
        const userId = req.user._id;
        const userItems = await getJoinedItems(userId);

        res.render("training", { user: req.user, upcoming: userItems });
    } catch (error) {
        console.error("Error rendering training view:", error);
        res.status(500).send("Internal Server Error");
    }
};

//Join Admin created Training Session
exports.joinTrainingSession = async (req, res) => {
    try {
        const { session_id, child_ids, join_self } = req.body;

        const session = await TrainingSession.findById(session_id);
        if (!session) return res.status(404).send("Session not found");

        if (join_self === "true") {
            const userId = req.user._id.toString();
            if (!session.attendees.some(att => att.toString() === userId)) {
                session.attendees.push(userId);
            }
        }

        if (child_ids) {
            const childArray = Array.isArray(child_ids) ? child_ids : [child_ids];

            const parent = await User.findById(req.user._id).populate("children");
            const validChildIds = parent.children.map(c => c._id.toString());

            const childrenToAdd = childArray.filter(id => validChildIds.includes(id));
            for (const childId of childrenToAdd) {
                if (!session.attendees.some(att => att.toString() === childId)) {
                    session.attendees.push(childId);
                }
            }
        }

        await session.save();
        res.redirect("/training");
    } catch (error) {
        console.error("Error joining session:", error);
        res.status(500).send("Internal Server Error");
    }
};

//Admin - View Training Sessions
exports.getTrainingSessionsForAdmin = async (req, res) => {
    try {
        if (!req.user || !req.user.role.includes("admin")) {
            return res.status(403).send("Access Denied");
        }

        const sessions = await TrainingSession.find()
            .populate("createdBy", "username")
            .sort({ date: 1 });

        res.render("adminTrainingSessions", { sessions });
    } catch (error) {
        console.error("Error fetching training sessions:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.bookTraining = async (req, res) => {
    try {
        const { date, start_time, end_time } = req.body;

        if (!date || !start_time || !end_time) {
            return res.status(400).json({ error: "Date, start time, and end time are required" });
        }

        const timeRange = `${start_time} - ${end_time}`;

        const newTraining = new TrainingSession({
            date,
            timeRange,
            createdBy: req.user._id // consistent with createTrainingSession
        });

        await newTraining.save();
        res.status(201).json({ message: "Training booked successfully" });
    } catch (error) {
        console.error("Error booking training:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

//Create a New Booking
exports.createBooking = async (req, res) => {
    try {
        const { date, start_time, end_time, location } = req.body;

        if (!date || !start_time || !end_time || !location) {
            return res.status(400).send("All fields are required");
        }

        const timeRange = `${start_time} - ${end_time}`;

        const newBooking = new Booking({
            user: req.user._id,
            date,
            location,
            start_time,
            end_time,
            timeRange,
            status: "upcoming",
            attendees: [req.user._id]
        });

        await newBooking.save();
        res.redirect("/training");
    } catch (error) {
        console.error("Error booking session:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, timeRange, location, status } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).send("Booking not found");

        const userId = req.user._id;
        if (booking.user.toString() !== userId.toString() && !req.user.role.includes("admin")) {
            return res.status(403).send("Unauthorized");
        }

        if (date) booking.date = date;
        if (timeRange) booking.timeRange = timeRange;
        if (location) booking.location = location;
        if (status) booking.status = status;

        await booking.save();
        res.status(200).json({ message: "Updated", booking });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).send("Booking not found");

        const userId = req.user._id;
        if (booking.user.toString() !== userId.toString() && !req.user.role.includes("admin")) {
            return res.status(403).send("Unauthorized");
        }

        await booking.deleteOne();
        res.status(200).json({ message: "Deleted" });
    } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).send("Internal Server Error");
    }
};

//Share Booking
exports.shareBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).send("Booking not found");

        const userId = req.user._id;
        if (booking.user.toString() !== userId.toString()) {
            return res.status(403).send("Unauthorized");
        }

        booking.shared = true;
        await booking.save();
        res.redirect("/dashboard");
    } catch (error) {
        console.error("Error sharing booking:", error);
        res.status(500).send("Internal Server Error");
    }
};

//Admin view of bookings
exports.getBookingsForAdmin = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("user", "username")
            .sort({ date: 1 });

        res.render("adminTrainingBookings", { bookings });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).send("Internal Server Error");
    }
};
