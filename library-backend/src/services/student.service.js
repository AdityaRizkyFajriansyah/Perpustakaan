const bcrypt = require("bcrypt");
const xlsx = require("xlsx");
const prisma = require("../config/prisma");
const { createAuditLog } = require("./audit.service");

const REQUIRED_HEADERS = ["nisn", "nama", "kelas", "nama_orangtua"];

const normalizeCell = (value) => String(value ?? "").trim();
const extractClassLevel = (value) => {
  const match = String(value ?? "").match(/(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isNaN(parsed) ? null : parsed;
};

const replaceFirstNumber = (value, nextNumber) => {
  const text = String(value ?? "");
  const match = text.match(/(\d+)/);
  if (!match) return null;
  return text.replace(match[1], String(nextNumber));
};

const importStudentsService = async (buffer, actorId) => {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    const err = new Error("File kosong atau sheet tidak ditemukan");
    err.status = 400;
    throw err;
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  if (!rows.length) {
    const err = new Error("File tidak memiliki data");
    err.status = 400;
    throw err;
  }

  const headers = Object.keys(rows[0] || {});
  const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    const err = new Error(`Kolom wajib: ${missingHeaders.join(", ")}`);
    err.status = 400;
    throw err;
  }

  const seenNisn = new Set();
  const candidates = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const nisn = normalizeCell(row.nisn);
    const name = normalizeCell(row.nama);
    const kelas = normalizeCell(row.kelas);
    const parentName = normalizeCell(row.nama_orangtua);

    if (!nisn || !name || !kelas || !parentName) {
      errors.push(`Baris ${rowNumber}: nisn/nama/kelas/nama_orangtua wajib diisi`);
      return;
    }

    if (seenNisn.has(nisn)) {
      errors.push(`Baris ${rowNumber}: NISN ${nisn} duplikat di file`);
      return;
    }

    seenNisn.add(nisn);
    candidates.push({ nisn, name, kelas, parentName });
  });

  if (!candidates.length) {
    return { created: 0, skipped: errors.length, errors };
  }

  const nisnList = candidates.map((c) => c.nisn);
  const existingUsers = await prisma.user.findMany({
    where: { nisn: { in: nisnList } },
    select: { nisn: true },
  });
  const existingNisn = new Set(existingUsers.map((u) => u.nisn));

  const emails = candidates.map((c) => `${c.nisn}@student.local`);
  const existingEmails = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const existingEmail = new Set(existingEmails.map((u) => u.email));

  const data = [];
  for (const candidate of candidates) {
    if (existingNisn.has(candidate.nisn)) {
      errors.push(`NISN ${candidate.nisn} sudah terdaftar`);
      continue;
    }

    const email = `${candidate.nisn}@student.local`;
    if (existingEmail.has(email)) {
      errors.push(`Email ${email} sudah terdaftar`);
      continue;
    }

    const hashed = await bcrypt.hash(candidate.parentName, 12);
    data.push({
      name: candidate.name,
      email,
      password: hashed,
      role: "STUDENT",
      nisn: candidate.nisn,
      kelas: candidate.kelas,
    });
  }

  let created = 0;
  if (data.length > 0) {
    const result = await prisma.user.createMany({ data });
    created = result.count;
  }

  if (created > 0) {
    await createAuditLog({
      userId: actorId,
      action: "IMPORT_STUDENTS",
      entity: "User",
      entityId: null,
    });
  }

  const skipped = errors.length + (data.length - created);
  return { created, skipped, errors };
};

