import express from "express";
const router = express.Router();
import * as imageController from "../controllers/imageController";
import { authMiddleware } from "../middleware/authMiddleware";

/**
 * GET api/v1/images/all
 * Get all images - Admin only (non-admins get their own images)
 */
router.get(
  "/images/all",
  authMiddleware,
  imageController.getAllImagesController
);

/**
 * GET api/v1/images/my
 * Get images by user email (user's own images)
 */
router.get(
  "/images/my",
  authMiddleware,
  imageController.getImagesByEmailController
);

/**
 * GET api/v1/images/:imageId
 * Get image by ID (owner or admin only)
 */
router.get(
  "/images/:imageId",
  authMiddleware,
  imageController.getImageByIdController
);

/**
 * DELETE api/v1/images/:imageId
 * Delete image by ID (owner or admin only)
 */
router.delete(
  "/images/:imageId",
  authMiddleware,
  imageController.deleteImageController
);

export default router;
