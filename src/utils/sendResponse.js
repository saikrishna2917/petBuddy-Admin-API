const logger = require("./logger");
const httpStatus = require("./httpStatusCodes");

async function sendResponse(err, res) {
  try {
    // Log the error for debugging purposes
    logger.error("Error caught in sendResponse:", err);

    // If the error is already formatted as a JSON string, parse it and send the response
    try {
      const parsedError = JSON.parse(err.message);
      if (
        parsedError.code &&
        Array.isArray(parsedError.errors) &&
        parsedError.errors.length > 0
      ) {
        res.status(parsedError.code).send(parsedError);
        return;
      }
    } catch (parseError) {
      // If parsing fails, it means the error is not in the custom format, so we handle it below
    }

    // Handle MongoDB errors
    if (err.name === "MongoNetworkError") {
      res.status(httpStatus.SERVICE_UNAVAILABLE).send({
        code: httpStatus.SERVICE_UNAVAILABLE,
        errors: [
          { message: "Database connection error. Please try again later." },
        ],
      });
    } else if (err.name === "MongoError") {
      res.status(httpStatus.SERVICE_UNAVAILABLE).send({
        code: httpStatus.SERVICE_UNAVAILABLE,
        errors: [
          { message: "Database operation failed. Please try again later." },
        ],
      });
    }
    // Handle Axios errors from twoFactorService
    else if (err.isAxiosError) {
      if (err.response) {
        res.status(err.response.status || httpStatus.BAD_GATEWAY).send({
          code: err.response.status || httpStatus.BAD_GATEWAY,
          errors: [
            {
              message:
                err.response.data?.message ||
                "Unable to process. Please try again later.",
            },
          ],
        });
      } else if (err.request) {
        res.status(httpStatus.SERVICE_UNAVAILABLE).send({
          code: httpStatus.SERVICE_UNAVAILABLE,
          errors: [
            {
              message:
                "No response from the OTP service. Please try again later.",
            },
          ],
        });
      } else {
        res.status(httpStatus.BAD_GATEWAY).send({
          code: httpStatus.BAD_GATEWAY,
          errors: [
            { message: "Error setting up OTP request. Please try again." },
          ],
        });
      }
    }
    // Handle unexpected errors
    else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        code: httpStatus.INTERNAL_SERVER_ERROR,
        errors: [
          { message: "An unexpected error occurred. Please try again." },
        ],
      });
    }
  } catch (errorHandlingError) {
    logger.error("Error in sendResponse error handler:", errorHandlingError);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      code: httpStatus.INTERNAL_SERVER_ERROR,
      errors: [
        { message: "An unexpected error occurred during error handling." },
      ],
    });
  }
}

module.exports = sendResponse;
