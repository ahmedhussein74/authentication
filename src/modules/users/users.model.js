const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    auth: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
