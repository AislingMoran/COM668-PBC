const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Child = require("../models/Child");
const crypto = require("crypto");
const sendEmail = require("../middleware/forgotEmail");

const saltRounds = 10;
const CLUB_CODE = process.env.CLUB_CODE;

//Register
exports.getRegister = async (req, res) => res.render("register", { errors: [] });

exports.postRegister = async (req, res) => {
    let errors = [];
    try {
        const { verificationCode, username, password, firstName, surname, email, phone } = req.body;
        const roleInput = req.body['role[]'];
        const normalisedRole = Array.isArray(roleInput) ? roleInput : [roleInput];

        let children = [];
        if (normalisedRole.includes("parent")) {
            const childFirstNames = req.body['children[][firstName]'];
            const childSurnames = req.body['children[][surname]'];
            const childGenders = req.body['children[][gender]'];
            const childDobs = req.body['children[][dob]'];

            if (Array.isArray(childFirstNames)) {
                for (let i = 0; i < childFirstNames.length; i++) {
                    children.push({
                        firstName: childFirstNames[i],
                        surname: childSurnames[i],
                        gender: childGenders[i],
                        dob: childDobs[i]
                    });
                }
            } else if (childFirstNames) {
                children.push({
                    firstName: childFirstNames,
                    surname: childSurnames,
                    gender: childGenders,
                    dob: childDobs
                });
            }
        }
        const allowedRoles = ["rower", "parent", "coach", "keyholder"];
        if (!normalisedRole.length || normalisedRole.some(r => !allowedRoles.includes(r))) {
            errors.push("Invalid role selected.");
        }
        if (verificationCode !== CLUB_CODE) {
            return res.render("register", { errors: ["Invalid verification code"] });
        }
        if (!firstName || !surname) errors.push("First name and surname are required.");
        if (!email || !phone) errors.push("Email and phone number are required.");
        if (!username || username.length < 7 || username.length > 20) errors.push("Username must be between 7-20 characters.");
        if (!password || password.length < 7) errors.push("Password must be at least 7 characters.");
        if (normalisedRole.includes("parent") && (!Array.isArray(children) || children.length === 0)) {
            errors.push("At least one child is required for parents.");
        }

        if (errors.length) return res.render("register", { errors });

        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.render("register", { errors: ["Username already exists"] });
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            username: username.toLowerCase(),
            password: hashedPassword,
            firstName,
            surname,
            email,
            phone,
            role: normalisedRole,
        });

        await newUser.save();

        if (normalisedRole.includes("parent")) {
            const savedChildren = await Promise.all(children.map(child =>
                new Child({
                    parent: newUser._id,
                    firstName: child.firstName,
                    surname: child.surname,
                    gender: child.gender,
                    dob: new Date(child.dob)
                }).save()
            ));
            newUser.children = savedChildren.map(child => child._id);
            await newUser.save();
        }

        const token = jwt.sign(
            { userid: newUser._id, username: newUser.username, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("webPBC", token, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 86400000,
        });

        res.redirect("/login");
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).send("Internal Server Error");
    }
};

//Login
exports.getLogin = async (req, res) => res.render("login", { errors: [] });

exports.postLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        let errors = [];

        if (!username || !password) {
            errors.push("Invalid login");
            return res.render("login", { errors });
        }

        const user = await User.findOne({ username: username.toLowerCase() });
        const isMatch = user && await bcrypt.compare(password, user.password);

        if (!user || !isMatch) {
            return res.render("login", { errors: ["Invalid login"] });
        }

        const token = jwt.sign(
            { userid: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("webPBC", token, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 86400000
        });

        res.redirect("/dashboard");
    } catch (error) {
        console.error("Login Error", error);
        res.status(500).send("Internal Server Error");
    }
};

//Logout
exports.logout = (req, res) => {
    res.clearCookie("webPBC");
    res.redirect("/");
};

//Forgot Password
exports.getForgotPassword = (req, res) => res.render("forgotPassword");

exports.postForgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.render("forgotPassword", { errors: ["Email not found"] });

    user.resetToken = crypto.randomBytes(16).toString("hex");
    user.resetTokenExpiration = Date.now() + 3600000;
    await user.save();

    const resetLink = `http://localhost:8080/resetPassword/${user.resetToken}`;

    const html = `
        <p>Hello ${user.firstName},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>If you didn’t request this, you can ignore this email.</p>
    `;

    await sendEmail(user.email, "Password Reset Request", html);
    res.render("forgotPassword", { success: "Check your email for the reset link" });
};

//Reset Password
exports.getResetPassword = async (req, res) => {
    const user = await User.findOne({
        resetToken: req.params.token,
        resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) return res.send("Invalid or Expired Token.");
    res.render("resetPassword", { token: req.params.token });
};

exports.postResetPassword = async (req, res) => {
    const { password } = req.body;

    const user = await User.findOne({
        resetToken: req.params.token,
        resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) return res.send("Invalid or Expired Token.");

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.redirect("/login");
};

//Create a New User-Admin side
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