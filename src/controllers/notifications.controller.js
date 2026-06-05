const notificationsService = require("../services/notifications.service");
const logger = require("../utils/logger");

exports.getNotifications = async (req, res) => {
  try {
    console.log(req.query, "Query--------->>>>>>>>");
    let { userID, userType, showFor, page, limit, isRead } = req.query;

    // Extract from token if available
    if (req.admin) {
      if (!userID) userID = req.admin._id;
      if (!showFor) showFor = "ADMIN";
    } else if (req.user) {
      if (!userID) userID = req.user._id;
    }

    // No mandatory fields; if empty, it will fetch all notifications

    let isReadFilter = null;
    if (isRead === "true" || isRead === true) isReadFilter = true;
    if (isRead === "false" || isRead === false) isReadFilter = false;

    const result = await notificationsService.fetchNotifications(
      { userID, userType, showFor },
      parseInt(page) || 1,
      parseInt(limit) || 20,
      isReadFilter,
    );

    return res.status(200).json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error(`Controller Error - getNotifications: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    let { notificationIDs, userID } = req.body;

    // Extract userID from token if available and not provided in body
    if (!userID) {
      if (req.admin) userID = req.admin._id;
      else if (req.user) userID = req.user._id;
    }

    if (
      !notificationIDs ||
      !Array.isArray(notificationIDs) ||
      notificationIDs.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "notificationIDs array is required" });
    }

    await notificationsService.markAsRead(notificationIDs, userID);

    return res.status(200).json({
      success: true,
      message: "Notifications marked as read successfully",
    });
  } catch (error) {
    logger.error(`Controller Error - markNotificationsRead: ${error.message}`);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to mark notifications as read",
      });
  }
};
