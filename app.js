import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import categoriesRoutes from "./routes/categories.js";
import itemsRoutes from "./routes/items.js";
import metaRoutes from "./routes/meta.js";
import scansRoutes from "./routes/scan.js";
import tablesRoutes from "./routes/tables.js";
import adminRoutes from "./routes/admin.js";
import requestsRoutes from "./routes/requests.js";

dotenv.config();

const app = express();

// Security headers
app.use(helmet());

// CORS — strip trailing slashes so env var formatting doesn't matter
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (curl, mobile apps, Render health checks)
    if (!origin) return cb(null, true);
    const clean = origin.replace(/\/+$/, "");
    if (!allowedOrigins.length || allowedOrigins.includes(clean)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Request logging (skip in test)
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

app.use(express.json({ limit: "2mb" }));

// Rate limits
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { message: "Too many login attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimit = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimit);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/categories", categoriesRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/scans", scansRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/admin", loginLimit, adminRoutes);
app.use("/api/requests", requestsRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler — never leak stack traces
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = status < 500 ? err.message : "Internal server error";
  if (status >= 500) console.error("[error]", err);
  res.status(status).json({ message });
});

export default app;
