import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDb } from "./config/db.js";

const PORT = process.env.PORT || 7000;

async function start() {
  await connectDb(); // ✅ THIS is what you were missing
  app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err.message);
  process.exit(1);
});
