const { expireAndPromoteReservationsService } = require("../services/reservation.service");

const runReservationCleanup = async () => {
  try {
    await expireAndPromoteReservationsService();
  } catch (err) {
    console.error("RESERVATION CLEANUP ERROR:", err);
  }
};

const startReservationCleanupJob = () => {
  runReservationCleanup();
  const oneDayMs = 24 * 60 * 60 * 1000;
  setInterval(runReservationCleanup, oneDayMs);
};

module.exports = { startReservationCleanupJob };
