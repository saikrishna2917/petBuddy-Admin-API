const petSitterKYCModel = require("../models/petSitterKYCModel");
const PetSitter = require("../models/petSitterModel");
const PetSitterSchedule = require("../models/petSitterScheduleModel");
const logger = require("../utils/logger");

/**
 * @helper getSitterWithAvailability
 * @description Appends active availability status ("Available" / "Unavailable") to a pet sitter.
 */
const getSitterWithAvailability = async (sitter) => {
  const now = new Date();
  const activeSchedule = await PetSitterSchedule.findOne({
    petSetterID: sitter._id.toString(),
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  return {
    ...sitter.toObject(),
    availability: activeSchedule ? "Available" : "Unavailable",
  };
};

/**
 * @function getSitterStats
 * @description Fetches total count, pending, approved, and rejected sitters.
 */
exports.getSitterStats = async (req, res) => {
  try {
    logger.info("Fetching sitter stats for dashboard");
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

    const blockedSitters = await PetSitter.countDocuments({
      isDeleted: false,
      status: "BLOCKED",
    });

    logger.info(
      `Sitter stats fetched successfully: total=${totalSitters}, pending=${pendingSitters}, verified=${verifiedSitters}, rejected=${rejectedSitters}`,
    );
    return res.status(200).json({
      success: true,
      stats: {
        total: totalSitters,
        pending: pendingSitters,
        verified: verifiedSitters,
        rejected: rejectedSitters,
        blocked: blockedSitters,
      },
    });
  } catch (error) {
    logger.error(`Error in getSitterStats: ${error.message}`);
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
    logger.info(
      `Fetching sitters list - Search: "${search || ""}", Status: "${status || ""}", Page: ${page}, Limit: ${limit}`,
    );

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

    const [totalSitters, pendingSitters, verifiedSitters, rejectedSitters, blockedSitters] = await Promise.all([
      PetSitter.countDocuments({ isDeleted: false }),
      PetSitter.countDocuments({ isDeleted: false, status: "PENDING" }),
      PetSitter.countDocuments({ isDeleted: false, status: "APPROVED" }),
      PetSitter.countDocuments({ isDeleted: false, status: "REJECTED" }),
      PetSitter.countDocuments({ isDeleted: false, status: "BLOCKED" }),
    ]);

    // Map sitters and fetch availability from schedule model using common helper function
    logger.info(`Resolving availability for ${sitters.length} sitters`);
    const sittersWithAvailability = await Promise.all(
      sitters.map((sitter) => getSitterWithAvailability(sitter)),
    );

    logger.info(
      `Sitters list fetched successfully (Total count: ${totalCount})`,
    );
    return res.status(200).json({
      success: true,
      stats: {
        total: totalSitters,
        pending: pendingSitters,
        verified: verifiedSitters,
        rejected: rejectedSitters,
        blocked: blockedSitters,
      },
      data: sittersWithAvailability,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error(`Error in getSittersList: ${error.message}`);
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
    logger.info(`Attempting status update for sitter ${id} to ${status}`);

    if (
      !status ||
      !["PENDING", "APPROVED", "REJECTED", "BLOCKED"].includes(
        status.toUpperCase(),
      )
    ) {
      logger.warn(
        `Invalid status change attempt for sitter ${id}: "${status}"`,
      );
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
      logger.warn(`Sitter not found for status update: ${id}`);
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
    logger.info(`Sitter ${id} status updated successfully to ${upperStatus}`);
    return res.status(200).json({
      success: true,
      message: `Sitter status updated to ${upperStatus} successfully.`,
      data,
    });
  } catch (error) {
    logger.error(`Error in updateSitterStatus: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};

/**
 * @function getSitterDetails
 * @description Fetches all details of a single pet sitter for profile verification.
 */
exports.getSitterDetails = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Fetching details for pet sitter: ${id}`);
    const sitter = await PetSitter.findOne({
      _id: id,
      isDeleted: false,
    }).select("-password");

    if (!sitter) {
      logger.warn(`Pet Sitter details not found for ID: ${id}`);
      return res.status(404).json({
        success: false,
        error: "Pet Sitter not found.",
      });
    }
    logger.info(`Pet Sitter found & Fetching the pet sitter availability`);
    const sitterWithAvailability = await getSitterWithAvailability(sitter);
    logger.info(`Pet Sitter availability fetched successfully`);

    logger.info(`Fetching the pet sitter KYC data`);
    let kycData = await petSitterKYCModel
      .findOne({
        petSitterID: id,
        isDeleted: false,
      })
      .select({
        governmentIDType: 1,
        selfieImage: 1,
        governmentIDNumber: 1,
        governmentIDFrontImage: 1,
        governmentIDBackImage: 1,
        backgroundVerificationStatus: 1,
        rejectionReason: 1,
        verifiedBy: 1,
        verifiedOn: 1,
      });

    if (!kycData) {
      logger.info(`No KYC Data found for the sitter: ${id}`);
      kycData = {};
    }
    logger.info(`KYC Data fetched successfully for sitter ${id}`);

    return res.status(200).json({
      success: true,
      sitter: sitterWithAvailability,
      kycData,
    });
  } catch (error) {
    logger.error(`Error in getSitterDetails: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};
