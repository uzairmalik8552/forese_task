const mongoose = require("mongoose");


const contactSchema = new mongoose.Schema({
  hrName: { type: String, required: true },
  hrNumber: { type: String, required: true, unique: true },
  hrCompany: { type: String, required: true },
  hrEmail: { type: String },
  status: {
    type: String,
    enum: [
      "Not called",
      "Blacklisted",
      "Wrong number",
      "Called not reachable",
      "Called and declined",
      "Called and postponed",
      "Called and accepted",
      "Emailed and awaiting",
      "Emailed and declined",
      "Emailed and confirmed",
    ],
    required: true,
  },
  transportMode: {
    type: String,
    enum: ["Own Transport", "College Transport", ""],
  },
  interviewPreference: {
    type: String,
    enum: ["Online", "Offline", ""],
  },
  callback: { type: Date },
  callbackTime: { type: String },
  comment: { type: String },
  address: { type: String },
  departmentPreference: { type: String },
  hrCount: { type: Number },
  reminderFlag: { type: Number, default: 0 },
});

contactSchema.index({ hrName: "text" });
// Regular index for hrName for regex queries
contactSchema.index({ hrName: 1 });
// Index for hrNumber
contactSchema.index({ hrNumber: 1 });

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
