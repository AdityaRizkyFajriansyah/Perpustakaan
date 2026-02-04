const { getAuditLogsService } = require("../services/audit.service");
const { successResponse } = require("../utils/response");

const getAuditLogs = async (req, res, next) => {
  try {
    const result = await getAuditLogsService(req.query);
    return successResponse(res, "Berhasil mengambil audit log", result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLogs };
