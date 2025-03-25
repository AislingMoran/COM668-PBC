const mongoose = require("mongoose");

const childSchema = new mongoose.Schema({
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Links child to parent account
    name: { type: String, required: true }, // Child's name
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true }, // Gender selection
    age: { type: Number, required: true, min: 1 } // Age validation
});

module.exports = mongoose.model("Child", childSchema);
