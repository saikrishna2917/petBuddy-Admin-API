const path = require("path");
const fs = require("fs");
const { messageServices } = require("../services/messages.service");
const logger = require("../utils/logger");

async function getMessagesByTicket(req, res) {
  try {
    const { ticketId } = req.params;
    logger.info(
      `Calling the fetchMessageByTicketId using the ticketID: ${ticketId}`,
    );
    const messages = await messageServices.fetchMessagesByTicketId(ticketId);

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
}

async function sendMessage(req, res) {
  try {
    const { ticketId } = req.params;
    const { senderID, senderType, content } = req.body;

    let attachmentData = null;

    if (req.files && req.files.attachment) {
      const file = req.files.attachment;
      const uploadDir = path.join(__dirname, "../../public/uploads");

      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);

      await file.mv(filePath);

      attachmentData = {
        fileName: file.name,
        fileUrl: `/public/uploads/${fileName}`,
        fileType: file.mimetype,
        fileSize: file.size,
      };
    }

    logger.info(`Controller calling sendMessage for ticketID: ${ticketId}`);
    const newMessage = await messageServices.sendMessage({
      ticketID: ticketId,
      senderID,
      senderType,
      content,
      attachment: attachmentData,
    });

    return res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
}

exports.messageController = {
  getMessagesByTicket,
  sendMessage,
};
