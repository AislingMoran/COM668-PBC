const mongoose = require("mongoose");

const safetyFormSchema = new mongoose.Schema({
    weather: {
        location: String,
        temperature: Number,
        conditions: String,
        windSpeed: Number,
        icon: String
    },
    sessionNames: [String],
    keyholder: String,
    startTime: String,
    endTime: String,
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

module.exports = mongoose.model("SafetyForm", safetyFormSchema);

