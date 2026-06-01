const notificationsModel = require("../models/notificationsModel");
const logger = require("../utils/logger");

class NotificationsService {
  /**
   * Fetch notifications for a user with pagination
   */
  async fetchNotifications(
    { userID, userType, showFor },
    page = 1,
    limit = 20,
    isRead = null,
  ) {
    try {
      const baseQuery = { isDeleted: false, channel: "PUSH" };

      if (userID) {
        if (showFor) {
          baseQuery.$or = [{ userID, userType }, { showFor }];
        } else {
          baseQuery.userID = userID;
          if (userType) baseQuery.userType = userType;
        }
      } else if (showFor) {
        baseQuery.showFor = showFor;
      }

      const query = { ...baseQuery };
      if (isRead !== null && isRead !== undefined) {
        query.isRead = isRead;
      }

      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        notificationsModel
          .find(query)
          .sort({ createdAt: -1 })
          .select({
            _id: 1,
            title: 1,
            message: 1,
            isRead: 1,
            createdAt: 1,
            readAt: 1,
            notificationFor: 1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),
        notificationsModel.countDocuments(query),
        notificationsModel.countDocuments({ ...baseQuery, isRead: false }),
      ]);

      return {
        notifications,
        unreadCount,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(
        `Error in NotificationsService.fetchNotifications: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update isRead status for multiple notifications
   */
  async markAsRead(notificationIDs, userID) {
    try {
      const query = { _id: { $in: notificationIDs } };
      if (userID) {
        query.$or = [{ userID }, { showFor: { $exists: true } }];
      }

      const result = await notificationsModel.updateMany(query, {
        $set: { isRead: true, readAt: new Date() },
      });
      return result;
    } catch (error) {
      logger.error(
        `Error in NotificationsService.markAsRead: ${error.message}`,
      );
      throw error;
    }
  }
}

module.exports = new NotificationsService();
