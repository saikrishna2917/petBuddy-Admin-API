const messagesModel = require("../models/messagesModel");
const logger = require("../utils/logger");

async function fetchMessagesByTicketId(ticketID) {
  try {
    logger.info(`Fetching messages for ticket ID: ${ticketID}`);
    const messages = await messagesModel
      .find({ ticketID })
      .sort({ createdAt: 1 })
      .lean();
    logger.info(
      `Fetched ${messages.length} messages for ticket ID: ${ticketID} successfully`,
    );
    return messages;
  } catch (error) {
    logger.error(`Error fetching messages for ticket ID: ${ticketID}`, error);
    throw error;
  }
}

async function sendMessage(data) {
  try {
    logger.info(`Saving new message for ticket ID: ${data.ticketID}`);
    const newMessage = await messagesModel.create({
      ticketID: data.ticketID,
      senderID: data.senderID,
      senderType: data.senderType,
      content: data.content,
      attachment: data.attachment
    });
    return newMessage;
  } catch (error) {
    logger.error(`Error saving message for ticket ID: ${data.ticketID}`, error);
    throw error;
  }
}

exports.messageServices = {
  fetchMessagesByTicketId,
  sendMessage,
};
