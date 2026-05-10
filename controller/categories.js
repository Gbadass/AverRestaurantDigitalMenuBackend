import Category from "../models/Category.js";
import MenuItem from "../models/MenuItem.js";
import { slugify } from "../utils/slugify.js";

export async function getCategories(req, res) {
  const categories = await Category.find().sort({ order: 1, createdAt: 1 }).lean();
  res.json({ categories });
}

export async function getCategory(req, res) {
  const category = await Category.findOne({ slug: req.params.slug }).lean();
  if (!category) return res.status(404).json({ message: "Category not found" });
  res.json({ category });
}

export async function createCategory(req, res) {
  const { name, slug, icon = "", order = 0 } = req.body ?? {};
  if (!name) return res.status(400).json({ message: "name is required" });

  const finalSlug = slugify(slug || name);
  const exists = await Category.findOne({ slug: finalSlug });
  if (exists) return res.status(409).json({ message: "Category slug already exists" });

  const category = await Category.create({ name, slug: finalSlug, icon, order });
  res.status(201).json({ category });
}

export async function updateCategory(req, res) {
  const updates = req.body ?? {};
  if (updates.slug) updates.slug = slugify(updates.slug);

  const current = await Category.findOne({ slug: req.params.slug });
  if (!current) return res.status(404).json({ message: "Category not found" });

  const oldSlug = current.slug;
  const updated = await Category.findOneAndUpdate({ slug: oldSlug }, updates, { new: true });

  // keep items consistent if slug changed
  if (updates.slug && updates.slug !== oldSlug) {
    await MenuItem.updateMany({ categorySlug: oldSlug }, { $set: { categorySlug: updates.slug } });
  }

  res.json({ category: updated });
}

export async function deleteCategory(req, res) {
  const slug = req.params.slug;
  const deleted = await Category.findOneAndDelete({ slug });
  if (!deleted) return res.status(404).json({ message: "Category not found" });

  // optional: also delete its items
  await MenuItem.deleteMany({ categorySlug: slug });

  res.json({ ok: true });
}
