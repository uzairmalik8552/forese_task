const express = require("express");
const router = express.Router();

const { search, contacts } = require("../controllers/contactController");
// /contact/search?search=622&page=1
router.get("/search", search);

// contact?page=
router.get("/", contacts);

module.exports = router;
