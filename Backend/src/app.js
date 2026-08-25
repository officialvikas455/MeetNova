import dotenv from "dotenv";
dotenv.config();

import express from "express";
import moduleName from "module";
import { createServer } from "http";
import { connectToSocket } from "./controllers/socketManager.js";

import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import userRoutes from "./routes/users.routes.js";


const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));


app.use("/api/v1/users",userRoutes);

const start = async () => {
  try {
    const connectionDB = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MONGO connected DB Host : ${connectionDB.connection.host}`);
    server.listen(app.get("port"), () => {
      console.log("Listing on port 8000");
    });
  } catch (error) {
    console.log("error");
  }
};
start();
