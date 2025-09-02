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

router.get("/images", generativeControllers.getAllImagesController);

// Make sure the route path matches the URL structure
router.delete("/images/:filename", generativeControllers.deleteImageController);

export default router;
