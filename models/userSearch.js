const mongoose = require("mongoose");

const userSearchSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

userSearchSchema.index({
  firstName: "text",
  lastName: "text",
  email: "text",
});

userSearchSchema.index({ firstName: 1 });
userSearchSchema.index({ lastName: 1 });
userSearchSchema.index({ email: 1 });

module.exports = mongoose.model("UserSearch", userSearchSchema);
