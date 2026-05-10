import express from "express";
import { createScan, getScanStats, getScans } from "../controller/scan.js";
import { requireAnyAuth } from "../middleware/requireAnyAuth.js";

const router = express.Router();

router.post("/", createScan);
router.get("/", requireAnyAuth, getScans);
router.get("/stats", requireAnyAuth, getScanStats);

export default router;
