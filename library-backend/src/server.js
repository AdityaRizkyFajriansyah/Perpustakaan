require("dotenv").config();
const app = require("./app");
const { startStudentLifecycleJobs } = require("./jobs/studentLifecycle");
const { startIpBlockCleanupJob } = require("./jobs/ipBlockCleanup");
const { startNotificationJobs } = require("./jobs/notificationJobs");
const { startReservationCleanupJob } = require("./jobs/reservationCleanup");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startStudentLifecycleJobs();
  startIpBlockCleanupJob();
  startNotificationJobs();
  startReservationCleanupJob();
});
