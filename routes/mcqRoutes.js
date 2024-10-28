const express = require("express");
const router = express.Router();


const { getQuestion } = require("../controllers/mcqController");

router.get("/questions", getQuestion);
module.exports = router;
