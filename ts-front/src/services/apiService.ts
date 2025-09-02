import axios from "axios";
import type {
  ApiResponse,
  ImageData,
  ImageGenerationRequest,
  InpaintImageRequest,
  NanoBananaRequest,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4001/api/v1";
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes
});

// Text to image generation
export const generateImage = async (
  params: ImageGenerationRequest
): Promise<ApiResponse<ImageData>> => {
  try {
    const response = await api.post("/image/generate", params);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `API Error: ${error.response?.data?.error || error.message}`
      );
    }
    throw error;
  }
};

// Inpaint image
export const inpaintImage = async (
  params: InpaintImageRequest
): Promise<ApiResponse<ImageData>> => {
  try {
    const response = await api.post("/generative/image/inpaint", params);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `API Error: ${error.response?.data?.error || error.message}`
      );
    }
    throw error;
  }
};

// nanoBanana image processing
export const processWithNanoBanana = async (
  params: NanoBananaRequest
): Promise<ApiResponse<ImageData>> => {
  try {
    const response = await api.post("/generative/image/nanoBanana", params);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `API Error: ${error.response?.data?.error || error.message}`
      );
    }
    throw error;
  }
};

// Get all images
export const getAllImages = async (): Promise<string[]> => {
  try {
    const response = await api.get("/images");
    const data = response.data;

    if (data.success === "true" && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
};

// Upload image to ImgBB
export const uploadToImgBB = async (
  imageFile: File
): Promise<string | null> => {
  if (!IMGBB_API_KEY) {
    throw new Error("ImgBB API key is missing. Please check your .env file.");
  }

  try {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("key", IMGBB_API_KEY);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?expiration=600`,
      formData
    );

    if (response.data.success && response.data.data?.url) {
      return response.data.data.url;
    }
    return null;
  } catch (error) {
    console.error("Error uploading to ImgBB:", error);
    return null;
  }
};

// Convert canvas to a file
export const canvasToFile = async (
  canvas: HTMLCanvasElement,
  fileName: string = "image.png"
): Promise<File> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas to Blob conversion failed"));
        return;
      }
      const file = new File([blob], fileName, { type: "image/png" });
      resolve(file);
    }, "image/png");
  });
};

// Convert image to base64
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Remove data:image/xxx;base64, prefix
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to convert image to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Convert image to mask array
export const imageToMaskArray = async (
  image: File | HTMLCanvasElement,
  targetSize: [number, number] = [64, 64]
): Promise<number[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetSize[0];
      canvas.height = targetSize[1];
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw and convert to grayscale
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        0,
        0,
        targetSize[0],
        targetSize[1]
      );
      const imageData = ctx.getImageData(0, 0, targetSize[0], targetSize[1]);
      const data = imageData.data;

      // Extract grayscale values (using only red channel for simplicity since it's grayscale)
      const maskArray: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        maskArray.push(data[i]);
      }

      resolve(maskArray);
    };

    img.onerror = () =>
      reject(new Error("Failed to load image for mask conversion"));

    if (image instanceof File) {
      img.src = URL.createObjectURL(image);
    } else {
      // If it's a canvas element, get data URL
      img.src = image.toDataURL("image/png");
    }
  });
};
