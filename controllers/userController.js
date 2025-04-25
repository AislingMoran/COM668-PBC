const User = require("../models/User");

//Create New User - Admin side
exports.createUserAsAdmin = async (req, res) => {
    try {
        const { username, password, firstName, surname, email, phone, role } = req.body;

        const newUser = new User({
            username,
            password,
            firstName,
            surname,
            email,
            phone,
            role: Array.isArray(role) ? role : [role],
        });

        await newUser.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({ message: "Server error" });
    }
};

//Update User Info - Admin Side
exports.updateUserAsAdmin = async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body;

        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        res.json({ message: "User updated", updatedUser });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

//Delete User - Admin Side
exports.deleteUserAsAdmin = async (req, res) => {
    try {
        const userId = req.params.id;

        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) return res.status(404).json({ message: "User not found" });

        res.json({ message: "User deleted" });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

//Get All Users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        console.error("Fetch users error:", err);
        res.status(500).json({ message: "Server error" });
    }
};