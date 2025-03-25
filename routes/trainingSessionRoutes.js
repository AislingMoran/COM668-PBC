const express = require("express");
const {
    createTrainingSession,
    getTrainingSessions,
    joinTrainingSession,
    getTrainingSessionsForAdmin
} = require("../controllers/trainingSessionController");

const { mustBeLoggedIn, mustBeAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getTrainingSessions); // View sessions
router.get("/admin", mustBeAdmin, getTrainingSessionsForAdmin); //Admin view-all

router.post("/create", mustBeAdmin, createTrainingSession); //Admin creates session
router.post("/join", mustBeLoggedIn, joinTrainingSession); //User joins session

module.exports = router;
