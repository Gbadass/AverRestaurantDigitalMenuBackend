import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import { signAdminJwt } from "../utils/jwt.js";

// POST /api/admin/login
export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin || !admin.active) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = signAdminJwt(admin);

    return res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("adminLogin error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/admin/me (JWT protected)
export async function adminMe(req, res) {
  return res.json({ admin: req.admin });
}

// POST /api/admin/seed (protected by x-seed-key)
export async function seedAdmin(req, res) {
  try {
    const seedKey = req.headers["x-seed-key"];

    if (!process.env.ADMIN_SEED_KEY) {
      return res.status(400).json({ message: "ADMIN_SEED_KEY is not configured" });
    }

    if (seedKey !== process.env.ADMIN_SEED_KEY) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || "";

    if (!email || !password) {
      return res.status(400).json({ message: "ADMIN_EMAIL and ADMIN_PASSWORD must be set" });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.json({ ok: true, message: "Admin already exists", adminId: existing._id });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await Admin.create({
      email,
      name: "Aver Admin",
      passwordHash,
      role: "admin",
      active: true,
    });

    return res.json({ ok: true, message: "Admin created", adminId: admin._id });
  } catch (err) {
    console.error("seedAdmin error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}