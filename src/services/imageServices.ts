import { IImage } from "../models/imageModel";
import * as imageRepository from "../repositories/imageRepository";

// Get all images
const getAllImages = async () => {
  try {
    const images = await imageRepository.getAllImages();
    return { success: "true", data: images };
  } catch (err) {
    console.error(err);
    return { success: "false", message: "Failed to get images" };
  }
};

// Get images by user email
const getImagesByEmail = async (userEmail: string) => {
  try {
    const images = await imageRepository.getImagesByEmail(userEmail);
    return { success: "true", data: images };
  } catch (err) {
    console.error(err);
    return { success: "false", message: "Failed to get images by email" };
  }
};

// Get image by ID
const getImageById = async (imageId: string) => {
  try {
    const image = await imageRepository.getImageById(imageId);
    if (!image) {
      return { success: "false", message: "Image not found" };
    }
    return { success: "true", data: image };
  } catch (err) {
    console.error(err);
    return { success: "false", message: "Failed to get image by ID" };
  }
};

// Get image by fileID
const getImageByFileId = async (fileId: string) => {
  try {
    const image = await imageRepository.getImageByFileId(fileId);
    if (!image) {
      return { success: "false", message: "Image not found" };
    }
    return { success: "true", data: image };
  } catch (err) {
    console.error(err);
    return { success: "false", message: "Failed to get image by ID" };
  }
};

// Add new image
const addImage = async (imageData: Partial<IImage>) => {
  try {
    const image = await imageRepository.addImage(imageData as IImage);
    console.log(`Image added successfully with ID: ${image._id}`);
    return {
      success: "true",
      data: image,
      message: "Image added successfully",
    };
  } catch (err) {
    console.error(`Failed to add image: ${err}`);
    return { success: "false", message: "Failed to add image" };
  }
};

// Delete image by ID
const deleteImage = async (fileId: string) => {
  try {
    const deletedImage = await imageRepository.deleteImage(fileId);
    console.log(`Image deleted successfully with ID: ${fileId}`);
    return {
      success: "true",
      data: deletedImage,
      message: "Image deleted successfully",
    };
  } catch (err) {
    console.error(`Failed to delete image: ${err}`);
    return { success: "false", message: "Failed to delete image" };
  }
};

// Delete all images by user email
const deleteImagesByEmail = async (userEmail: string) => {
  try {
    const result = await imageRepository.deleteImagesByEmail(userEmail);
    console.log(`Deleted ${result.deletedCount} images for user: ${userEmail}`);
    return {
      success: "true",
      data: result,
      message: `Deleted ${result.deletedCount} images successfully`,
    };
  } catch (err) {
    console.error(`Failed to delete images by email: ${err}`);
    return { success: "false", message: "Failed to delete images by email" };
  }
};

// Get image statistics by user email
const getImageStatsByEmail = async (userEmail: string) => {
  try {
    const images = await imageRepository.getImagesByEmail(userEmail);
    const totalImages = images.length;
    const averageSteps =
      images.length > 0
        ? images.reduce((sum, img) => sum + (img.steps || 0), 0) / images.length
        : 0;
    const averageGuidance =
      images.length > 0
        ? images.reduce((sum, img) => sum + (img.guidance || 0), 0) /
          images.length
        : 0;

    return {
      success: "true",
      data: {
        totalImages,
        averageSteps: Math.round(averageSteps * 100) / 100,
        averageGuidance: Math.round(averageGuidance * 100) / 100,
        userEmail,
      },
    };
  } catch (err) {
    console.error(`Failed to get image statistics: ${err}`);
    return { success: "false", message: "Failed to get image statistics" };
  }
};

export {
  getAllImages,
  getImagesByEmail,
  getImageById,
  addImage,
  deleteImage,
  deleteImagesByEmail,
  getImageStatsByEmail,
  getImageByFileId,
};
