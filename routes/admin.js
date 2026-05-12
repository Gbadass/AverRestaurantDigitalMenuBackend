import express from "express";
import { adminLogin, adminMe, seedAdmin, changePassword, resetPassword } from "../controller/adminController.js";
import { bulkImport, nukeAll } from "../controller/importController.js";
import { requireAnyAuth } from "../middleware/requireAnyAuth.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/me", requireAnyAuth, adminMe);
router.patch("/password", requireAnyAuth, changePassword);
router.post("/reset-password", resetPassword);
router.post("/seed", seedAdmin);

router.post("/import", requireAnyAuth, bulkImport);
router.delete("/nuke", requireAnyAuth, nukeAll);

export default router;
