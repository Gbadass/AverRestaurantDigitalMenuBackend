import ServiceRequest from "../models/ServiceRequest.js";

export async function createRequest(req, res, next) {
  try {
    const { table, type, note } = req.body;
    if (!table || typeof table !== "string" || !table.trim()) {
      return res.status(400).json({ message: "table is required" });
    }
    const allowed = ["staff", "bill", "water", "other"];
    const safeType = allowed.includes(type) ? type : "staff";
    const safeNote = typeof note === "string" ? note.trim().slice(0, 300) : "";

    const request = await ServiceRequest.create({
      table: table.trim(),
      type: safeType,
      note: safeNote,
    });
    res.status(201).json({ request });
  } catch (e) {
    next(e);
  }
}

export async function getRequests(req, res, next) {
  try {
    const { status } = req.query;
    const filter = status === "pending" || status === "done" ? { status } : {};
    const requests = await ServiceRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ requests });
  } catch (e) {
    next(e);
  }
}

export async function updateRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status !== "pending" && status !== "done") {
      return res.status(400).json({ message: "status must be pending or done" });
    }
    const updated = await ServiceRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.json({ request: updated });
  } catch (e) {
    next(e);
  }
}
