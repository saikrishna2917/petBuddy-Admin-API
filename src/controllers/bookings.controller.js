const bookingsModel = require("../models/bookingsModel");
const paymentsModel = require("../models/paymentsModel");
const petsModel = require("../models/petsModel");
const petOwnerProfileModel = require("../models/petOwnersProfileModel");
const PetSitterModel = require("../models/petSitterModel");
const logger = require("../utils/logger");

/**
 * @function getAllBookings
 * @description List all bookings with pagination, status filtering, and search by booking ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getAllBookings = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    let query = {};

    if (search) {
      // Allow searching by booking ID (case-insensitive partial match)
      query.bookingID = { $regex: search, $options: "i" };
    }

    if (status) {
      query.status = { $in: [status] };
    } else {
      query.status = {
        $in: [
          "BOOKED",
          "RE_SCHEDULED",
          "IN_PROGRESS",
          "CANCELLED",
          "COMPLETED",
        ],
      };
    }

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const [bookings, total, statsResult] = await Promise.all([
      bookingsModel
        .find(query)
        .populate("ownerID", "firstName lastName email")
        .populate("sitterID", "firstName lastName email")
        .sort({ createdOn: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      bookingsModel.countDocuments(query),
      bookingsModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    // Parse aggregate results into a simple stats object
    const stats = {
      total: 0,
      bookedRescheduled: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    };

    statsResult.forEach((stat) => {
      stats.total += stat.count;
      if (["BOOKED", "RE_SCHEDULED"].includes(stat._id))
        stats.bookedRescheduled += stat.count;
      else if (stat._id === "IN_PROGRESS") stats.inProgress += stat.count;
      else if (stat._id === "COMPLETED") stats.completed += stat.count;
      else if (stat._id === "CANCELLED") stats.cancelled += stat.count;
    });

    // Format the data for the frontend table
    const formattedBookings = bookings.map((b) => {
      // Safely extract names and emails
      const ownerName = b.ownerID
        ? `${b.ownerID.firstName || ""} ${b.ownerID.lastName || ""}`.trim()
        : "Unknown Owner";
      const ownerEmail = b.ownerID ? b.ownerID.email : "N/A";

      const sitterName = b.sitterID
        ? `${b.sitterID.firstName || ""} ${b.sitterID.lastName || ""}`.trim()
        : "Unknown Sitter";
      const sitterEmail = b.sitterID ? b.sitterID.email : "N/A";

      // Format dates (e.g. 2025-08-01)
      const startDateFormatted = b.startDate
        ? new Date(b.startDate).toISOString().split("T")[0]
        : "N/A";
      const endDateFormatted = b.endDate
        ? new Date(b.endDate).toISOString().split("T")[0]
        : "N/A";

      let totalDays = 0;
      if (b.startDate && b.endDate) {
        const diffTime = Math.abs(new Date(b.endDate) - new Date(b.startDate));
        totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: b._id,
        bookingID: b.bookingID || "N/A",
        ownerDetails: {
          name: ownerName,
          email: ownerEmail,
        },
        sitterDetails: {
          name: sitterName,
          email: sitterEmail,
        },
        timeline: {
          start: startDateFormatted,
          end: endDateFormatted,
          totalDays: totalDays,
        },
        status: b.status || "PENDING",
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedBookings,
      stats: stats,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    logger.error(`Error in getAllBookings: ${error.message}`);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};

/**
 * @function getBookingById
 * @description Get a single booking by its ID with populated references
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await bookingsModel
      .findById(id)
      .populate("ownerID", "firstName lastName email phoneNumber city state")
      .populate("sitterID", "firstName lastName email phoneNumber city state")
      .populate("petID")
      .populate("paymentID")
      .lean();

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Format the response
    const startDateFormatted = booking.startDate
      ? new Date(booking.startDate).toISOString().split("T")[0]
      : "N/A";
    const endDateFormatted = booking.endDate
      ? new Date(booking.endDate).toISOString().split("T")[0]
      : "N/A";

    let totalDays = 0;
    if (booking.startDate && booking.endDate) {
      const diffTime = Math.abs(
        new Date(booking.endDate) - new Date(booking.startDate),
      );
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const formattedBooking = {
      id: booking._id,
      bookingID: booking.bookingID || "N/A",
      ownerDetails: booking.ownerID || null,
      sitterDetails: booking.sitterID || null,
      petDetails: booking.petID
        ? {
            name: booking.petID.petName,
            breed: booking.petID.breed,
            age: booking.petID.age,
            weight: booking.petID.weight,
          }
        : null,
      paymentDetails: booking.paymentID || null,
      timeline: {
        start: startDateFormatted,
        end: endDateFormatted,
        totalDays: totalDays,
        createdOn: booking.createdAt || booking.createdOn || new Date(),
      },
      status: booking.status || "PENDING",
      specialInstructions: booking.specialInstructions || "",
      cost: booking.cost || 0,
    };

    return res.status(200).json({
      success: true,
      data: formattedBooking,
    });
  } catch (error) {
    logger.error(`Error in getBookingById: ${error.message}`);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};
