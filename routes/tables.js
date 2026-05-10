import express from "express";
import {
  getTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  getTablesWithStats
} from "../controller/tables.js";
import { requireAnyAuth } from "../middleware/requireAnyAuth.js";

const router = express.Router();

router.get("/with-stats", requireAnyAuth, getTablesWithStats);
router.get("/", getTables);
router.get("/:id", getTableById);

router.post("/", requireAnyAuth, createTable);
router.put("/:id", requireAnyAuth, updateTable);
router.delete("/:id", requireAnyAuth, deleteTable);

export default router;
