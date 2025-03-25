const Booking = require("../models/Booking");

// Create a New Booking
exports.createBooking = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).send("You must be logged in to book training.");
        }

        const { date, timeRange, location } = req.body;

        const newBooking = new Booking({
            user: req.user.userid,
            date,
            timeRange,
            location
        });

        await newBooking.save();
        res.redirect("/training");
    } catch (error) {
        console.error("Error booking training:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Get All Bookings
exports.getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("user", "username")
            .sort({ date: 1 });

        res.render("training", { bookings });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).send("Internal Server Error");
    }
};

//Admin view of bookings
exports.getBookingsForAdmin = async (req, res) => {
    try {
        if (!req.user || !req.user.role.includes("admin")) {
            return res.status(403).send("Access Denied");
        }

        const bookings = await Booking.find()
            .populate("user", "username")
            .sort({ date: 1 });

        res.render("adminTrainingBookings", { bookings });
    } catch (error) {
        console.error("Error fetching training bookings:", error);
        res.status(500).send("Internal Server Error");
    }
};
