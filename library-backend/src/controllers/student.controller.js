const path = require("path");
const {
  importStudentsService,
  listStudentsService,
  deactivateStudentService,
} = require("../services/student.service");
const { successResponse, errorResponse } = require("../utils/response");

const importStudents = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, "File wajib diupload", 400);

    const allowedMime = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const ext = path.extname(req.file.originalname || "").toLowerCase();
    if (!allowedMime.includes(req.file.mimetype) && ![".xlsx", ".xls"].includes(ext)) {
      return errorResponse(res, "Format file harus .xlsx atau .xls", 400);
    }

    const result = await importStudentsService(req.file.buffer, req.user.id);
    return successResponse(res, "Import siswa selesai", result);
  } catch (err) {
    next(err);
  }
};

const listStudents = async (req, res, next) => {
  try {
    const result = await listStudentsService(req.query);
    return successResponse(res, "Berhasil mengambil data siswa", result);
  } catch (err) {
    next(err);
  }
};

const deactivateStudent = async (req, res, next) => {
  try {
    const student = await deactivateStudentService(req.params.studentId, req.user.id, req.body?.reason);
    return successResponse(res, "Akun siswa dinonaktifkan", student);
  } catch (err) {
    next(err);
  }
};

module.exports = { importStudents, listStudents, deactivateStudent };
