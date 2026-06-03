const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    ticketID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "supportsModel",
      required: true,
    },
    senderID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderType: {
      type: String,
      enum: ["PET_OWNER", "PET_SITTER", "ADMIN"],
      required: true,
    },
    content: {
      type: String,
      required: false,
    },
    attachment: {
      fileName: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("messagesModel", messageSchema);
