const mongoose = require("mongoose");

const trainingSessionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    date: { type: Date, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    timeRange: { type: String },
    location: { type: String, enum: ["gym", "outside"], required: true },
    audience: { type: String, enum: ["juniors", "masters"], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model.TrainingSession || mongoose.model("TrainingSession", trainingSessionSchema);
