import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from Backend/ or fallback to cwd/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import cors from "cors";
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

const PORT = process.env.PORT || 8000;
app.set("port", PORT);

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Root and health check routes for cloud deployments (Render, Railway, etc.)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "MeetNova Backend API is running successfully!",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    dbState: mongoose.connection.readyState === 1 ? "connected" : "connecting/disconnected",
  });
});

app.use("/api/v1/users", userRoutes);

// Start server immediately on 0.0.0.0 so cloud providers can detect the open port right away
server.listen(PORT, "0.0.0.0", () => {
  console.log(`MeetNova Server is listening on http://0.0.0.0:${PORT}`);
});

// Connect to MongoDB asynchronously
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("FATAL ERROR: MONGO_URI environment variable is not defined in .env or Render dashboard.");
    return;
  }
  try {
    const connectionDB = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected successfully! Host: ${connectionDB.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message || error);
  }
};

connectDB();

