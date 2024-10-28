const express = require("express");
const router = express.Router();
const { partialSearch } = require("../controllers/partialController");

// http://localhost:3000/partial/search?search=za&page=1&limit=100
router.get("/search", partialSearch);

module.exports = router;
