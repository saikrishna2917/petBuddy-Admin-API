const supportsModel = require("../models/supportsModel");
const petOwnerProfileModel = require("../models/petOwnersProfileModel");
const PetSitterModel = require("../models/petSitterModel");
const petBuddyUsersModel = require("../models/petBuddyUsersModel");
const logger = require("../utils/logger");

/**
 * Service to handle support tickets logic
 */
class SupportService {
  /**
   * Create a new support ticket
   */
  async createTicket(data) {
    try {
      // Generate a unique ticket ID (e.g., SUT00228820002)
      const count = await supportsModel.countDocuments();
      const ticketID = `SUT${(count + 1).toString().padStart(11, "0")}`;

      // Let's find who raised it to store in timeline
      let raiserName = "System";
      if (data.raisedByType === "PET_OWNER") {
        const owner = await petOwnerProfileModel.findById(data.raisedBy);
        if (owner) raiserName = `${owner.firstName} ${owner.lastName}`;
      } else if (data.raisedByType === "PET_SITTER") {
        const sitter = await PetSitterModel.findById(data.raisedBy);
        if (sitter) raiserName = `${sitter.firstName} ${sitter.lastName}`;
      } else if (data.raisedByType === "ADMIN") {
        const admin = await petBuddyUsersModel.findById(data.raisedBy);
        if (admin) raiserName = `${admin.firstName} ${admin.lastName}`;
      }

      const newTicket = new supportsModel({
        ...data,
        ticketID,
        status: "OPEN",
        timeline: [
          {
            action: "Ticket Created",
            by: raiserName,
            performedBy: data.raisedByType === "ADMIN" ? data.raisedBy : undefined,
            details: `Ticket was successfully created under category ${data.category}.`,
            date: new Date()
          }
        ]
      });

      const savedTicket = await newTicket.save();
      return savedTicket;
    } catch (error) {
      logger.error(`Error in SupportService.createTicket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch tickets with filters, search, and pagination
   */
  async fetchTickets(filters, search, sort, page = 1, limit = 10) {
    try {
      const query = { isDeleted: false };

      if (filters.status && filters.status !== "All") {
        // Map frontend "In Review" -> IN_PROGRESS, "Open" -> OPEN, etc., if necessary
        // Or assume frontend sends correct Enum. Let's do exact match but case-insensitive if possible, or assume Exact
        const formattedStatus = filters.status.toUpperCase().replace(" ", "_");
        query.status = formattedStatus === "IN_REVIEW" ? "IN_PROGRESS" : formattedStatus;
      }
      if (filters.priority && filters.priority !== "All") {
        query.priority = filters.priority.toUpperCase();
      }
      if (filters.category && filters.category !== "All") {
        query.category = filters.category.toUpperCase();
      }
      if (filters.raisedByType && filters.raisedByType !== "All") {
        let role = filters.raisedByType.toUpperCase().replace(" ", "_");
        query.raisedByType = role;
      }

      if (search) {
        query.$or = [
          { ticketID: { $regex: search, $options: "i" } },
          { subject: { $regex: search, $options: "i" } },
        ];
      }

      const skip = (page - 1) * limit;

      // Handle sorting
      let sortConfig = { createdAt: -1 }; // default newest
      if (sort === "oldest") {
        sortConfig = { createdAt: 1 };
      }

      const [tickets, total] = await Promise.all([
        supportsModel
          .find(query)
          .populate("assignedTo", "firstName lastName")
          .sort(sortConfig)
          .skip(skip)
          .limit(limit)
          .lean(),
        supportsModel.countDocuments(query),
      ]);

      for (const ticket of tickets) {
        if (ticket.raisedBy) {
          if (ticket.raisedByType === "PET_OWNER") {
            ticket.raisedBy = await petOwnerProfileModel.findById(ticket.raisedBy).select("firstName lastName email phone phoneNumber profilePicture createdAt").lean();
          } else if (ticket.raisedByType === "PET_SITTER") {
            ticket.raisedBy = await PetSitterModel.findById(ticket.raisedBy).select("firstName lastName email phone phoneNumber profilePicture createdAt").lean();
          } else if (ticket.raisedByType === "ADMIN") {
            ticket.raisedBy = await petBuddyUsersModel.findById(ticket.raisedBy).select("firstName lastName email phone phoneNumber profilePicture createdAt").lean();
          }
        }
      }

      return {
        tickets,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error in SupportService.fetchTickets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch a single ticket by ID
   */
  async fetchTicketById(id) {
    try {
      const ticket = await supportsModel
        .findById(id)
        .populate("assignedTo", "firstName lastName email")
        .populate("escalatedTo", "firstName lastName email")
        .populate("resolvedBy", "firstName lastName email")
        .populate("notes.author", "firstName lastName email")
        .populate({
          path: "bookingID",
          populate: [
            { path: "ownerID", select: "firstName lastName email phone phoneNumber" },
            { path: "sitterID", select: "firstName lastName email phone phoneNumber" }
          ]
        })
        .lean();

      if (ticket && ticket.raisedBy) {
        if (ticket.raisedByType === "PET_OWNER") {
          ticket.raisedBy = await petOwnerProfileModel.findById(ticket.raisedBy).select("firstName lastName email phone phoneNumber profilePicture createdAt").lean();
        } else if (ticket.raisedByType === "PET_SITTER") {
          ticket.raisedBy = await PetSitterModel.findById(ticket.raisedBy).select("firstName lastName email phone phoneNumber profilePicture createdAt").lean();
        } else if (ticket.raisedByType === "ADMIN") {
          ticket.raisedBy = await petBuddyUsersModel.findById(ticket.raisedBy).select("firstName lastName email phone phoneNumber profilePicture createdAt").lean();
        }
      }

      return ticket;
    } catch (error) {
      logger.error(`Error in SupportService.fetchTicketById: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update the status of a ticket
   */
  async updateStatus(id, data, adminId) {
    try {
      const ticket = await supportsModel.findById(id);
      if (!ticket) return null;

      const updateData = {};
      const timelineEntries = [];

      let adminName = "System";
      if (adminId) {
        const admin = await petBuddyUsersModel.findById(adminId);
        if (admin) adminName = `${admin.firstName} ${admin.lastName}`;
      }

      // Handle status update
      const resolvedStatus = data.status || (data.assigneeId ? "IN_PROGRESS" : null);
      if (resolvedStatus && resolvedStatus !== ticket.status) {
        updateData.status = resolvedStatus;
        if (resolvedStatus === "RESOLVED") {
          updateData.resolvedAt = new Date();
          if (adminId) updateData.resolvedBy = adminId;
        } else if (resolvedStatus === "CLOSED") {
          updateData.closedAt = new Date();
        }

        let actionName = `${resolvedStatus.charAt(0) + resolvedStatus.slice(1).toLowerCase().replace("_", " ")} Ticket`;
        if (
          (ticket.status === "RESOLVED" || ticket.status === "CLOSED") &&
          (resolvedStatus === "OPEN" || resolvedStatus === "IN_PROGRESS")
        ) {
          actionName = "Ticket Reopened";
        }

        timelineEntries.push({
          action: actionName,
          by: adminName,
          performedBy: adminId,
          details: `Ticket status updated from ${ticket.status} to ${resolvedStatus}.`,
          date: new Date()
        });
      }

      // Handle ticket assignment
      if (data.assigneeId && String(data.assigneeId) !== String(ticket.assignedTo)) {
        updateData.assignedTo = data.assigneeId;
        updateData.assignedAt = new Date();

        const assignee = await petBuddyUsersModel.findById(data.assigneeId);
        const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName}` : "Unknown Admin";

        timelineEntries.push({
          action: "Ticket Assigned",
          by: adminName,
          performedBy: adminId,
          details: `Ticket assigned to ${assigneeName}.`,
          date: new Date()
        });
      }

      // Handle ticket escalation
      if (data.escalateToId && String(data.escalateToId) !== String(ticket.escalatedTo)) {
        updateData.escalatedTo = data.escalateToId;
        updateData.escalatedAt = new Date();
        updateData.priority = "URGENT";

        const escalateTo = await petBuddyUsersModel.findById(data.escalateToId);
        const escalateToName = escalateTo ? `${escalateTo.firstName} ${escalateTo.lastName}` : "Unknown Admin";

        timelineEntries.push({
          action: "Ticket Escalated",
          by: adminName,
          performedBy: adminId,
          details: `Ticket escalated to ${escalateToName} with URGENT priority.`,
          date: new Date()
        });
      }

      const updatedTicket = await supportsModel.findByIdAndUpdate(
        id,
        { 
          $set: updateData,
          $push: { timeline: { $each: timelineEntries } }
        },
        { new: true }
      )
      .populate("assignedTo", "firstName lastName email")
      .populate("escalatedTo", "firstName lastName email")
      .populate("resolvedBy", "firstName lastName email")
      .lean();

      return updatedTicket;
    } catch (error) {
      logger.error(`Error in SupportService.updateStatus: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add a note to a ticket
   */
  async addNote(id, authorId, content) {
    try {
      const admin = await petBuddyUsersModel.findById(authorId);
      const adminName = admin ? `${admin.firstName} ${admin.lastName}` : "System";

      const updatedTicket = await supportsModel.findByIdAndUpdate(
        id,
        { 
          $push: { 
            notes: { 
              author: authorId, 
              content: content, 
              createdAt: new Date() 
            },
            timeline: {
              action: "Note Added",
              by: adminName,
              performedBy: authorId,
              details: content.length > 60 ? `${content.substring(0, 60)}...` : content,
              date: new Date()
            }
          } 
        },
        { new: true }
      ).populate("notes.author", "firstName lastName email").lean();

      return updatedTicket;
    } catch (error) {
      logger.error(`Error in SupportService.addNote: ${error.message}`);
      throw error;
    }
  }

  async editNote(id, noteId, authorId, content) {
    try {
      const ticket = await supportsModel.findById(id);
      if (!ticket) return null;
      
      const note = ticket.notes.id(noteId);
      if (!note) return null;

      note.content = content;
      note.isEdited = true;
      note.editedAt = new Date();
      note.editedBy = authorId;

      const admin = await petBuddyUsersModel.findById(authorId);
      const adminName = admin ? `${admin.firstName} ${admin.lastName}` : "System";

      ticket.timeline.push({
        action: "Note Edited",
        by: adminName,
        performedBy: authorId,
        details: content.length > 60 ? `${content.substring(0, 60)}...` : content,
        date: new Date()
      });

      await ticket.save();
      return await supportsModel.findById(id).populate("notes.author", "firstName lastName email").lean();
    } catch (error) {
      logger.error(`Error in SupportService.editNote: ${error.message}`);
      throw error;
    }
  }


}

module.exports = new SupportService();
