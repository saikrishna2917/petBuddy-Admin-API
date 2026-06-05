const logger = require("../utils/logger");
const reviewAndRatingModel = require("../models/reviewsAndRatingModel");
const petOwnerProfileModel = require("../models/petOwnersProfileModel");
const petSitterModel = require("../models/petSitterModel");
const bookingsModel = require("../models/bookingsModel");
const petsModel = require("../models/petsModel");

/**
 * Fetches a paginated list of review and ratings based on query parameters.
 * @param {Object} queryParams - Query parameters for filtering and pagination.
 * @returns {Promise<Object>} - The response object with review and ratings list.
 */
async function fcnGetReviewAndRatings(queryParams) {
  try {
    logger.info("Starting fcnGetReviewAndRatings service method.");
    const {
      page = 1,
      limit = 10,
      search,
      sort,
      rating,
      reviewID,
    } = queryParams;
    const skip = (page - 1) * limit;

    logger.info(
      `Pagination settings - Page: ${page}, Limit: ${limit}, Skip: ${skip}`,
    );

    const filterQuery = {};

    if (search) {
      logger.info(`Applying search filter with term: ${search}`);
      filterQuery.$or = [
        { reviewID: { $regex: search, $options: "i" } },
        { bookingID: { $regex: search, $options: "i" } },
        { ownerID: { $regex: search, $options: "i" } },
        { sitterID: { $regex: search, $options: "i" } },
        { reviewTitle: { $regex: search, $options: "i" } },
        { review: { $regex: search, $options: "i" } },
      ];
    }

    if (rating) {
      logger.info(`Applying rating filter: ${rating}`);
      // rating can be a single number or an array/comma-separated if we want, assuming single string/number for now
      filterQuery.rating = Number(rating);
    }

    if (reviewID) {
      logger.info(`Applying reviewID filter: ${reviewID}`);
      filterQuery.reviewID = reviewID;
    }

    let sortQuery = { createdAt: -1 }; // default newest to oldest
    if (sort === "oldest") {
      logger.info("Applying sort: oldest to newest");
      sortQuery = { createdAt: 1 };
    } else if (sort === "newest") {
      logger.info("Applying sort: newest to oldest");
      sortQuery = { createdAt: -1 };
    } else {
      logger.info("Applying default sort: newest to oldest");
    }

    logger.info(
      `Executing find query on reviewAndRatingModel with filters: ${JSON.stringify(filterQuery)}`,
    );
    const reviews = await reviewAndRatingModel
      .find(filterQuery)
      .sort(sortQuery)
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    logger.info(
      "Manually fetching and binding owner, sitter, and booking details.",
    );
    const ownerIDs = [
      ...new Set(reviews.map((r) => r.ownerID).filter(Boolean)),
    ];
    const sitterIDs = [
      ...new Set(reviews.map((r) => r.sitterID).filter(Boolean)),
    ];

    const owners = await petOwnerProfileModel
      .find(
        { _id: { $in: ownerIDs } },
        "firstName lastName email profilePicture",
      )
      .lean();

    const sitters = await petSitterModel
      .find(
        { _id: { $in: sitterIDs } },
        "firstName lastName email profilePicture",
      )
      .lean();

    const ownerMap = owners.reduce((acc, owner) => {
      acc[owner._id.toString()] = owner;
      return acc;
    }, {});

    const sitterMap = sitters.reduce((acc, sitter) => {
      acc[sitter._id.toString()] = sitter;
      return acc;
    }, {});

    const enrichedReviews = reviews.map((review) => {
      const owner = review.ownerID ? ownerMap[review.ownerID.toString()] : null;
      const sitter = review.sitterID
        ? sitterMap[review.sitterID.toString()]
        : null;

      // Determine status based on schema flags
      let currentStatus = "Active";
      if (review.isDeleted) {
        currentStatus = "Hidden";
      } else if (review.isReported) {
        currentStatus = "Under Investigation";
      }

      return {
        reviewID: review.reviewID,
        usersDetails: {
          sitter: sitter
            ? {
                name: `${sitter.firstName || ""} ${sitter.lastName || ""}`.trim(),
                avatar: sitter.profilePicture || null,
              }
            : null,
          owner: owner
            ? {
                name: `${owner.firstName || ""} ${owner.lastName || ""}`.trim(),
                avatar: owner.profilePicture || null,
              }
            : null,
        },
        ratingAndComment: {
          rating: review.rating,
          comment: review.review,
        },
        bookingInfo: {
          bookingID: review.bookingID,
          submitted: review.createdAt,
        },
        status: currentStatus,
        isDeleted: review.isDeleted,
        isReported: review.isReported,
      };
    });

    logger.info("Executing countDocuments query to get total reviews count.");
    const totalCount = await reviewAndRatingModel.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalCount / limit);

    logger.info("Successfully fetched review and ratings data.");
    return {
      reviews: enrichedReviews,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      },
    };
  } catch (err) {
    logger.error(`Error while fetching the review and ratings: ${err.message}`);
    throw err;
  }
}

async function fcnGetReviewById(reviewID) {
  try {
    logger.info(
      `Starting fcnGetReviewById service method for reviewID: ${reviewID}`,
    );
    const review = await reviewAndRatingModel.findOne({ reviewID }).lean();

    if (!review) {
      logger.info(`Review not found for reviewID: ${reviewID}`);
      return null;
    }

    logger.info(`Fetching full associated details for reviewID: ${reviewID}`);
    const [owner, sitter, booking, pet] = await Promise.all([
      review.ownerID
        ? petOwnerProfileModel
            .findById(review.ownerID)
            .select({
              _id: 0,
              firstName: 1,
              lastName: 1,
              gender: 1,
              profilePicture: 1,
              phoneNumber: 1,
              email: 1,
            })
            .lean()
        : Promise.resolve(null),
      review.sitterID
        ? petSitterModel
            .findById(review.sitterID)
            .select({
              _id: 0,
              firstName: 1,
              lastName: 1,
              gender: 1,
              profilePicture: 1,
              phoneNumber: 1,
              email: 1,
            })
            .lean()
        : Promise.resolve(null),
      review.bookingID
        ? bookingsModel
            .findOne({ bookingID: review.bookingID })
            .select({
              _id: 0,
              bookingID: 1,
              startDate: 1,
              endDate: 1,
              status: 1,
              paymentStatus: 1,
              specialInstructions: 1,
              cancellationReason: 1,
              paymentID: 1,
              completedOn: 1,
            })
            .lean()
        : Promise.resolve(null),
      review.petID
        ? petsModel
            .findById(review.petID)
            .select({
              _id: 0,
              petName: 1,
              petType: 1,
              breed: 1,
              profilePicture: 1,
            })
            .lean()
        : Promise.resolve(null),
    ]);

    const enrichedReview = {
      ...review,
      ownerDetails: owner || null,
      sitterDetails: sitter || null,
      bookingInfo: booking || null,
      petDetails: pet || null,
    };

    logger.info("Successfully fetched full details for review by ID.");
    return enrichedReview;
  } catch (error) {
    logger.error(`Error while fetching review by ID: ${error.message}`);
    throw error;
  }
}

exports.reviewAndRatingServices = {
  fcnGetReviewAndRatings: fcnGetReviewAndRatings,
  fcnGetReviewById: fcnGetReviewById,
};
