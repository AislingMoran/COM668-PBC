const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who booked
    date: { type: Date, required: true }, // Date of training
    timeRange: { type: String, required: true }, // Time range (e.g., "6:00 PM - 7:30 PM")
    location: { type: String, enum: ["gym", "outside"], required: true }, // Where
    createdAt: { type: Date, default: Date.now } // Timestamp of booking
});

module.exports = mongoose.model("Booking", bookingSchema);
