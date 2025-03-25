const axios = require("axios");
const SafetyForm = require("../models/SafetyForm");
const Booking = require("../models/Booking");

//Weather API Data + Safety Form
exports.getSafetyForm = async (req, res) => {
    try {
        const city = "Portadown";
        const API_KEY = process.env.WEATHER_API_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

        const response = await axios.get(url);
        const weatherData = response.data;

        const upcomingBookings = await Booking.find({
            location: "outside",
            date: { $gte: new Date() }
        }).populate("user", "username");

        const participants = upcomingBookings.map(booking => booking.user.username);

        res.render("safetyForm", { weather: weatherData, participants });
    } catch (error) {
        console.error("Error fetching weather data:", error.message);
        res.render("safetyForm", { weather: null, participants: [] });
    }
};

//Submit SafetyForm
exports.submitSafetyForm = async (req, res) => {
    try {
        const { sessionNames, whoKey } = req.body;

        const newSafetyForm = new SafetyForm({
            sessionNames,
            keyholder: whoKey,
            submittedBy: req.user ? req.user.userid : null
        });

        await newSafetyForm.save();
        res.redirect("/safetyForm");
    } catch (error) {
        console.error("Error submitting safety form:", error);
        res.status(500).send("Internal Server Error");
    }
};

//Admin view of Safety Forms
exports.getSafetyFormsForAdmin = async (req, res) => {
    try {
        if (!req.user || !req.user.role.includes("admin")) {
            return res.status(403).send("Access Denied");
        }

        const safetyForms = await SafetyForm.find().populate("submittedBy", "username");
        res.render("adminSafetyForms", { safetyForms });
    } catch (error) {
        console.error("Error fetching safety forms:", error);
        res.status(500).send("Internal Server Error");
    }
};
