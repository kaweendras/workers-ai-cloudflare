import express from "express";
const router = express.Router();
import * as generativeControllers from "../controllers/generativeControllers";
import { authMiddleware } from "../middleware/authMiddleware";

router.post(
  "/image/generate",
  authMiddleware,
  generativeControllers.textToImageController
);

router.post(
  "/generative/image/lucidOriginTTI",
  authMiddleware,
  generativeControllers.lucidOriginTTIController
);

router.post(
  "/generative/image/inpaint",
  authMiddleware,
  generativeControllers.inpaintImageController
);

router.post(
  "/generative/image/nanoBanana",
  authMiddleware,
  generativeControllers.nanaoBananaController
);

router.post(
  "/generative/image/sdxl",
  authMiddleware,
  generativeControllers.sdxlController
);

router.post(
  "/generative/image/imageToImage",
  authMiddleware,
  generativeControllers.imageToImageController
);

router.get("/images", authMiddleware,generativeControllers.getAllImagesController);

// Make sure the route path matches the URL structure
router.delete("/images/:filename",authMiddleware, generativeControllers.deleteImageController);

export default router;
