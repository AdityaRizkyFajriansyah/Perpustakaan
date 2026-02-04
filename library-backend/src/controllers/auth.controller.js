const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const { generateToken } = require("../utils/jwt");
const { successResponse, errorResponse } = require("../utils/response");
const { createAuditLog } = require("../services/audit.service");

const isProd = process.env.NODE_ENV === "production";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const isLocalhost = (host) => {
  const hostname = String(host || "").split(":")[0].toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1";
};

const shouldUseSecureCookies = (req) => {
  const forwarded = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const isHttps = req.secure || (typeof proto === "string" && proto.split(",")[0].trim() === "https");
  if (isHttps) return true;
  if (isLocalhost(req.headers.host)) return false;
  return isProd;
};

const buildCookieOptions = (req, httpOnly) => ({
  httpOnly,
  sameSite: "lax",
  secure: shouldUseSecureCookies(req),
  maxAge: ONE_DAY_MS,
  path: "/",
});

const LOCK_THRESHOLD = 3;
const BASE_LOCK_MS = 10 * 1000;
const MAX_LOCK_MS = 15 * 60 * 1000;

const calcLockMs = (failedCount) => {
  if (failedCount < LOCK_THRESHOLD) return 0;
  const exp = Math.min(failedCount - LOCK_THRESHOLD, 6);
  return Math.min(BASE_LOCK_MS * 2 ** exp, MAX_LOCK_MS);
};

const setCsrfCookie = (req, res) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  res.cookie("csrfToken", csrfToken, buildCookieOptions(req, false));
};

const setAuthCookies = (req, res, token) => {
  res.cookie("token", token, buildCookieOptions(req, true));
  setCsrfCookie(req, res);
};

const clearAuthCookies = (req, res) => {
  res.clearCookie("token", buildCookieOptions(req, true));
  res.clearCookie("csrfToken", buildCookieOptions(req, false));
};

const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  nisn: user.nisn,
  kelas: user.kelas,
  accountStatus: user.accountStatus,
  statusChangedAt: user.statusChangedAt,
  statusReason: user.statusReason,
  twoFactorEnabled: user.twoFactorEnabled,
});

const login = async (req, res, next) => {
  const { identifier: rawIdentifier, password } = req.body;
  const identifier = rawIdentifier || req.body.email;

  try {
    if (!identifier || !password) {
      return errorResponse(res, "Identifier dan password wajib diisi", 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { nisn: identifier }],
      },
    });

    if (!user) {
      await createAuditLog({
        userId: null,
        action: "LOGIN_FAILED",
        entity: "User",
        entityId: null,
        ipAddress: req.ip,
      });
      return errorResponse(res, "Identifier atau password salah", 401);
    }

    if (user.accountStatus === "INACTIVE") return errorResponse(res, "Akun sudah nonaktif", 403);

    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      return errorResponse(res, "Terlalu banyak percobaan login. Coba lagi nanti.", 429);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const nextCount = (user.failedLoginCount || 0) + 1;
      const lockMs = calcLockMs(nextCount);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: nextCount,
          lockUntil: lockMs ? new Date(now.getTime() + lockMs) : null,
          lastFailedLoginAt: now,
        },
      });

      await createAuditLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        entity: "User",
        entityId: user.id,
        ipAddress: req.ip,
      });

      return errorResponse(res, "Identifier atau password salah", 401);
    }

    if (user.role === "ADMIN" && user.twoFactorEnabled) {
      const otp = String(req.body.otp || "").trim();
      if (!otp) {
        return errorResponse(res, "OTP wajib diisi", 401);
      }
      if (!user.twoFactorSecret) {
        return errorResponse(res, "2FA belum dikonfigurasi", 401);
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: otp,
        window: 1,
      });
      if (!verified) {
        await createAuditLog({
          userId: user.id,
          action: "LOGIN_2FA_FAILED",
          entity: "User",
          entityId: user.id,
          ipAddress: req.ip,
        });
        return errorResponse(res, "OTP tidak valid", 401);
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockUntil: null,
        lastFailedLoginAt: null,
      },
    });

    const token = generateToken(user);
    setAuthCookies(req, res, token);

    await createAuditLog({
      userId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      ipAddress: req.ip,
    });

    return successResponse(res, "Login berhasil", {
      user: serializeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return errorResponse(res, "User tidak ditemukan", 404);
    if (user.accountStatus === "INACTIVE") return errorResponse(res, "Akun sudah nonaktif", 403);
    if (!req.cookies?.csrfToken) setCsrfCookie(req, res);
    return successResponse(res, "OK", { user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    clearAuthCookies(req, res);
    return successResponse(res, "Logout berhasil", null);
  } catch (err) {
    next(err);
  }
};

const setupTwoFactor = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return errorResponse(res, "Forbidden", 403);
    }

    const secret = speakeasy.generateSecret({
      name: `Perpustakaan (${req.user.email})`,
    });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorTempSecret: secret.base32 },
    });

    return successResponse(res, "2FA setup berhasil", {
      otpauthUrl: secret.otpauth_url,
      secret: secret.base32,
    });
  } catch (err) {
    next(err);
  }
};

const enableTwoFactor = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return errorResponse(res, "Forbidden", 403);
    }

    const otp = String(req.body?.otp || "").trim();
    if (!otp) return errorResponse(res, "OTP wajib diisi", 400);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.twoFactorTempSecret) {
      return errorResponse(res, "2FA belum disiapkan", 400);
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: "base32",
      token: otp,
      window: 1,
    });

    if (!verified) return errorResponse(res, "OTP tidak valid", 400);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: user.twoFactorTempSecret,
        twoFactorTempSecret: null,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "ENABLE_2FA",
      entity: "User",
      entityId: user.id,
      ipAddress: req.ip,
    });

    return successResponse(res, "2FA aktif", null);
  } catch (err) {
    next(err);
  }
};

const disableTwoFactor = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return errorResponse(res, "Forbidden", 403);
    }

    const otp = String(req.body?.otp || "").trim();
    if (!otp) return errorResponse(res, "OTP wajib diisi", 400);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return errorResponse(res, "2FA belum aktif", 400);
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: otp,
      window: 1,
    });

    if (!verified) return errorResponse(res, "OTP tidak valid", 400);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorTempSecret: null,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "DISABLE_2FA",
      entity: "User",
      entityId: user.id,
      ipAddress: req.ip,
    });

    return successResponse(res, "2FA dinonaktifkan", null);
  } catch (err) {
    next(err);
  }
};

module.exports = { login, me, logout, setupTwoFactor, enableTwoFactor, disableTwoFactor };
