import MenuMeta from "../models/MenuMeta.js";

export async function getMeta(req, res) {
  let meta = await MenuMeta.findOne().lean();
  if (!meta) meta = await MenuMeta.create({});
  res.json({ meta });
}

export async function updateMeta(req, res) {
  const update = req.body ?? {};
  update.lastUpdated = new Date();

  const meta = await MenuMeta.findOneAndUpdate({}, update, {
    new: true,
    upsert: true
  }).lean();

  res.json({ meta });
}
