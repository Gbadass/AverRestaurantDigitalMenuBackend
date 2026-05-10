import express from "express";
import { adminLogin, adminMe, seedAdmin } from "../controller/adminController.js";
import { requireAnyAuth } from "../middleware/requireAnyAuth.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/me", requireAnyAuth, adminMe);

// Optional: create first admin (protected by x-seed-key)
router.post("/seed", seedAdmin);

export default router;
