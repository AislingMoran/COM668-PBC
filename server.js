require('dotenv').config();
console.log("JWT_SECRET:", process.env.JWT_SECRET); // Ensure this logs the secret

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const express = require('express');
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/PBC', {})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB Connection Error:', err));

//Database setup
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    surname: { type: String, required: true },
    role: [{ type: String, enum: ['rower', 'parent', 'coach', 'keyholder'], required: true } ],
    email: String,
    phone: String,
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }],
    isAdmin: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

const childSchema = new mongoose.Schema({
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    gender: String,
    age: Number
});
const Child = mongoose.model('Child', childSchema);

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, enum: ['gym', 'outside'], required: true },
    keyholder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    additionalPeople: String
});
const Booking = mongoose.model('Booking', bookingSchema);

const safetyFormSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    weather: {
        location: String,
        temperature: Number,
        conditions: String,
        windSpeed: Number,
        icon: String
    },
    sessionNames: String,
    keyholder: String,
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
const SafetyForm = mongoose.model('SafetyForm', safetyFormSchema);

const trainingSessionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    date: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
});
const TrainingSession = mongoose.model('TrainingSession', trainingSessionSchema);


const app = express();
const API_KEY = process.env.WEATHER_API_KEY;

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(express.static('public'));
app.use(cookieParser());

//Log user in by giving them a cookie
app.use(function (req, res, next) {
    res.locals.errors = [];
    try { //Decode incoming cookie
        const decoded = jwt.verify(req.cookies.webPBC, process.env.JWT_SECRET);
        req.user = decoded
    } catch(err){
        req.user = false
    }
    res.locals.user = req.user;
    next();
});

//Routes
app.get('/', (req, res) => {
    res.render(req.user ? 'dashboard' : 'homepage');
});

app.get('/homepage', (req, res) => {
    res.render('homepage');
});

app.get('/login', (req, res) => {
    res.render('dashboard');
    //if logged in
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/logout', (req, res) => {
    res.clearCookie('webPBC');
    res.redirect('/');
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/news', (req, res) => {
    res.render('news');
});

app.get('/safety', (req, res) => {
    res.render('safety');
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

function mustBeLoggedIn(req, res, next) {
    if (req.user) {
        return next();
    }
    return res.redirect('/');
}

app.get('/dashboard', mustBeLoggedIn, (req, res) => {
    res.render('dashboard');
});

app.get('/calendar', (req, res) => {
    res.render('calendar');
});

app.get('/safetyForm', async (req, res) => {
    try {
        const city = "Portadown";
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

        const response = await axios.get(url);
        const weatherData = response.data;

        const now = new Date();

        const upcomingBookings = await Booking.find({
            location: "outside",
            date: { $gte: new Date() }
        }).populate('user', 'username');

        const participants = upcomingBookings.map(booking => booking.user.username);

        res.render('safetyForm', { weather: weatherData, participants });
    } catch (error) {
        console.error("Weather API Error:", error.message);
        res.render('safetyForm', { weather: null, participants: [] });
    }
});

function mustBeAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).render('Access Denied');
}

app.get('/training', async (req, res) => {
    try {
        const trainingSessions = await TrainingSession.find().sort({ date: 1 }).populate('createdBy', 'username');
        const bookings = await Booking.find().populate('user', 'username').sort({ date: 1 });

        res.render('training', { trainingSessions, bookings });
    } catch (error) {
        console.error("Error fetching training data:", error);
        res.status(500).send("Internal Server Error");
    }
});

