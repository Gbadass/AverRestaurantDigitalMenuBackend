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
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// optional text search
MenuItemSchema.index({ name: "text", description: "text", tags: "text" });

export default mongoose.model("MenuItem", MenuItemSchema);
