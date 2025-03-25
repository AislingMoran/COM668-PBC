const mongoose = require("mongoose");

const trainingSessionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    date: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }
});

// Check if the model already exists before defining it again
const TrainingSession = mongoose.models.TrainingSession || mongoose.model("TrainingSession", trainingSessionSchema);

module.exports = TrainingSession;
