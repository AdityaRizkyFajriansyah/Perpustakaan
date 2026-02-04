const xlsx = require("xlsx");
const {
  getBooksExport,
  getBorrowingsExport,
  getStudentsExport,
  getAuditLogsExport,
} = require("../services/export.service");

const resolveFormat = (raw) => {
  const format = String(raw || "xlsx").toLowerCase();
  return format === "csv" ? "csv" : "xlsx";
};

const sendExport = (res, rows, baseName, format) => {
  const sheet = xlsx.utils.json_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, sheet, "Data");

  const bookType = format === "csv" ? "csv" : "xlsx";
  const buffer = xlsx.write(workbook, { type: "buffer", bookType });
  const extension = format === "csv" ? "csv" : "xlsx";
  const contentType = format === "csv"
    ? "text/csv"
    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${baseName}.${extension}"`);
  return res.send(buffer);
};

const exportBooks = async (req, res, next) => {
  try {
    const format = resolveFormat(req.query.format);
    const rows = await getBooksExport();
    return sendExport(res, rows, "books", format);
  } catch (err) {
    next(err);
  }
};

const exportBorrowings = async (req, res, next) => {
  try {
    const format = resolveFormat(req.query.format);
    const rows = await getBorrowingsExport(req.query);
    return sendExport(res, rows, "borrowings", format);
  } catch (err) {
    next(err);
  }
};

const exportStudents = async (req, res, next) => {
  try {
    const format = resolveFormat(req.query.format);
    const rows = await getStudentsExport();
    return sendExport(res, rows, "students", format);
  } catch (err) {
    next(err);
  }
};

const exportAuditLogs = async (req, res, next) => {
  try {
    const format = resolveFormat(req.query.format);
    const rows = await getAuditLogsExport();
    return sendExport(res, rows, "audit-logs", format);
  } catch (err) {
    next(err);
  }
};

module.exports = { exportBooks, exportBorrowings, exportStudents, exportAuditLogs };
