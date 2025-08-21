import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import userRoutes from "./routes/userRoutes";
import generativeRoutes from "./routes/generativeRoutes";
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI as string;

app.use(
  cors({
    credentials: true,
    origin: true,
    allowedHeaders: [
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Headers",
      "Content-Type",
      "Origin",
      "authorization",
    ],
  })
);

// Middleware to parse JSON bodies with increased size limit for images
app.use(express.json({ limit: "10mb" }));

// Middleware to parse URL-encoded bodies with increased size limit
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/images", express.static(path.join(process.cwd(), "images")));
app.use("/api/v1", userRoutes);
app.use("/api/v1", generativeRoutes);

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log(`🗄️| Connected to MongoDB Databse successfully`))
  .then(async () => {
    app.listen(PORT);
  })
  .then(() => console.log(`🌎 | App Started on  http://localhost:${PORT}`))
  .catch((err) => console.log("🚫 " + err));
