import { Router } from "express";
import { requireAnyAuth } from "../middleware/requireAnyAuth.js";
import {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
} from "../controller/items.js";

const router = Router();

router.get("/", getItems);
router.get("/:slug", getItem);

router.post("/", requireAnyAuth, createItem);
router.put("/:slug", requireAnyAuth, updateItem);
router.delete("/:slug", requireAnyAuth, deleteItem);

export default router;
