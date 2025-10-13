const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "job", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ["sent", "delivered", "seen"],
    default: "sent",
  },
}, { timestamps: true });

module.exports = mongoose.model("message", MessageSchema);
