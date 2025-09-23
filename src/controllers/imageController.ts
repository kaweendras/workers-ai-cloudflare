import { Request, Response, NextFunction } from "express";
import * as imageServices from "../services/imageServices";
import { decodedEmail } from "../middleware/authMiddleware";
import { verifyToken } from "../utils/authUtils";
import { JwtPayload } from "jsonwebtoken";

// Get all images - Admin only
const getAllImagesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if request is from admin
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: "false",
        message: "No token provided",
        data: [],
      });
    }

    const { valid, decoded, error } = verifyToken(token);
    if (!valid) {
      return res.status(401).json({
        success: "false",
        message: "Invalid token",
        error,
        data: [],
      });
    }

    const payload = decoded as JwtPayload;
    if (payload.role !== "admin") {
      //   return res.status(403).json({
      //     success: "false",
      //     message: "Access denied. Admin only.",
      //     data: [],
      //   });

      //redirect to getImagesByEmailController

      console.log(
        "Non-admin user attempted to access all images, redirecting to their own images."
      );
      return getImagesByEmailController(req, res, next);
    }

    console.log("Admin access granted to all images.");
    const result = await imageServices.getAllImages();

    if (result.success === "true" && result.data) {
      return res.status(200).json({
        success: "true",
        message: "Images retrieved successfully",
        count: result.data.length,
        data: result.data,
      });
    } else {
      return res.status(500).json({
        success: "false",
        message: result.message || "Failed to retrieve images",
        data: [],
      });
    }
  } catch (err: any) {
    console.error("Error in getAllImagesController:", err);
    return res.status(500).json({
      success: "false",
      message: "Failed to retrieve images",
      error: err.message,
      data: [],
    });
  }
};

// Get images by user email
const getImagesByEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = decodedEmail(req) as string;

    if (!email) {
      return res.status(401).json({
        success: "false",
        message: "Authentication required",
        data: [],
      });
    }

    const result = await imageServices.getImagesByEmail(email);

    if (result.success === "true" && result.data) {
      return res.status(200).json({
        success: "true",
        message: "User images retrieved successfully",
        count: result.data.length,
        data: result.data,
      });
    } else {
      return res.status(500).json({
        success: "false",
        message: result.message || "Failed to retrieve user images",
        data: [],
      });
    }
  } catch (err: any) {
    console.error("Error in getImagesByEmailController:", err);
    return res.status(500).json({
      success: "false",
      message: "Failed to retrieve user images",
      error: err.message,
      data: [],
    });
  }
};

//get image by user email admin
const getImagesByEmailAdminController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.query as { email: string };
    console.log(`Admin requested images for userEmail: ${email}`);

    if (!email) {
      return res.status(400).json({
        success: "false",
        message: "Email parameter is required",
        data: [],
      });
    }

    // Check if request is from admin
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: "false",
        message: "No token provided",
        data: [],
      });
    }

    const { valid, decoded, error } = verifyToken(token);
    if (!valid) {
      return res.status(401).json({
        success: "false",
        message: "Invalid token",
        error,
        data: [],
      });
    }

    const payload = decoded as JwtPayload;
    if (payload.role !== "admin") {
      return res.status(403).json({
        success: "false",
        message: "Access denied. Admin only.",
        data: [],
      });
    }

    const result = await imageServices.getImagesByEmail(email);

    if (result.success === "true" && result.data) {
      return res.status(200).json({
        success: "true",
        message: "User images retrieved successfully",
        count: result.data.length,
        data: result.data,
      });
    } else {
      return res.status(500).json({
        success: "false",
        message: result.message || "Failed to retrieve user images",
        data: [],
      });
    }
  } catch (err: any) {
    console.error("Error in getImagesByEmailAdminController:", err);
    return res.status(500).json({
      success: "false",
      message: "Failed to retrieve user images",
      error: err.message,
      data: [],
    });
  }
};

// Get image by ID
const getImageByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { imageId } = req.params;

    if (!imageId) {
      return res.status(400).json({
        success: "false",
        message: "Image ID is required",
        data: [],
      });
    }

    const email = decodedEmail(req) as string;

    if (!email) {
      return res.status(401).json({
        success: "false",
        message: "Authentication required",
        data: [],
      });
    }

    const result = await imageServices.getImageById(imageId);

    if (result.success === "true" && result.data) {
      // Check if the image belongs to the requesting user or if user is admin
      const token = req.headers.authorization?.split(" ")[1];
      const { valid, decoded } = verifyToken(token!);
      const payload = decoded as JwtPayload;

      if (result.data.userEmail !== email && payload.role !== "admin") {
        return res.status(403).json({
          success: "false",
          message: "Access denied. You can only view your own images.",
          data: [],
        });
      }

      return res.status(200).json({
        success: "true",
        message: "Image retrieved successfully",
        data: result.data,
      });
    } else {
      return res.status(404).json({
        success: "false",
        message: result.message || "Image not found",
        data: [],
      });
    }
  } catch (err: any) {
    console.error("Error in getImageByIdController:", err);
    return res.status(500).json({
      success: "false",
      message: "Failed to retrieve image",
      error: err.message,
      data: [],
    });
  }
};

// Delete image by ID
const deleteImageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { imageId } = req.params;

    if (!imageId) {
      return res.status(400).json({
        success: "false",
        message: "Image ID is required",
        data: [],
      });
    }

    const email = decodedEmail(req) as string;

    if (!email) {
      return res.status(401).json({
        success: "false",
        message: "Authentication required",
        data: [],
      });
    }

    // First, get the image to check ownership
    const imageResult = await imageServices.getImageById(imageId);

    if (imageResult.success !== "true" || !imageResult.data) {
      return res.status(404).json({
        success: "false",
        message: "Image not found",
        data: [],
      });
    }

    // Check if the image belongs to the requesting user or if user is admin
    const token = req.headers.authorization?.split(" ")[1];
    const { valid, decoded } = verifyToken(token!);
    const payload = decoded as JwtPayload;

    if (imageResult.data.userEmail !== email && payload.role !== "admin") {
      return res.status(403).json({
        success: "false",
        message: "Access denied. You can only delete your own images.",
        data: [],
      });
    }

    const result = await imageServices.deleteImage(imageId);

    if (result.success === "true") {
      return res.status(200).json({
        success: "true",
        message: "Image deleted successfully",
        data: result.data,
      });
    } else {
      return res.status(500).json({
        success: "false",
        message: result.message,
        data: [],
      });
    }
  } catch (err: any) {
    console.error("Error in deleteImageController:", err);
    return res.status(500).json({
      success: "false",
      message: "Failed to delete image",
      error: err.message,
      data: [],
    });
  }
};

export {
  getAllImagesController,
  getImagesByEmailController,
  getImageByIdController,
  deleteImageController,
  getImagesByEmailAdminController,
};
