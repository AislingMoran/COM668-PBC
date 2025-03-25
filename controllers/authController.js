const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.registerUser = async (req, res) => {
    try {
        const { verificationCode, username, password, email, phone, firstName, surname, role, children } = req.body;

        if (verificationCode !== process.env.CLUB_CODE) {
            return res.status(400).json({ error: "Invalid verification code" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username: username.toLowerCase(),
            password: hashedPassword,
            firstName,
            surname,
            email,
            phone,
            role: Array.isArray(role) ? role : [role]
        });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userid: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.cookie("token", token, { httpOnly: true });

        res.json({ message: "Login successful" });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};