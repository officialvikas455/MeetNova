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

let lastMongoError = null;
let mongoConnectAttempts = 0;

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB Atlas successfully");
  lastMongoError = null;
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection event error:", err.message);
  lastMongoError = err.message;
});

mongoose.connection.on("disconnected", () => {
  console.warn("Mongoose disconnected from MongoDB Atlas");
});

// Middleware to ensure database is ready before executing queries
const dbReadyMiddleware = async (req, res, next) => {
  // If connected, proceed immediately
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  // If currently connecting, wait up to 3 seconds for it to complete
  if (mongoose.connection.readyState === 2) {
    const startTime = Date.now();
    const checkInterval = 200;
    while (Date.now() - startTime < 3000) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      if (mongoose.connection.readyState === 1) {
        return next();
      }
    }
  }

  // Not connected
  return res.status(503).json({
    message: `Database connection is unavailable (${
      lastMongoError || "still connecting"
    }). Please verify MongoDB Atlas Network Access has 0.0.0.0/0 (Allow access from anywhere) enabled.`,
  });
};

// Root and health check routes for cloud deployments (Render, Railway, etc.)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "MeetNova Backend API is running successfully!",
  });
});

app.get("/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    dbState: states[mongoose.connection.readyState] || "unknown",
    hasMongoUriEnv: !!process.env.MONGO_URI,
    mongoHost: mongoose.connection.host || null,
    lastMongoError: lastMongoError,
  });
});

app.use("/api/v1/users", dbReadyMiddleware, userRoutes);

// Start server immediately on 0.0.0.0 so cloud providers can detect the open port right away
server.listen(PORT, "0.0.0.0", () => {
  console.log(`MeetNova Server is listening on http://0.0.0.0:${PORT}`);
});

const DEFAULT_MONGO_URI =
  "mongodb+srv://gangwarvikas6398_db_user:MHtPWMbEFeoSt9QQ@meetnova.u9wdcos.mongodb.net/meetnova?retryWrites=true&w=majority";

// Connect to MongoDB asynchronously with retry
const connectDB = async () => {
  const rawUri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
  const mongoUri = rawUri.trim().replace(/^["']|["']$/g, "");

  try {
    mongoConnectAttempts++;
    console.log(`[MongoDB] Connecting to database (attempt ${mongoConnectAttempts})...`);
    const connectionDB = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully! Host: ${connectionDB.connection.host}`);
    lastMongoError = null;
  } catch (error) {
    lastMongoError = error.message;
    console.error("[MongoDB] Connection failed:", error.message || error);
    // Retry in 5 seconds
    setTimeout(connectDB, 5000);
  }
};

connectDB();


