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

// Lucid Origin TTI image generation
export const generateLucidOriginTTI = async (
  params: any
): Promise<{ image: string }> => {
  try {
    const response = await api.post("/generative/image/lucidOriginTTI", params);
    const responseData = response.data;

    // Check if the API returned success and extract the image path
    if (responseData.success === "true" && responseData.data?.relativePath) {
      // For now, return the relativePath as the image URL
      // Note: This is different from base64 - the frontend will need to handle this as a URL
      return { image: responseData.data.relativePath };
    } else {
      throw new Error(responseData.message || "Failed to generate image");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `API Error: ${error.response?.data?.error || error.message}`
      );
    }
    throw error;
  }
};

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

// SDXL image generation
interface SdxlRequest {
  prompt: string;
  negative_prompt?: string;
  height?: number;
  width?: number;
  image?: number[];
  image_b64?: string;
  mask?: number[];
  num_steps?: number;
  strength?: number;
  guidance?: number;
  seed?: number;
}

interface SdxlResponse {
  success: boolean;
  data?: {
    result: string;
    filePath?: string;
    fileName?: string;
    meta?: {
      duration?: number;
      seed?: number;
    };
  };
  error?: string;
}

export const sdxlAPI = async (
  requestData: SdxlRequest
): Promise<SdxlResponse> => {
  try {
    const response = await api.post('/generative/image/sdxl', requestData);
    return response.data;
  } catch (error: any) {
    console.error('SDXL API Error:', error);
    throw new Error(error.response?.data?.error || 'API request failed');
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

// Delete an image by filename
export const deleteImage = async (filename: string): Promise<boolean> => {
  try {
    const response = await api.delete(`/images/${filename}`);
    return response.data.success === "true";
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
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
