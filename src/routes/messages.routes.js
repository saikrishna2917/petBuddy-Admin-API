const express = require("express");
const router = express.Router();
const { messageController } = require("../controllers/messages.controller");

router.get("/:ticketId", messageController.getMessagesByTicket);
router.post("/create/:ticketId", messageController.sendMessage);

module.exports = router;
