const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports.setUser = async (req, res, next) => {
    try {
        const token = req.cookies.webPBC;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userid).lean();
            req.user = user;
            res.locals.user = user;
        } else {
            req.user = null;
            res.locals.user = null;
        }
    } catch (err) {
        req.user = null;
        res.locals.user = null;
    }
    next();
};