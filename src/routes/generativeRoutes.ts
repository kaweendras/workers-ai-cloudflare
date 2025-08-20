import express from "express";
const router = express.Router();
import * as generativeControllers from "../controllers/generativeControllers";
import { authMiddleware } from "../middleware/authMiddleware";

router.post(
  "/image/generate",
  authMiddleware,
  generativeControllers.textToImageController
);

export default router;
