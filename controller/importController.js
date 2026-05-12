import Category from "../models/Category.js";
import MenuItem from "../models/MenuItem.js";
import MenuMeta from "../models/MenuMeta.js";
import { slugify } from "../utils/slugify.js";

const FLOOR_MAP = {
  ground: ["ground-inside", "ground-outside"],
  vip: ["vip"],
  rooftop: ["rooftop"],
};

const ALLOWED_FLOORS = Object.keys(FLOOR_MAP);

const ALLOWED_TAGS = [
  "signature", "new", "spicy", "vegan", "popular", "seasonal",
  "protein", "chicken", "beef", "fish", "swallow", "main",
  "peppered", "bush-meat", "healthy", "special", "soup", "grill",
  "starter", "dessert", "cocktail", "mocktail", "spirit", "beer",
  "wine", "soft-drink",
];

// POST /api/admin/import
// Body: { rows: [{ floor, category, categoryIcon, name, description, price, tags }] }
export async function bulkImport(req, res, next) {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "rows array is required and must not be empty" });
    }
    if (rows.length > 500) {
      return res.status(400).json({ message: "Maximum 500 rows per import" });
    }

    const catCache = {}; // name → Category doc
    let categoriesCreated = 0;
    let itemsCreated = 0;
    let itemsSkipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed, header is row 1

      const floor = String(row.floor || "").trim().toLowerCase();
      const catName = String(row.category || "").trim();
      const catIcon = String(row.categoryIcon || row.icon || "").trim();
      const name = String(row.name || "").trim();
      const description = String(row.description || "").trim().slice(0, 2000);
      const price = Number(row.price);
      const rawTags = String(row.tags || "").trim();

      // Validate
      if (!ALLOWED_FLOORS.includes(floor)) {
        errors.push(`Row ${rowNum}: invalid floor "${floor}" (use: ground, vip, rooftop)`);
        continue;
      }
      if (!catName) { errors.push(`Row ${rowNum}: category is required`); continue; }
      if (!name)    { errors.push(`Row ${rowNum}: name is required`); continue; }
      if (isNaN(price) || price < 0) { errors.push(`Row ${rowNum}: invalid price`); continue; }

      // Upsert category
      const cacheKey = `${floor}::${catName.toLowerCase()}`;
      if (!catCache[cacheKey]) {
        const slug = slugify(catName);
        let cat = await Category.findOne({ slug });
        if (!cat) {
          cat = await Category.create({
            name: catName,
            slug,
            icon: catIcon || "",
            order: Object.keys(catCache).length,
            floors: [floor],
          });
          categoriesCreated++;
        } else if (!cat.floors?.includes(floor)) {
          // Add floor if missing
          const updated = [...(cat.floors || []), floor];
          cat = await Category.findOneAndUpdate({ slug }, { floors: updated, icon: catIcon || cat.icon }, { new: true });
        }
        catCache[cacheKey] = cat;
      }

      const cat = catCache[cacheKey];

      // Parse tags
      const tags = rawTags
        ? rawTags.split(/[|,]/).map((t) => t.trim().toLowerCase()).filter((t) => ALLOWED_TAGS.includes(t))
        : [];

      // Create item (skip if slug already exists)
      const slug = slugify(name);
      const exists = await MenuItem.findOne({ slug });
      if (exists) {
        itemsSkipped++;
        continue;
      }

      await MenuItem.create({
        name,
        slug,
        categorySlug: cat.slug,
        description,
        price,
        imageUrl: String(row.imageUrl || row.image || "").trim().slice(0, 500),
        tags,
        areas: [],
        isActive: true,
        sortOrder: itemsCreated,
        featured: false,
        availableFrom: "",
        availableTo: "",
      });
      itemsCreated++;
    }

    if (itemsCreated > 0) {
      MenuMeta.findOneAndUpdate({}, { lastUpdated: new Date() }, { upsert: true }).catch(() => {});
    }

    res.json({
      ok: true,
      categoriesCreated,
      itemsCreated,
      itemsSkipped,
      errors,
    });
  } catch (e) {
    next(e);
  }
}

// DELETE /api/admin/nuke
// Wipes all items and categories
export async function nukeAll(req, res, next) {
  try {
    const { target } = req.body; // "items" | "categories" | "all"
    let itemsDeleted = 0;
    let categoriesDeleted = 0;

    if (target === "items" || target === "all") {
      const r = await MenuItem.deleteMany({});
      itemsDeleted = r.deletedCount;
    }
    if (target === "categories" || target === "all") {
      const r = await Category.deleteMany({});
      categoriesDeleted = r.deletedCount;
    }

    res.json({ ok: true, itemsDeleted, categoriesDeleted });
  } catch (e) {
    next(e);
  }
}
