require("dotenv").config();
const express = require("express");
const path = require("path");

const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const trainingRoutes = require("./routes/trainingRoutes");
const safetyRoutes = require("./routes/safetyRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const trainingSessionRoutes = require("./routes/trainingSessionRoutes");
const childRoutes = require("./routes/childRoutes");

const app = express();

//Frontend
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));
app.use(express.static(path.join(__dirname, "../frontend/public")));

//Middleware
app.use(express.json()); // Parse JSON requests
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // Allow frontend to access API
app.use(express.static(path.join(__dirname, "../frontend/public")));

//MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/PBC')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB Connection Error:', err));

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/safety", safetyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/trainingSessions", trainingSessionRoutes);
app.use("/api/children", childRoutes);

app.get("/", (req, res) => res.render("homepage"));
app.get("/training", (req, res) => res.render("training"));

app.listen(8000, () => console.log("Server running on port 8080"));