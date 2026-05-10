import mongoose from "mongoose";

const MenuMetaSchema = new mongoose.Schema(
  {
    restaurantName: { type: String, default: "Aver Restaurant" },
    sectionName: { type: String, default: "Rooftop Bar" },
    currencySymbol: { type: String, default: "$" },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("MenuMeta", MenuMetaSchema);
