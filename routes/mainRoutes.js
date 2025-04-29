const express = require("express");
const router = express.Router();
const { mustBeLoggedIn } = require("../middleware/authMiddleware");
const safetyController = require("../controllers/safetyController");

router.get("/", (req, res) => res.render("homepage"));
router.get("/homepage", (req, res) => res.render("homepage"));
router.get("/about", (req, res) => res.render("about"));
router.get("/news", (req, res) => res.render("news"));
router.get("/safety", (req, res) => res.render("safety"));
router.get("/contact", (req, res) => res.render("contact"));
router.get("/calendar", mustBeLoggedIn, (req, res) => res.render("calendar"));

router.get("/safetyForm", mustBeLoggedIn, safetyController.getSafetyForm);
router.post("/safetyForm", mustBeLoggedIn, safetyController.submitSafetyForm);
router.get("/admin/safetyForms", mustBeLoggedIn, safetyController.getSafetyFormsForAdmin);


module.exports = router;