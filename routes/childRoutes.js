const express = require("express");
const { addChild, getChildrenForParent } = require("../controllers/childController");
const { mustBeLoggedIn } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", mustBeLoggedIn, getChildrenForParent); // View children

router.post("/add", mustBeLoggedIn, addChild); // Add child

module.exports = router;
