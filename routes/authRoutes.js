const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/register", authController.getRegister);
router.post("/register", authController.postRegister);

router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);

router.get("/logout", authController.logout);

router.get("/forgotPassword", authController.getForgotPassword);
router.post("/forgotPassword", authController.postForgotPassword);

router.get("/resetPassword/:token", authController.getResetPassword);
router.post("/resetPassword/:token", authController.postResetPassword);

module.exports = router;