const express = require("express");
const router = express.Router();
const { partialSearch } = require("../controllers/partialController");

router.get("/search", partialSearch);

module.exports = router;
