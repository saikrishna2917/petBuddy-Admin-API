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

      const newTicket = new supportsModel({
        ...data,
        ticketID,
        status: "OPEN",
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
        .populate("assignedTo", "firstName lastName")
        .populate("notes.author", "firstName lastName email")
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
  async updateStatus(id, newStatus, resolvedBy) {
    try {
      const updateData = { status: newStatus };

      if (newStatus === "RESOLVED") {
        updateData.resolvedAt = new Date();
        if (resolvedBy) updateData.resolvedBy = resolvedBy;
      } else if (newStatus === "CLOSED") {
        updateData.closedAt = new Date();
      }

      const updatedTicket = await supportsModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );

      return updatedTicket;
    } catch (error) {
      logger.error(`Error in SupportService.updateStatus: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new SupportService();
