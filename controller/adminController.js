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

// PATCH /api/admin/password (JWT protected)
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect" });

    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    await admin.save();

    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/admin/reset-password (protected by x-seed-key — no login required)
export async function resetPassword(req, res) {
  try {
    const seedKey = req.headers["x-seed-key"] || req.body?.seedKey;

    if (!process.env.ADMIN_SEED_KEY) {
      return res.status(400).json({ message: "Recovery key not configured on server" });
    }
    if (seedKey !== process.env.ADMIN_SEED_KEY) {
      return res.status(401).json({ message: "Invalid recovery key" });
    }

    const { email, newPassword } = req.body || {};
    if (!email || !newPassword) {
      return res.status(400).json({ message: "email and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) return res.status(404).json({ message: "No account found with that email" });

    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    await admin.save();

    return res.json({ ok: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
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