import express from "express";
const router = express.Router();
import * as generativeControllers from "../controllers/generativeControllers";
import { authMiddleware } from "../middleware/authMiddleware";

router.post(
  "/image/generate",
  // authMiddleware,
  generativeControllers.textToImageController
);

router.post(
  "/generative/image/inpaint",
  // authMiddleware,
  generativeControllers.inpaintImageController
);

router.post(
  "/generative/image/nanoBanana",
  // authMiddleware,
  generativeControllers.nanaoBananaController
);

export default router;
