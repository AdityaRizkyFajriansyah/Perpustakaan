const {
  createDueSoonNotificationsService,
  createOverdueNotificationsService,
} = require("../services/notification.service");

const runNotificationJobs = async () => {
  try {
    await createDueSoonNotificationsService();
    await createOverdueNotificationsService();
  } catch (err) {
    console.error("NOTIFICATION JOB ERROR:", err);
  }
};

const startNotificationJobs = () => {
  runNotificationJobs();
  const oneDayMs = 24 * 60 * 60 * 1000;
  setInterval(runNotificationJobs, oneDayMs);
};

module.exports = { startNotificationJobs };
