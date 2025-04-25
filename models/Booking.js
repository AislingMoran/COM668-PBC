const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    location: { type: String, required: true },
    date: { type: Date, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    timeRange: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
        type: String,
        enum: ["upcoming", "past", "cancelled"],
        default: "upcoming"
    },
    shared: { type: Boolean, default: false }
});

bookingSchema.pre('save', function (next) {
    this.timeRange = `${this.start_time} - ${this.end_time}`;
    next();
});

module.exports = mongoose.model("Booking", bookingSchema);


