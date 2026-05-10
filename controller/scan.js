import Scan from "../models/scan.js";
import Table from '../models/tables.js'


// ✅ use x-forwarded-for for Render / proxies
function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return req.socket?.remoteAddress || "";
}

function parseUA(userAgent = "") {
  const ua = userAgent.toLowerCase();

  const device =
    ua.includes("iphone") || ua.includes("ipad") ? "iOS" :
    ua.includes("android") ? "Android" :
    ua.includes("windows") ? "Windows" :
    ua.includes("mac os") || ua.includes("macintosh") ? "Mac" :
    "Other";

  const browser =
    ua.includes("edg") ? "Edge" :
    ua.includes("chrome") && !ua.includes("edg") ? "Chrome" :
    ua.includes("safari") && !ua.includes("chrome") ? "Safari" :
    ua.includes("firefox") ? "Firefox" :
    "Other";

  return { device, browser };
}

// ✅ OPTIONAL: very light geo using ipinfo if token is set
async function enrichGeo(ip) {
  const token = process.env.IPINFO_TOKEN;
  if (!token || !ip) return { city: "", country: "" };

  try {
    const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
    const data = await res.json();
    return {
      city: data?.city || "",
      country: data?.country || "",
    };
  } catch {
    return { city: "", country: "" };
  }
}

export const createScan = async (req, res, next) => {
  try {
    const { table, pageUrl, referrer } = req.body;
    if (!table) return res.status(400).json({ message: "table is required" });

    // ✅ validate table
    const foundTable = await Table.findById(table).select("tableNumber").lean();
    if (!foundTable) return res.status(404).json({ message: "Invalid table" });

    const ip = getClientIp(req);
    const ua = req.headers["user-agent"] || "";
    const { device, browser } = parseUA(ua);

    // ✅ DEDUPE: prevent double count (same table + same ip + within 15 seconds)
    const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
    const existing = await Scan.findOne({
      tableId: foundTable._id,
      ip: String(ip),
      createdAt: { $gte: fifteenSecondsAgo },
    }).select("_id createdAt");

    if (existing) {
      return res.status(200).json({
        ok: true,
        deduped: true,
        scanId: existing._id,
        tableId: foundTable._id,
        tableNumber: foundTable.tableNumber,
      });
    }

    const geo = await enrichGeo(ip);

    const scan = await Scan.create({
      tableId: foundTable._id,
      tableNumber: foundTable.tableNumber,
      pageUrl: pageUrl || "",
      referrer: referrer || req.headers.referer || "",
      userAgent: ua,
      ip: String(ip),
      device,
      browser,
      city: geo.city,
      country: geo.country,
    });

    res.status(201).json({
      ok: true,
      scanId: scan._id,
      tableId: foundTable._id,
      tableNumber: foundTable.tableNumber,
    });
  } catch (e) {
    next(e);
  }
};

// ✅ Admin: fetch scans list (supports date range + tableId)
export const getScans = async (req, res, next) => {
  try {
    const { from, to, tableId } = req.query;

    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    if (tableId) filter.tableId = tableId;

    const scans = await Scan.find(filter).sort({ createdAt: -1 }).limit(5000).lean();

    res.json({
      scans: scans.map((s) => ({
        id: String(s._id),
        tableId: String(s.tableId),
        tableNumber: s.tableNumber ?? null,
        timestamp: s.createdAt,
        pageUrl: s.pageUrl,
        referrer: s.referrer,
        ip: s.ip,
        device: s.device,
        browser: s.browser,
        city: s.city,
        country: s.country,
        userAgent: s.userAgent,
      })),
    });
  } catch (e) {
    next(e);
  }
};

// ✅ Admin: stats grouped by tableId (IMPORTANT: use tableId, NOT table)
export const getScanStats = async (req, res, next) => {
  try {
    const stats = await Scan.aggregate([
      {
        $group: {
          _id: "$tableId",
          scans: { $sum: 1 },
          lastScanAt: { $max: "$createdAt" },
        },
      },
      { $sort: { scans: -1 } },
    ]);

    res.json({
      stats: stats.map((s) => ({
        tableId: String(s._id),
        scans: s.scans,
        lastScanAt: s.lastScanAt,
      })),
    });
  } catch (e) {
    next(e);
  }
};