const express = require("express");
const router = express.Router();

router.get("/", (req, res) => res.render(req.user ? "dashboard" : "homepage"));
router.get("/homepage", (req, res) => res.render("homepage"));
router.get("/about", (req, res) => res.render("about"));
router.get("/news", (req, res) => res.render("news"));
router.get("/safety", (req, res) => res.render("safety"));
router.get("/contact", (req, res) => res.render("contact"));
router.get("/calendar", (req, res) => res.render("calendar"));

module.exports = router;