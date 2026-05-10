import { verifyAdminJwt } from "../utils/jwt.js";

export function requireAnyAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) {
    try {
      req.admin = verifyAdminJwt(auth.slice(7));
      return next();
    } catch {}
  }

  const key = req.headers["x-admin-key"];
  if (process.env.ADMIN_KEY && key === process.env.ADMIN_KEY) {
    req.admin = { role: "admin", source: "key" };
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
}
