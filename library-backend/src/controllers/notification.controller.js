const { successResponse } = require("../utils/response");
const {
  listNotificationsService,
  markNotificationReadService,
} = require("../services/notification.service");

const listNotifications = async (req, res, next) => {
  try {
    const result = await listNotificationsService(req.user, req.query);
    return successResponse(res, "Berhasil mengambil notifikasi", result);
  } catch (err) {
    next(err);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const result = await markNotificationReadService(req.params.notificationId, req.user);
    return successResponse(res, "Notifikasi dibaca", result);
  } catch (err) {
    next(err);
  }
};

module.exports = { listNotifications, markNotificationRead };
