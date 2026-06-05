const Joi = require("joi");
const { permissionServices } = require("../services/permission.service");
const logger = require("../utils/logger");

// Validation Schemas
const upsertPermissionsSchema = Joi.object({
  role: Joi.string()
    .valid("SUPER_ADMIN", "OPERATIONS_ADMIN", "SUPPORT_ADMIN", "FINANCE_ADMIN")
    .required(),
  screens: Joi.array()
    .items(
      Joi.object({
        screenId: Joi.string().required(),
        screenName: Joi.string().required(),
        read: Joi.boolean().default(false),
        write: Joi.boolean().default(false),
        edit: Joi.boolean().default(false),
        delete: Joi.boolean().default(false),
      }),
    )
    .required(),
});

exports.getPermissions = async (req, res) => {
  try {
    const { role } = req.query;
    const data = await permissionServices.getPermissionsList(role);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(`Controller Error - getPermissions: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch screen permissions",
    });
  }
};

exports.upsertPermissions = async (req, res) => {
  try {
    // const { error, value } = upsertPermissionsSchema.validate(req.body);
    // if (error) {
    //   return res.status(400).json({
    //     success: false,
    //     message: error.details[0].message,
    //   });
    // }

    const data = await permissionServices.addOrUpdatePermissions(
      req.body.role,
      req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Screen permissions updated successfully",
      data,
    });
  } catch (error) {
    logger.error(`Controller Error - upsertPermissions: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to save screen permissions",
    });
  }
};

exports.deleteRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    const result = await permissionServices.deleteRolePermissions(role);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No permissions config found for this role",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Permissions configurations deleted successfully for role: ${role}`,
    });
  } catch (error) {
    logger.error(`Controller Error - deleteRolePermissions: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to delete screen permissions configuration",
    });
  }
};

exports.deleteScreenPermission = async (req, res) => {
  try {
    const { role, screenId } = req.params;
    const result = await permissionServices.deleteScreenPermission(
      role,
      screenId,
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No permissions config found for this role",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully removed screen ${screenId} from role ${role} permissions`,
      data: result,
    });
  } catch (error) {
    logger.error(`Controller Error - deleteScreenPermission: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to remove screen permission from configuration",
    });
  }
};
