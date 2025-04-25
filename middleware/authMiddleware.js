const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.mustBeLoggedIn = async (req, res, next) => {
    try {
        const token = req.cookies.webPBC;
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userid);

        if (!user) return res.status(401).json({ error: "User not found" });

        req.user = user;
        next();
    } catch (err) {
        console.error("mustBeLoggedIn error:", err);
        res.status(401).json({ error: "Invalid token" });
    }
};

exports.mustBeAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin.includes("true")) {
        return next();
    }
    return res.status(403).json({ error: "Access Denied" })
};