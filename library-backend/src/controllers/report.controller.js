const { successResponse } = require("../utils/response");
const { getOverviewReportService } = require("../services/report.service");

const getOverviewReport = async (req, res, next) => {
  try {
    const result = await getOverviewReportService();
    return successResponse(res, "Berhasil mengambil laporan", result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getOverviewReport };
