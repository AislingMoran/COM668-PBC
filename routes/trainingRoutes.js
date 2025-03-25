const express = require("express");
const { getTrainingSessions, bookTraining } = require("../controllers/trainingController");
const { mustBeLoggedIn } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getTrainingSessions);

router.post("/book", mustBeLoggedIn, bookTraining);

module.exports = router;
