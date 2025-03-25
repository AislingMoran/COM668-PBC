const TrainingSession = require("../models/TrainingSession");

exports.getTrainingSessions = async (req, res) => {
    try {
        const trainingSessions = await TrainingSession.find().sort({ date: 1 });
        res.json(trainingSessions);
    } catch (error) {
        console.error("Error fetching training data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.bookTraining = async (req, res) => {
    try {
        const { date, time } = req.body;
        const newTraining = new TrainingSession({ date, time, user: req.user.userid });

        await newTraining.save();
        res.json({ message: "Training booked successfully" });
    } catch (error) {
        console.error("Error booking training:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
