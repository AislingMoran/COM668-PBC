const TrainingSession = require("../models/trainingSession");

// Create a New Training Session (Admin Only)
exports.createTrainingSession = async (req, res) => {
    try {
        if (!req.user || !req.user.role.includes("admin")) {
            return res.status(403).send("Access Denied");
        }

        const { title, description, date, timeRange } = req.body;

        const newSession = new TrainingSession({
            title,
            description,
            date,
            timeRange,
            createdBy: req.user.userid
        });

        await newSession.save();
        res.redirect("/training");
    } catch (error) {
        console.error("Error creating training session:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Get All Training Sessions
exports.getTrainingSessions = async (req, res) => {
    try {
        const trainingSessions = await TrainingSession.find()
            .sort({ date: 1 })
            .populate("createdBy", "username");

        res.render("training", { trainingSessions });
    } catch (error) {
        console.error("Error fetching training sessions:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Sign Up for a Training Session
exports.joinTrainingSession = async (req, res) => {
    try {
        const { session_id } = req.body;

        const session = await TrainingSession.findById(session_id);
        if (!session) return res.status(404).send("Session not found");

        if (!session.attendees.includes(req.user.userid)) {
            session.attendees.push(req.user.userid);
            await session.save();
        }

        res.redirect("/training");
    } catch (error) {
        console.error("Error joining session:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Admin - View Training Sessions
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
