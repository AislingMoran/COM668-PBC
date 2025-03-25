const jwt = require("jsonwebtoken");

exports.mustBeLoggedIn = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
};

exports.mustBeAdmin = (req, res, next) => {
    if (req.user && req.user.role.includes("admin")) {
        return next();
    }
    return res.status(403).json({ error: "Access Denied" });
};
