const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { listNotifications, markNotificationRead } = require("../controllers/notification.controller");

const router = express.Router();

router.get("/", auth, listNotifications);
router.patch("/:notificationId/read", auth, markNotificationRead);

module.exports = router;
