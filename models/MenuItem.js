import mongoose from "mongoose";

const MenuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    categorySlug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    imageUrl: { type: String, default: "" },
    tags: { type: [String], default: [] },
    areas: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    availableFrom: { type: String, default: "" }, // "HH:MM" e.g. "17:00"
    availableTo: { type: String, default: "" },   // "HH:MM" e.g. "22:00"
    isActive: { type: Boolean, default: true },
    soldOut: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

MenuItemSchema.index({ name: "text", description: "text", tags: "text" });

export default mongoose.model("MenuItem", MenuItemSchema);
