import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { notFound, errorHandler } from "./middleware/error.js";

import authRoutes from "./routes/auth.js";
import rideRoutes from "./routes/rides.js";
import driverRoutes from "./routes/drivers.js";
import adminRoutes from "./routes/admin.js";
import crmRoutes from "./routes/crm.js";
import placeRoutes from "./routes/places.js";
import userRoutes from "./routes/users.js";
import paymentRoutes from "./routes/payments.js";
import notificationRoutes from "./routes/notifications.js";
import settingsRoutes from "./routes/settings.js";
import { initRedis } from "./config/redis.js";

dotenv.config();

const app = express();

// Behind a reverse proxy (nginx, Render, Vercel) set TRUST_PROXY=true so
// req.ip / rate-limit see the real client address.
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

// Rate limiting — production hardening.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API || 600),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH || 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(
    process.env.RATE_LIMIT_LOGIN ||
      (process.env.NODE_ENV === "production" ? 10 : 100),
  ),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please wait a few minutes." },
});
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_OTP || 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many SMS requests. Please wait a few minutes." },
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/otp/send", otpLimiter);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);

app.use(notFound);
app.use(errorHandler);

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" },
});

app.set("io", io);
initSocket(io);

const PORT = process.env.PORT || 5001;

connectDB().then(async () => {
  await initRedis().catch(() => {});
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
