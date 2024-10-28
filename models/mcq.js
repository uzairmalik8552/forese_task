const mongoose = require("mongoose");

const mcqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String], // Array to store answer options
    required: true,
    validate: [arrayLimit, "{PATH} exceeds the limit of 4 options"],
  },
  correctAnswer: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["aptitude", "department"], // Defines whether it's an aptitude or department question
    required: true,
  },
  department: {
    type: String,
    enum: ["CSE", "ECE", "Mechanical", "Civil", "Chemical", "Biotechnology"], // List of departments
    required: function () {
      return this.category === "department"; // Required only for department questions
    },
  },
});

// Custom validator to ensure the options array has exactly 4 choices
function arrayLimit(val) {
  return val.length === 4;
}

module.exports = mongoose.model("MCQ", mcqSchema);
