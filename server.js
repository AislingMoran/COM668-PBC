require("dotenv").config();
//Import Dependencies
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const app = express();
const { setUser } = require("./middleware/setUser");

//Import Routes
const authRoutes = require("./routes/authRoutes");
const mainRoutes = require("./routes/mainRoutes");
const safetyRoutes = require("./routes/safetyRoutes");
const trainingRoutes = require("./routes/trainingRoutes");

//Connect Frontend
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));
app.use(express.static(path.join(__dirname, "../frontend/public")));

//Middleware
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cookieParser());
app.use(setUser);
app.use(cors({ credentials: true }));

//MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/PBC')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB Connection Error:', err));

//Routes
app.use("/", authRoutes);
app.use("/", mainRoutes);
app.use("/", safetyRoutes);
app.use("/", trainingRoutes);

//Local Host
app.listen(8080, () => console.log("Server running on Port 8080"));
