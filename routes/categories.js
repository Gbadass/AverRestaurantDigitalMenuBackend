import { Router } from "express";
import { requireAnyAuth } from "../middleware/requireAnyAuth.js";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controller/categories.js";

const router = Router();

router.get("/", getCategories);
router.get("/:slug", getCategory);

router.post("/", requireAnyAuth, createCategory);
router.put("/:slug", requireAnyAuth, updateCategory);
router.delete("/:slug", requireAnyAuth, deleteCategory);

export default router;
