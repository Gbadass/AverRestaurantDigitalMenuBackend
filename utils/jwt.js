import jwt from "jsonwebtoken";

export function signAdminJwt(admin) {
  const payload = {
    id: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
  return jwt.sign(payload, process.env.ADMIN_JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAdminJwt(token) {
  return jwt.verify(token, process.env.ADMIN_JWT_SECRET);
}
