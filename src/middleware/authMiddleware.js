const jwt = require("jsonwebtoken");
const petBuddyUsersModel = require("../models/petBuddyUsersModel");

exports.authorization = async (req, res, next) => {
  const publicPaths = [
    "/api/auth/check",
    "/api/auth/send-otp",
    "/api/auth/verify-otp",
    "/api/auth/login",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/supports/raiseTicket",
    "/api/supports/support-tickets",
    "/welcome",
    "/swagger.json",
    "/",
  ];
  ///////////////////////////
  // If the path is in the public list, or starts with /api-docs, skip token check
  if (publicPaths.includes(req.path) || req.path.startsWith("/api-docs")) {
    return next();
  }

  try {
    let token;

    // 1. Get token from cookies or Authorization header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ error: "Not authorized to access this route. Please log in." });
    }

    // 2. Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret-fallback",
    );

    // 3. Find admin and attach to request
    // Support both 'id' (Admin Token) and 'userId' (Pet Owner/Sitter Token)
    const tokenUserId = decoded.id || decoded.userId;

    let admin = await petBuddyUsersModel
      .findById(tokenUserId)
      .select("-password");
      
    // If not found in admin model, check pet owners model for cross-API calls
    if (!admin) {
      const petOwnersProfileModel = require("../models/petOwnersProfileModel");
      admin = await petOwnersProfileModel.findById(tokenUserId).select("-password");
    }

    if (!admin) {
      return res
        .status(401)
        .json({ error: "The user belonging to this token no longer exists." });
    }

    // Note: If you want to force logout when password changes:
    // if (admin.passwordChangedAt) {
    //   const changedTimestamp = parseInt(admin.passwordChangedAt.getTime() / 1000, 10);
    //   if (decoded.iat < changedTimestamp) {
    //     return res.status(401).json({ error: "User recently changed password! Please log in again." });
    //   }
    // }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
