const express = require("express");
const router = express.Router();
const {
    dashboardView,
    getTrainingView,
    createTrainingSession,
    joinTrainingSession,
    getTrainingSessionsForAdmin,
    createBooking,
    updateBooking,
    deleteBooking,
    shareBooking,
    getBookingsForAdmin,
} = require("../controllers/trainingController");
const { mustBeLoggedIn, mustBeAdmin } = require("../middleware/authMiddleware");

//User Views
router.get("/dashboard", mustBeLoggedIn, dashboardView);
router.get("/training", mustBeLoggedIn, getTrainingView);
router.post("/book", mustBeLoggedIn, createBooking);
router.post("/training/join", mustBeLoggedIn, joinTrainingSession);
router.post("/training-sessions/create", mustBeLoggedIn, mustBeAdmin, createTrainingSession);

//Bookings
router.put("/bookings/:id", mustBeLoggedIn, updateBooking);
router.delete("/bookings/:id", mustBeLoggedIn, deleteBooking);
router.post("/bookings/share/:id", mustBeLoggedIn, shareBooking);

//Admin
router.get("/admin/bookings", mustBeLoggedIn, mustBeAdmin, getBookingsForAdmin);
router.get("/admin/training-sessions", mustBeLoggedIn, mustBeAdmin, getTrainingSessionsForAdmin);

module.exports = router;