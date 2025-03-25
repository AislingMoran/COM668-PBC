const express = require("express");
const { getSafetyForm, submitSafetyForm, getSafetyFormsForAdmin } = require("../controllers/safetyController");
const { mustBeLoggedIn, mustBeAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getSafetyForm);
router.get("/admin", mustBeAdmin, getSafetyFormsForAdmin);

router.post("/", mustBeLoggedIn, submitSafetyForm);

module.exports = router;
