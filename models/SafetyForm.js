const mongoose = require("mongoose");

const safetyFormSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    weather: {
        location: String,
        temperature: Number,
        conditions: String,
        windSpeed: Number,
        icon: String
    },
    sessionNames: String,
    keyholder: String,
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("SafetyForm", safetyFormSchema);
