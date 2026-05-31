const supportService = require("../services/support.service");
const logger = require("../utils/logger");

exports.raiseTicket = async (req, res) => {
  try {
    const { raisedBy, raisedByType, subject, description, category, priority, bookingID } = req.body;

    if (!raisedBy || !raisedByType || !subject || !category) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const ticket = await supportService.createTicket({
      raisedBy,
      raisedByType,
      subject,
      description,
      category,
      priority: priority || "LOW",
      bookingID: bookingID || undefined
    });

    return res.status(201).json({
      success: true,
      message: "Support ticket raised successfully",
      data: ticket
    });
  } catch (error) {
    logger.error(`Controller Error - raiseTicket: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to raise support ticket" });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const { status, priority, category, raisedByType, search, sort, page, limit } = req.query;

    const filters = {
      status,
      priority,
      category,
      raisedByType
    };

    const result = await supportService.fetchTickets(
      filters,
      search,
      sort,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    return res.status(200).json({
      success: true,
      data: result.tickets,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error(`Controller Error - getTickets: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to fetch support tickets" });
  }
};

exports.getTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await supportService.fetchTicketById(id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found" });
    }

    return res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    logger.error(`Controller Error - getTicketDetails: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to fetch ticket details" });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const resolvedBy = req.user ? req.user._id : undefined; // Assuming authMiddleware sets req.user

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const updatedTicket = await supportService.updateStatus(id, status, resolvedBy);

    if (!updatedTicket) {
      return res.status(404).json({ success: false, message: "Support ticket not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      data: updatedTicket
    });
  } catch (error) {
    logger.error(`Controller Error - updateTicketStatus: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to update ticket status" });
  }
};
