const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permission.controller");

router.get("/", permissionController.getPermissions);
router.post("/", permissionController.upsertPermissions);
router.delete("/:role", permissionController.deleteRolePermissions);

module.exports = router;
