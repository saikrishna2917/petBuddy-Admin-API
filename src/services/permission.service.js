const screenPermissionModel = require("../models/screenPermissionModel");
const logger = require("../utils/logger");

async function getPermissionsList(role) {
  try {
    // Auto-create default full-access permissions for SUPER_ADMIN if missing
    const superAdminExists = await screenPermissionModel.findOne({ role: "SUPER_ADMIN" });
    if (!superAdminExists) {
      await screenPermissionModel.create({
        role: "SUPER_ADMIN",
        dashboardScreen: true,
        bookingScreen: true,
        usersScreen: true,
        supportScreen: true,
      });
    }

    const query = role ? { role } : {};
    let list = await screenPermissionModel.find(query).lean();
    
    return role ? list[0] || null : list;
  } catch (error) {
    logger.error(
      `Error in PermissionService.getPermissionsList: ${error.message}`,
    );
    throw error;
  }
}

async function addOrUpdatePermissions(role, data) {
  try {
    console.log(role, "role", data);
    const updated = await screenPermissionModel
      .findOneAndUpdate(
        { role },
        {
          $set: {
            dashboardScreen: data.dashboardScreen ?? false,
            bookingScreen: data.bookingScreen ?? false,
            usersScreen: data.usersScreen ?? false,
            supportScreen: data.supportScreen ?? false,
          },
        },
        { new: true, upsert: true },
      )
      .lean();
    return updated;
  } catch (error) {
    logger.error(
      `Error in PermissionService.addOrUpdatePermissions: ${error.message}`,
    );
    throw error;
  }
}

/**
 * Delete screen permissions completely for a role.
 */
async function deleteRolePermissions(role) {
  try {
    const result = await screenPermissionModel.findOneAndDelete({ role });
    return result;
  } catch (error) {
    logger.error(
      `Error in PermissionService.deleteRolePermissions: ${error.message}`,
    );
    throw error;
  }
}

exports.permissionServices = {
  getPermissionsList,
  addOrUpdatePermissions,
  deleteRolePermissions,
};
