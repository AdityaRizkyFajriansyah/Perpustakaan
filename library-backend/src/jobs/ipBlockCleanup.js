const { cleanupIpBlocksService } = require("../services/ipBlock.service");

const runIpBlockCleanup = async () => {
  try {
    await cleanupIpBlocksService(new Date());
  } catch (err) {
    console.error("IP BLOCK CLEANUP ERROR:", err);
  }
};

const startIpBlockCleanupJob = () => {
  runIpBlockCleanup();
  const oneDayMs = 24 * 60 * 60 * 1000;
  setInterval(runIpBlockCleanup, oneDayMs);
};

module.exports = { startIpBlockCleanupJob };
