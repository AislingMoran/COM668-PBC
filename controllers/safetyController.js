const axios = require("axios");
const SafetyForm = require("../models/SafetyForm");
const Booking = require("../models/Booking");

//Weather API Data + Safety Form
exports.getSafetyForm = async (req, res) => {
    try {
        const selectedDate = req.query.date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD string
        const dateObj = new Date(selectedDate);
        dateObj.setHours(0, 0, 0, 0);
        const nextDay = new Date(dateObj);
        nextDay.setDate(dateObj.getDate() + 1);

        const upcomingBookings = await Booking.find({
            location: "outside",
            date: { $gte: dateObj, $lt: nextDay }
        }).populate("attendees", "firstName lastName");

        const participants = upcomingBookings.flatMap(booking => booking.attendees);

        // Fetch weather data
        const apiKey = process.env.WEATHER_API_KEY;
        const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Belfast&units=metric&appid=${apiKey}`);

        const weatherData = weatherResponse.data;

        res.render("safetyForm", {
            participants,
            selectedDate,
            weather: weatherData
        });
    } catch (error) {
        console.error("Error loading safety form:", error.message || error);
        res.status(500).send("Error loading safety form");
    }
};


//Submit SafetyForm
exports.submitSafetyForm = async (req, res) => {
    try {
        const { sessionNames, whoKey, start_time, end_time } = req.body;

        const newSafetyForm = new SafetyForm({
            sessionNames,
            keyholder: whoKey,
            startTime: start_time,
            endTime: end_time,
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
