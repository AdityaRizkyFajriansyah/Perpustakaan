const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/auth.route");
const categoryRoutes = require("./routes/category.route");
const bookRoutes = require("./routes/book.route");
const borrowingRoutes = require("./routes/borrowing.route");
const auditRoutes = require("./routes/audit.route");
const studentRoutes = require("./routes/student.route");
const ipBlockRoutes = require("./routes/ipBlock.route");
const exportRoutes = require("./routes/export.route");
const reportRoutes = require("./routes/report.route");
const reservationRoutes = require("./routes/reservation.route");
const notificationRoutes = require("./routes/notification.route");

const errorHandler = require("./middlewares/error.middleware");
const csrfMiddleware = require("./middlewares/csrf.middleware");
const apiRateLimiter = require("./middlewares/apiRateLimit.middleware");
const authMiddleware = require("./middlewares/auth.middleware");
const originMiddleware = require("./middlewares/origin.middleware");

const app = express();

if (process.env.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

// Security headers dengan Helmet
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
  })
);

// CORS
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "200kb" }));

app.use("/covers", express.static(path.join(process.cwd(), "uploads", "covers")));

app.use("/api", apiRateLimiter);
app.use("/api", originMiddleware);
app.use("/api", (req, res, next) => {
  if (req.path === "/auth/login") return next();
  return authMiddleware(req, res, next);
});
app.use("/api", csrfMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrowings", borrowingRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/ip-blocks", ipBlockRoutes);
app.use("/api/exports", exportRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Library API running" });
});

// error handler harus paling bawah
app.use(errorHandler);

module.exports = app;