//Admin Views
app.get('/admin/dashboard', async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).send("Access Denied");
        }

        const trainingCount = await Booking.countDocuments();
        const safetyFormsCount = await SafetyForm.countDocuments();

        res.render('adminDashboard', { trainingCount, safetyFormsCount });
    } catch (error) {
        console.error("Error loading admin dashboard:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/admin/training-bookings', async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).send("Access Denied");
        }

        const bookings = await Booking.find()
            .populate('user', 'username')
            .sort({ date: 1 });

        res.render('adminTrainingBookings', { bookings });
    } catch (error) {
        console.error("Error fetching training bookings:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/admin/safetyForms', async (req, res) => {
    try {
        if (!req.user || !req.user.role.includes('admin')) {
            return res.status(403).send("Access denied");
        }

        const safetyForms = await SafetyForm.find().populate('submittedBy', 'username');
        res.render('adminSafetyForms', { safetyForms });
    } catch (error) {
        console.error("Error fetching safety forms:", error);
        res.status(500).send("Internal Server Error");
    }
});

//Login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        let errors = [];

        if (!username || !password) {
            errors.push('Invalid login');
            return res.render('login', { errors });
        }

        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            errors.push('Invalid login');
            return res.render('login', { errors });
        }

        const token = jwt.sign(
            { userid: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('webPBC', token, { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 86400000 });
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

//Registration
app.post('/register', async (req, res) => {
    try {
        const { verificationCode, username, password, email, phone, firstName, surname, role, children } = req.body;
        let errors = [];

        const CLUB_CODE = "PBC123";

        if (verificationCode !== CLUB_CODE) {
            return res.render("register", { errors: ["Invalid verification code"] });
        }

        if (!firstName || !surname) {
            errors.push("First name and surname are required.");
        }

        if (!email || !phone) {
            errors.push('Email and Phone are required.');
        }

        if (!username || username.length < 7 || username.length > 20) {
            errors.push('Username must be between 7-20 characters');
        }
        if (!password || password.length < 7) {
            errors.push('Password must be at least 7 characters');
        }
        if (!['rower', 'parent', 'coach', 'keyholder'].includes(role)) {
            errors.push('Invalid role selected');
        }
        if (errors.length) return res.render("homepage", { errors });

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render("homepage", { errors: ["Username already exists"] });
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

        if (role === 'parent' && Array.isArray(children)) {
            const childDocs = children.map(child => new Child({
                parent: newUser._id,
                name: child.name,
                gender: child.gender,
                age: child.age
            }));
            await Child.insertMany(childDocs);
            newUser.children = childDocs.map(child => child._id);
        }

        console.log("Saving User", newUser);

        await newUser.save(user);

       // const token = jwt.sign(
       //     { userid: newUser._id, username: newUser.username, role: newUser.role },
       //     process.env.JWT_SECRET,
       //     { expiresIn: '1d' }
       // );

        //res.cookie('webPBC', token, { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 86400000 });
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/book-training', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).send("You must be logged in to book training.");
        }
        const { date, time } = req.body;
        const newTraining = new TrainingSession({
            user: req.user.userid,
            date,
            time
        });

        await newTraining.save();
        res.redirect('/training');
    } catch (error) {
        console.error("Error booking training:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/join-session', async (req, res) => {
    try {
        const { session_id } = req.body;

        const session = await TrainingSession.findById(session_id);
        if (!session) return res.status(404).send("Session not found");

        console.log(`User ${req.user.username} is attending ${session.title}`);

        res.redirect('/training');
    } catch (error) {
        console.error("Error joining session:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/create-training', async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).send('Unauthorized');

    const { title, date, description } = req.body;
    const newSession = new TrainingSession({ title, date, description, attendees: [] });
    await newSession.save();

    res.redirect('/training');
});

app.post('/check-in/:id', async (req, res) => {
    const session = await TrainingSession.findById(req.params.id);
    if (!session) return res.status(404).send("Training not found");

    if (!session.attendees.includes(req.user._id)) {
        session.attendees.push(req.user._id);
        await session.save();
    }

    res.redirect('/training');
});

app.post('/safetyForm', async (req, res) => {
    try {
        const { sessionNames, whoKey } = req.body;
        const newSafetyForm = new SafetyForm({ sessionNames, keyholder: whoKey, submittedBy: req.user?.userid || null });
        await newSafetyForm.save();
        res.redirect('/safetyForm');
    } catch (error) {
        console.error("Error submitting safety form:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(8000, () => console.log("Server running on port 8080"));
