import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    // ✅ FIXED: Changed from 'table' to 'tableId' to match your code
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
      index: true,
    },
    
    tableNumber: { 
      type: Number,
      index: true 
    },
    
    pageUrl: { type: String, default: "" },
    referrer: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    ip: { 
      type: String, 
      default: "",
      index: true
    },

    // enrichment
    country: { type: String, default: "", index: true },
    city: { type: String, default: "", index: true },
    device: { type: String, default: "", index: true },
    browser: { type: String, default: "", index: true },
  },
  { 
    timestamps: true,
  }
);

// ✅ Add compound index for efficient deduplication queries
scanSchema.index({ tableId: 1, ip: 1, createdAt: -1 });

export default mongoose.model("Scan", scanSchema);