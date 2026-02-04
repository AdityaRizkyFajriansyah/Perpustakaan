const { successResponse, errorResponse } = require("../utils/response");
const { listIpBlocksService, clearIpBlockService } = require("../services/ipBlock.service");

const listIpBlocks = async (req, res, next) => {
  try {
    const result = await listIpBlocksService(req.query);
    return successResponse(res, "Berhasil mengambil data blokir IP", result);
  } catch (err) {
    next(err);
  }
};

const clearIpBlock = async (req, res, next) => {
  try {
    const ip = typeof req.query.ip === "string" ? req.query.ip.trim() : "";
    if (!ip) return errorResponse(res, "IP wajib diisi", 400);

    const result = await clearIpBlockService(ip, req.user.id);
    return successResponse(res, "Blokir IP dihapus", result);
  } catch (err) {
    next(err);
  }
};

module.exports = { listIpBlocks, clearIpBlock };
