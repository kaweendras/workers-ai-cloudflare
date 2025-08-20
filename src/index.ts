import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import userRoutes from "./routes/userRoutes";

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

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/api/v1", userRoutes);

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log(`🗄️| Connected to MongoDB Databse successfully`))
  .then(async () => {
    app.listen(PORT);
  })
  .then(() => console.log(`🌎 | App Started on  http://localhost:${PORT}`))
  .catch((err) => console.log("🚫 " + err));
