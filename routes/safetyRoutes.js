const express = require("express");
const router = express.Router();
const safetyController = require("../controllers/safetyController");
const { mustBeLoggedIn } = require("../middleware/authMiddleware");

router.get("/safetyForm", mustBeLoggedIn, safetyController.getSafetyForm);
router.post("/safetyForm", mustBeLoggedIn, safetyController.submitSafetyForm);
router.get("/admin/safetyForms", mustBeLoggedIn, safetyController.getSafetyFormsForAdmin);

module.exports = router;
