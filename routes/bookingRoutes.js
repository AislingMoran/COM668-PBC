const express = require("express");
const { createBooking, getBookings, getBookingsForAdmin } = require("../controllers/bookingController");
const { mustBeLoggedIn, mustBeAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getBookings);
router.get("/admin", mustBeAdmin, getBookingsForAdmin);

router.post("/", mustBeLoggedIn, createBooking);

module.exports = router;