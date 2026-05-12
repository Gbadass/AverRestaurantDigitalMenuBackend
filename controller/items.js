import MenuItem from "../models/MenuItem.js";
import Category from "../models/Category.js";
import MenuMeta from "../models/MenuMeta.js";
import { slugify } from "../utils/slugify.js";

function bumpLastUpdated() {
  MenuMeta.findOneAndUpdate({}, { lastUpdated: new Date() }, { upsert: true }).catch(() => {});
}

const ALLOWED_TAGS = ["signature", "new", "spicy", "vegan", "popular", "seasonal",
  "protein", "chicken", "beef", "fish", "swallow", "main", "peppered",
  "bush-meat", "healthy", "special"];

const ALLOWED_AREAS = ["ground-inside", "ground-outside", "vip", "rooftop"];

const SLUG_RE = /^[a-z0-9-]+$/;
const SAFE_STR_RE = /^[a-zA-Z0-9 _&()\-'.\/,]+$/;

function safeSlug(val) {
  const s = String(val).toLowerCase().trim();
  if (!SLUG_RE.test(s)) return null;
  return s;
}

export async function getItems(req, res) {
  const { category, q, active, area } = req.query;

  const filter = {};

  if (category) {
    const s = safeSlug(category);
    if (!s) return res.status(400).json({ message: "Invalid category" });
    filter.categorySlug = s;
  }

  if (active === "true") filter.isActive = true;
  if (active === "false") filter.isActive = false;

  if (area) {
    const a = safeSlug(area);
    if (!a || !ALLOWED_AREAS.includes(a)) return res.status(400).json({ message: "Invalid area" });
    filter.$or = [{ areas: { $size: 0 } }, { areas: a }];
  }

  let itemsQuery;
  if (q && String(q).trim().length <= 100) {
    itemsQuery = MenuItem.find({ ...filter, $text: { $search: String(q).trim() } });
  } else {
    itemsQuery = MenuItem.find(filter);
  }

  const items = await itemsQuery.sort({ categorySlug: 1, sortOrder: 1, createdAt: 1 }).lean();
  res.json({ items });
}

export async function getItem(req, res) {
  const slug = safeSlug(req.params.slug);
  if (!slug) return res.status(400).json({ message: "Invalid slug" });
  const item = await MenuItem.findOne({ slug }).lean();
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json({ item });
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function safeTime(val) {
  if (!val) return "";
  const s = String(val).trim();
  return TIME_RE.test(s) ? s : "";
}

export async function createItem(req, res) {
  const body = req.body ?? {};
  const { name, slug, price, categorySlug, description, imageUrl, tags, areas, isActive, sortOrder, featured, availableFrom, availableTo } = body;

  if (!name || typeof name !== "string" || name.trim().length < 1)
    return res.status(400).json({ message: "name is required" });
  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0)
    return res.status(400).json({ message: "Valid price is required" });
  if (!categorySlug)
    return res.status(400).json({ message: "categorySlug is required" });

  const catSlug = safeSlug(categorySlug);
  if (!catSlug) return res.status(400).json({ message: "Invalid categorySlug" });

  const cat = await Category.findOne({ slug: catSlug });
  if (!cat) return res.status(400).json({ message: "categorySlug does not exist" });

  const finalSlug = slugify(slug || name);
  const exists = await MenuItem.findOne({ slug: finalSlug });
  if (exists) return res.status(409).json({ message: "Item slug already exists" });

  // Whitelist tags and areas
  const safeTags = Array.isArray(tags) ? tags.filter((t) => ALLOWED_TAGS.includes(String(t))) : [];
  const safeAreas = Array.isArray(areas) ? areas.filter((a) => ALLOWED_AREAS.includes(String(a))) : [];

  const item = await MenuItem.create({
    name: String(name).trim().slice(0, 200),
    slug: finalSlug,
    categorySlug: catSlug,
    description: description ? String(description).trim().slice(0, 2000) : "",
    price: Number(price),
    imageUrl: imageUrl ? String(imageUrl).trim().slice(0, 500) : "",
    tags: safeTags,
    areas: safeAreas,
    isActive: isActive !== false,
    sortOrder: Number(sortOrder) || 0,
    featured: featured === true || featured === "true",
    availableFrom: safeTime(availableFrom),
    availableTo: safeTime(availableTo),
  });

  bumpLastUpdated();
  res.status(201).json({ item });
}

export async function updateItem(req, res) {
  const slug = safeSlug(req.params.slug);
  if (!slug) return res.status(400).json({ message: "Invalid slug" });

  const body = req.body ?? {};
  const updates = {};

  if (body.name !== undefined) updates.name = String(body.name).trim().slice(0, 200);
  if (body.price !== undefined) updates.price = Number(body.price);
  if (body.description !== undefined) updates.description = String(body.description).trim().slice(0, 2000);
  if (body.imageUrl !== undefined) updates.imageUrl = String(body.imageUrl).trim().slice(0, 500);
  if (body.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder) || 0;
  if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
  if (body.soldOut !== undefined) updates.soldOut = Boolean(body.soldOut);
  if (body.featured !== undefined) updates.featured = body.featured === true || body.featured === "true";
  if (body.availableFrom !== undefined) updates.availableFrom = safeTime(body.availableFrom);
  if (body.availableTo !== undefined) updates.availableTo = safeTime(body.availableTo);
  if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags.filter((t) => ALLOWED_TAGS.includes(String(t))) : [];
  if (body.areas !== undefined) updates.areas = Array.isArray(body.areas) ? body.areas.filter((a) => ALLOWED_AREAS.includes(String(a))) : [];

  if (body.slug !== undefined) updates.slug = slugify(body.slug);

  if (body.categorySlug !== undefined) {
    const catSlug = safeSlug(body.categorySlug);
    if (!catSlug) return res.status(400).json({ message: "Invalid categorySlug" });
    const cat = await Category.findOne({ slug: catSlug });
    if (!cat) return res.status(400).json({ message: "categorySlug does not exist" });
    updates.categorySlug = catSlug;
  }

  const item = await MenuItem.findOneAndUpdate({ slug }, updates, { new: true }).lean();
  if (!item) return res.status(404).json({ message: "Item not found" });

  bumpLastUpdated();
  res.json({ item });
}

export async function deleteItem(req, res) {
  const slug = safeSlug(req.params.slug);
  if (!slug) return res.status(400).json({ message: "Invalid slug" });
  const item = await MenuItem.findOneAndDelete({ slug });
  if (!item) return res.status(404).json({ message: "Item not found" });
  bumpLastUpdated();
  res.json({ ok: true });
}
