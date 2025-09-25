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
 *  GET api/v1/images/allimagesbyuseremail
 * Get all images by user email (admin only)
 */
router.get(
  "/images/allimagesbyuseremail",
  authMiddleware,
  imageController.getImagesByEmailAdminController
);

/**
 * DELETE api/v1/delete/images/delete
 * Delete image by ID (owner or admin only)
 */
router.delete(
  "/delete/images/:fileId",
  authMiddleware,
  imageController.deleteImageController
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

export default router;
