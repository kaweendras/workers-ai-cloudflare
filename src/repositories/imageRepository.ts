import { IImage } from "../models/imageModel";
import Image from "../models/imageModel";

const getAllImages = async () => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    return images;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to fetch images from the database");
  }
};

const getImagesByEmail = async (userEmail: string) => {
  try {
    const images = await Image.find({ userEmail }).sort({ createdAt: -1 });
    return images;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to fetch images by email from the database");
  }
};

const addImage = async (imageData: IImage) => {
  try {
    const image = new Image({
      ...imageData,
    });
    await image.save();
    return image;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to add image to the database");
  }
};

const deleteImage = async (imageId: string) => {
  try {
    const deletedImage = await Image.findByIdAndDelete(imageId);
    if (!deletedImage) {
      throw new Error("Image not found");
    }
    return deletedImage;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to delete image from the database");
  }
};

const deleteImagesByEmail = async (userEmail: string) => {
  try {
    const result = await Image.deleteMany({ userEmail });
    return result;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to delete images by email from the database");
  }
};

const getImageById = async (imageId: string) => {
  try {
    const image = await Image.findById(imageId);
    return image;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to fetch image by ID from the database");
  }
};

export { 
  getAllImages, 
  getImagesByEmail, 
  addImage, 
  deleteImage, 
  deleteImagesByEmail,
  getImageById 
};
