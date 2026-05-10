import { Router } from "express";
import { requireAnyAuth } from "../middleware/requireAnyAuth.js";
import { getMeta, updateMeta } from "../controller/meta.js";

const router = Router();

router.get("/", getMeta);
router.put("/", requireAnyAuth, updateMeta);

export default router;
