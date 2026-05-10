import Table from "../models/tables.js";
import Scan from "../models/scan.js";
import { toTableDto } from "../utils/tableDto.js";

const MENU_URL = process.env.PUBLIC_MENU_URL || "https://averrestuarant.com";

export const getTables = async (req, res, next) => {
  try {
    const { active } = req.query;

    const filter = {};
    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;

    const tables = await Table.find(filter).sort({ tableNumber: 1 }).lean();

    // return a stable contract for frontend
    res.json({
      tables: tables.map((t) => toTableDto(t, MENU_URL)),
    });
  } catch (e) {
    next(e);
  }
};

export const getTableById = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id).lean();
    if (!table) return res.status(404).json({ message: "Table not found" });

    res.json({ table: toTableDto(table, MENU_URL) });
  } catch (e) {
    next(e);
  }
};

export const createTable = async (req, res, next) => {
  try {
    const { tableNumber, label = "", area = "", isActive = true } = req.body;

    if (!Number.isFinite(Number(tableNumber))) {
      return res.status(400).json({ message: "tableNumber must be a number" });
    }

    const exists = await Table.findOne({ tableNumber: Number(tableNumber) });
    if (exists) {
      return res.status(409).json({ message: `Table ${tableNumber} already exists` });
    }

    const table = await Table.create({
      tableNumber: Number(tableNumber),
      label,
      area,
      isActive,
    });

    res.status(201).json({ table: toTableDto(table.toObject(), MENU_URL) });
  } catch (e) {
    next(e);
  }
};

export const updateTable = async (req, res, next) => {
  try {
    const { tableNumber, label, area, isActive } = req.body;

    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: "Table not found" });

    if (tableNumber !== undefined) {
      if (!Number.isFinite(Number(tableNumber))) {
        return res.status(400).json({ message: "tableNumber must be a number" });
      }

      const exists = await Table.findOne({
        tableNumber: Number(tableNumber),
        _id: { $ne: table._id },
      });

      if (exists) {
        return res.status(409).json({ message: `Table ${tableNumber} already exists` });
      }

      table.tableNumber = Number(tableNumber);
    }

    if (label !== undefined) table.label = label;
    if (area !== undefined) table.area = area;
    if (isActive !== undefined) table.isActive = Boolean(isActive);

    await table.save();

    res.json({ table: toTableDto(table.toObject(), MENU_URL) });
  } catch (e) {
    next(e);
  }
};

export const deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ message: "Table not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

// ✅ OPTIONAL: admin stats endpoint (so frontend can show scans per table)
export const getTablesWithStats = async (req, res, next) => {
  try {
    const tables = await Table.find({}).sort({ tableNumber: 1 }).lean();

    const stats = await Scan.aggregate([
      {
        $group: {
          _id: "$tableId", // ✅ FIX
          scans: { $sum: 1 },
          lastScanAt: { $max: "$createdAt" },
        },
      },
    ]);
    

    const statsMap = new Map(stats.map((s) => [String(s._id), s]));

    const result = tables.map((t) => {
      const dto = toTableDto(t, MENU_URL);
      const s = statsMap.get(dto.id);

      return {
        ...dto,
        scans: s?.scans || 0,
        lastScanAt: s?.lastScanAt || null,
      };
    });

    res.json({ tables: result });
  } catch (e) {
    next(e);
  }
};