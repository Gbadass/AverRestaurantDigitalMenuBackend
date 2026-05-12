import mongoose from "mongoose";

const ServiceRequestSchema = new mongoose.Schema(
  {
    table: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["staff", "bill", "water", "other"],
      default: "staff",
    },
    note: { type: String, default: "", trim: true, maxlength: 300 },
    status: { type: String, enum: ["pending", "done"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("ServiceRequest", ServiceRequestSchema);
