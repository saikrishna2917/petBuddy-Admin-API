const jwt = require("jsonwebtoken");
const logger = require("./logger");

async function generateToken(id, role, firstName, lastName) {
  try {
    logger.info(
      `Entered into generate token function and generating the token for the ${role} with id ${id}`,
    );
    return jwt.sign(
      {
        id,
        role,
        firstName,
        lastName,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );
  } catch (err) {
    logger.error(`Error in generateToken: ${err.message}`);
    throw err;
  }
}

module.exports = generateToken;