const listStudentsService = async (query) => {
  let { page = 1, limit = 10, q, status } = query;

  page = Number(page);
  limit = Number(limit);

  if (Number.isNaN(page) || page < 1) {
    const err = new Error("Page tidak valid");
    err.status = 400;
    throw err;
  }
  if (Number.isNaN(limit) || limit < 1 || limit > 50) {
    const err = new Error("Limit tidak valid (1-50)");
    err.status = 400;
    throw err;
  }

  const where = { role: "STUDENT" };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { nisn: { contains: q, mode: "insensitive" } },
      { kelas: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) {
    if (!["active", "inactive", "return_only"].includes(status)) {
      const err = new Error("Status tidak valid");
      err.status = 400;
      throw err;
    }
    const map = {
      active: "ACTIVE",
      inactive: "INACTIVE",
      return_only: "RETURN_ONLY",
    };
    where.accountStatus = map[status];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        nisn: true,
        kelas: true,
        accountStatus: true,
        statusChangedAt: true,
        statusReason: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const deactivateStudentService = async (studentId, actorId, reason) => {
  const id = Number(studentId);
  if (Number.isNaN(id)) {
    const err = new Error("Student ID tidak valid");
    err.status = 400;
    throw err;
  }

  const student = await prisma.user.findUnique({ where: { id } });
  if (!student || student.role !== "STUDENT") {
    const err = new Error("Siswa tidak ditemukan");
    err.status = 404;
    throw err;
  }

  if (student.accountStatus === "INACTIVE") return student;

  const deactivationReason = reason && typeof reason === "string" ? reason : "TRANSFERRED";

  const updated = await prisma.user.update({
    where: { id },
    data: {
      accountStatus: "INACTIVE",
      statusChangedAt: new Date(),
      statusReason: deactivationReason,
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "DEACTIVATE_STUDENT",
    entity: "User",
    entityId: updated.id,
  });

  return updated;
};

const autoSetGraduatesReturnOnlyService = async (now = new Date()) => {
  if (!(now.getMonth() === 6 && now.getDate() >= 5)) return { updated: 0 };

  const promotionStart = new Date(now.getFullYear(), 6, 5);

  const candidates = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      accountStatus: "ACTIVE",
      kelas: { not: null },
      createdAt: { lt: promotionStart },
    },
    select: { id: true, kelas: true },
  });

  const ids = candidates
    .filter((item) => extractClassLevel(item.kelas) === 6)
    .map((item) => item.id);

  if (ids.length === 0) return { updated: 0 };

  const result = await prisma.user.updateMany({
    where: { id: { in: ids } },
    data: {
      accountStatus: "RETURN_ONLY",
      statusChangedAt: now,
      statusReason: "GRADUATED",
    },
  });

  await createAuditLog({
    userId: null,
    action: "AUTO_SET_GRADUATE_RETURN_ONLY",
    entity: "User",
    entityId: null,
  });

  return { updated: result.count };
};

const autoPromoteStudentsService = async (now = new Date()) => {
  if (!(now.getMonth() === 6 && now.getDate() >= 5)) return { updated: 0 };

  const promotionStart = new Date(now.getFullYear(), 6, 5);

  const candidates = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      accountStatus: "ACTIVE",
      kelas: { not: null },
      createdAt: { lt: promotionStart },
      OR: [{ lastPromotedAt: null }, { lastPromotedAt: { lt: promotionStart } }],
    },
    select: { id: true, kelas: true },
  });

  const updates = [];
  for (const student of candidates) {
    const level = extractClassLevel(student.kelas);
    if (!level || level < 1 || level >= 6) continue;
    const nextKelas = replaceFirstNumber(student.kelas, level + 1);
    if (!nextKelas) continue;

    updates.push(
      prisma.user.update({
        where: { id: student.id },
        data: { kelas: nextKelas, lastPromotedAt: now },
      })
    );
  }

  if (updates.length === 0) return { updated: 0 };

  const result = await prisma.$transaction(updates);

  await createAuditLog({
    userId: null,
    action: "AUTO_PROMOTE_STUDENTS",
    entity: "User",
    entityId: null,
  });

  return { updated: result.length };
};

const cleanupGraduatesService = async (now = new Date()) => {
  const deleteAfter = new Date(now.getFullYear(), 7, 31, 23, 59, 59, 999);
  if (now < deleteAfter) return { deleted: 0 };

  const result = await prisma.user.deleteMany({
    where: {
      role: "STUDENT",
      accountStatus: "RETURN_ONLY",
      statusReason: "GRADUATED",
      statusChangedAt: { lte: deleteAfter },
    },
  });

  if (result.count > 0) {
    await createAuditLog({
      userId: null,
      action: "AUTO_DELETE_GRADUATES",
      entity: "User",
      entityId: null,
    });
  }

  return { deleted: result.count };
};

module.exports = {
  importStudentsService,
  listStudentsService,
  deactivateStudentService,
  cleanupGraduatesService,
  autoPromoteStudentsService,
  autoSetGraduatesReturnOnlyService,
};
