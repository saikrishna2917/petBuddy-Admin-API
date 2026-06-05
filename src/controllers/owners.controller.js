const PetOwnerProfile = require("../models/petOwnersProfileModel");
const petsModel = require("../models/petsModel");
const logger = require("../utils/logger");

/**
 * @function getOwnersList
 * @description Fetches all pet owners with search, filter, and calculates stats.
 */
exports.getOwnersList = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    logger.info(
      `Fetching owners list - Search: "${search || ""}", Status: "${status || ""}", Page: ${page}, Limit: ${limit}`,
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
    console.log(query, "query", status, "status")
    const skipIndex = (parseInt(page) - 1) * parseInt(limit);

    const owners = await PetOwnerProfile.find(query)
      .sort({ createdAt: -1 })
      .select({
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        phoneNumber: 1,
        countryCode: 1,
        status: 1,
        isVerified: 1,
        createdAt: 1,
        profilePicture: 1,
      })
      .limit(parseInt(limit))
      .skip(skipIndex)
      .lean();
    
    const totalCount = await PetOwnerProfile.countDocuments(query);
    const petsArray = owners.map((owner) => owner._id);
    const petsData = await petsModel.find({ isDeleted: false, petOwnerID: { $in: petsArray } });

    const petCountByOwner = {};
    petsData.forEach((pet) => {
      const ownerId = pet.petOwnerID.toString();
      petCountByOwner[ownerId] = (petCountByOwner[ownerId] || 0) + 1;
    });

    owners.forEach((owner) => {
      owner.petsCount = petCountByOwner[owner._id.toString()] || 0;
    });

    const [totalOwners, activeOwners, blockedOwners] = await Promise.all([
      PetOwnerProfile.countDocuments({ isDeleted: false }),
      PetOwnerProfile.countDocuments({ isDeleted: false, status: "ACTIVE" }),
      PetOwnerProfile.countDocuments({ isDeleted: false, status: "BLOCKED" }),
    ]);

    logger.info(
      `Owners list fetched successfully (Total count: ${totalCount})`,
    );
    return res.status(200).json({
      success: true,
      stats: {
        total: totalOwners,
        active: activeOwners,
        blocked: blockedOwners,
        pets: petsData.length, // Note: pet model not found, returning 0 for now
      },
      data: owners,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error(`Error in getOwnersList: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};

/**
 * @function getOwnerDetails
 * @description Fetches all details of a single pet owner.
 */
exports.getOwnerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Fetching details for pet owner: ${id}`);
    const owner = await PetOwnerProfile.findOne({
      _id: id,
      isDeleted: false,
    }).select("-password");

    if (!owner) {
      logger.warn(`Pet Owner details not found for ID: ${id}`);
      return res.status(404).json({
        success: false,
        error: "Pet Owner not found.",
      });
    }

    logger.info(`Pet Owner details fetched successfully`);
    return res.status(200).json({
      success: true,
      data: owner,
    });
  } catch (error) {
    logger.error(`Error in getOwnerDetails: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};

/**
 * @function updateOwnerStatus
 * @description Updates the status of a pet owner (e.g., BLOCKED, ACTIVE).
 */
exports.updateOwnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    logger.info(`Attempting status update for owner ${id} to ${status}`);

    if (
      !status ||
      !["ACTIVE", "BLOCKED", "INACTIVE"].includes(status.toUpperCase())
    ) {
      logger.warn(`Invalid status change attempt for owner ${id}: "${status}"`);
      return res.status(400).json({
        success: false,
        error: "Invalid status value.",
      });
    }

    const upperStatus = status.toUpperCase();

    const owner = await PetOwnerProfile.findByIdAndUpdate(
      id,
      { status: upperStatus },
      { new: true }
    );

    if (!owner || owner.isDeleted) {
      logger.warn(`Owner not found for status update: ${id}`);
      return res.status(404).json({
        success: false,
        error: "Pet Owner not found.",
      });
    }

    const data = {
      _id: owner._id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phoneNumber: owner.phoneNumber,
      status: owner.status,
    };
    logger.info(`Owner ${id} status updated successfully to ${upperStatus}`);
    return res.status(200).json({
      success: true,
      message: `Owner status updated to ${upperStatus} successfully.`,
      data,
    });
  } catch (error) {
    logger.error(`Error in updateOwnerStatus: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};

/**
 * @function deleteOwner
 * @description Soft deletes a pet owner by setting isDeleted to true.
 */
exports.deleteOwner = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Attempting to delete owner: ${id}`);

    const owner = await PetOwnerProfile.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!owner) {
      logger.warn(`Owner not found for deletion: ${id}`);
      return res.status(404).json({
        success: false,
        error: "Pet Owner not found.",
      });
    }

    logger.info(`Owner ${id} deleted successfully`);
    return res.status(200).json({
      success: true,
      message: "Pet Owner deleted successfully.",
    });
  } catch (error) {
    logger.error(`Error in deleteOwner: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};
