const PetSitter = require("../models/petSitterModel");
const PetSitterSchedule = require("../models/petSitterScheduleModel");

/**
 * @function getSitterStats
 * @description Fetches total count, pending, approved, and rejected sitters.
 */
exports.getSitterStats = async (req, res) => {
  try {
    const totalSitters = await PetSitter.countDocuments({ isDeleted: false });
    const pendingSitters = await PetSitter.countDocuments({
      isDeleted: false,
      status: "PENDING",
    });
    const verifiedSitters = await PetSitter.countDocuments({
      isDeleted: false,
      status: "APPROVED",
    });
    const rejectedSitters = await PetSitter.countDocuments({
      isDeleted: false,
      status: "REJECTED",
    });

    return res.status(200).json({
      success: true,
      stats: {
        total: totalSitters,
        pending: pendingSitters,
        verified: verifiedSitters,
        rejected: rejectedSitters,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};

/**
 * @function getSittersList
 * @description Fetches all sitters with search, filter, and calculates dynamic availability.
 */
exports.getSittersList = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const query = { isDeleted: false };

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
      ];
    }

    // Status filter
    if (status) {
      query.status = status.toUpperCase();
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);

    const sitters = await PetSitter.find(query)
      .sort({ createdOn: -1 })
      .select({
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        phoneNumber: 1,
        countryCode: 1,
        address: 1,
        status: 1,
        isVerified: 1,
        createdOn: 1,
        profilePicture: 1,
      })
      .limit(parseInt(limit))
      .skip(skipIndex);

    const totalCount = await PetSitter.countDocuments(query);

    const now = new Date();

    // Map sitters and fetch availability from schedule model
    const sittersWithAvailability = await Promise.all(
      sitters.map(async (sitter) => {
        // Query if there is any active schedule for this sitter right now
        const activeSchedule = await PetSitterSchedule.findOne({
          petSetterID: sitter._id.toString(),
          startDate: { $lte: now },
          endDate: { $gte: now },
        });

        return {
          ...sitter.toObject(),
          availability: activeSchedule ? "Available" : "Unavailable",
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: sittersWithAvailability,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};

/**
 * @function updateSitterStatus
 * @description Updates the verification status of a pet sitter.
 */
exports.updateSitterStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      !status ||
      !["PENDING", "APPROVED", "REJECTED", "BLOCKED", "INACTIVE"].includes(
        status.toUpperCase(),
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid status value.",
      });
    }

    const upperStatus = status.toUpperCase();
    const isVerified = upperStatus === "APPROVED";

    const sitter = await PetSitter.findByIdAndUpdate(
      id,
      {
        status: upperStatus,
        isVerified,
      },
      { new: true },
    );

    if (!sitter) {
      return res.status(404).json({
        success: false,
        error: "Pet Sitter not found.",
      });
    }
    const data = {
      _id: sitter._id,
      firstName: sitter.firstName,
      lastName: sitter.lastName,
      email: sitter.email,
      phoneNumber: sitter.phoneNumber,
      countryCode: sitter.countryCode,
      status: sitter.status,
      profilePicture: sitter.profilePicture,
    };
    return res.status(200).json({
      success: true,
      message: `Sitter status updated to ${upperStatus} successfully.`,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};
