const supportService = require("../services/support.service");
const logger = require("../utils/logger");

exports.raiseTicket = async (req, res) => {
  try {
    const {
      raisedBy,
      raisedByType,
      subject,
      description,
      category,
      priority,
      bookingID,
    } = req.body;

    if (!raisedBy || !raisedByType || !subject || !category) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const ticket = await supportService.createTicket({
      raisedBy,
      raisedByType,
      subject,
      description,
      category,
      priority: priority || "LOW",
      bookingID: bookingID || undefined,
    });

    return res.status(201).json({
      success: true,
      message: "Support ticket raised successfully",
      data: ticket,
    });
  } catch (error) {
    logger.error(`Controller Error - raiseTicket: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Failed to raise support ticket" });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      raisedByType,
      search,
      sort,
      page,
      limit,
    } = req.query;

    const filters = {
      status,
      priority,
      category,
      raisedByType,
    };

    const result = await supportService.fetchTickets(
      filters,
      search,
      sort,
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );

    return res.status(200).json({
      success: true,
      data: result.tickets,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error(`Controller Error - getTickets: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch support tickets" });
  }
};

exports.getTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await supportService.fetchTicketById(id);

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Support ticket not found" });
    }

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    logger.error(`Controller Error - getTicketDetails: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch ticket details" });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigneeId, escalateToId } = req.body;
    const adminId = req.admin ? req.admin._id : undefined;
    console.log(req.admin, "admin--------------");
    logger.info(
      `updateTicketStatus called - status: ${status}, assigneeId: ${assigneeId}, escalateToId: ${escalateToId}, adminId: ${adminId}`,
    );

    if (!status && !assigneeId && !escalateToId) {
      return res
        .status(400)
        .json({ success: false, message: "No update parameters provided" });
    }

    const updatedTicket = await supportService.updateStatus(
      id,
      { status, assigneeId, escalateToId },
      adminId,
    );

    if (!updatedTicket) {
      return res
        .status(404)
        .json({ success: false, message: "Support ticket not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    });
  } catch (error) {
    logger.error(`Controller Error - updateTicketStatus: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update ticket" });
  }
};

exports.addTicketNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const authorId = req.admin ? req.admin._id : undefined;

    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "Note content is required" });
    }

    if (!authorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updatedTicket = await supportService.addNote(id, authorId, content);

    if (!updatedTicket) {
      return res
        .status(404)
        .json({ success: false, message: "Support ticket not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Note added successfully",
      data: updatedTicket,
    });
  } catch (error) {
    logger.error(`Controller Error - addTicketNote: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Failed to add ticket note" });
  }
};
exports.editTicketNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const { content } = req.body;
    const editorId = req.admin ? req.admin._id : undefined;

    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "Note content is required" });
    }

    if (!editorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updatedTicket = await supportService.editNote(
      id,
      noteId,
      editorId,
      content,
    );

    if (!updatedTicket) {
      return res
        .status(404)
        .json({ success: false, message: "Support ticket or note not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: updatedTicket,
    });
  } catch (error) {
    logger.error(`Controller Error - editTicketNote: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Failed to edit ticket note" });
  }
};
