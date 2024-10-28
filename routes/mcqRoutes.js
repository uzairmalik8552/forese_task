const express = require("express");
const router = express.Router();

const { getQuestion } = require("../controllers/mcqController");

// http://localhost:3000/mcq/questions?department=CSE&page=4&sessionId=test123
router.get("/questions", getQuestion);
module.exports = router;
