const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    surname: { type: String, required: true },
    role: [{ type: String, enum: ['rower', 'parent', 'coach', 'keyholder'], required: true }],
    email: String,
    phone: String,
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }],
    isAdmin: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);
