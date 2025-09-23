// Types for the application
export interface ImageGenerationRequest {
  prompt: string;
  steps?: number;
  model?: string;
}

export interface InpaintImageRequest {
  prompt: string;
  image_b64: string;
  mask: number[];
  num_steps: number;
  strength: number;
  guidance: number;
  width: number;
  height: number;
  negative_prompt?: string;
  seed?: number;
  model: string;
}

export interface NanoBananaRequest {
  prompt: string;
  imageURL: string;
}

export interface ApiResponse<T> {
  success: string;
  message?: string;
  data?: T;
  error?: string;
}

export interface ImageData {
  absolutePath: string;
  relativePath: string;
}

export interface UnitedImageGenResponse {
  success: string;
  message: string;
  data: {
    fileId: string;
    url: string;
    thumbnailUrl: string;
    fileName: string;
    filePath: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: string;
  token: string;
  role: string;
}

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  role: string;
  token: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UserResponse {
  success: string;
  message?: string;
  data?: User | User[];
}

export interface ImageItem {
  _id: string;
  url: string;
  thumbnailUrl: string;
  prompt: string;
  guidance?: number;
  seed?: number;
  height?: number;
  width?: number;
  steps?: number;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface IAllImageResponse {
  success: string;
  message: string;
  count: number;
  data: ImageItem[];
}

export interface ImageMask {
  composite?: HTMLCanvasElement;
  layers?: HTMLCanvasElement[];
  background?: HTMLCanvasElement;
}

export type ModelType =
  | "@cf/black-forest-labs/flux-1-schnell"
  | "@cf/stabilityai/stable-diffusion-xl-base-1.0"
  | "@cf/runwayml/stable-diffusion-v1-5"
  | "@cf/runwayml/stable-diffusion-v1-5-inpainting"
  | "@cf/runwayml/stable-diffusion-inpainting"
  | "@cf/stabilityai/stable-diffusion-xl-inpainting-1.0";

export type TextToImageModel =
  | "@cf/black-forest-labs/flux-1-schnell"
  | "@cf/stabilityai/stable-diffusion-xl-base-1.0"
  | "@cf/runwayml/stable-diffusion-v1-5";

export type InpaintingModel =
  | "@cf/runwayml/stable-diffusion-v1-5-inpainting"
  | "@cf/runwayml/stable-diffusion-inpainting"
  | "@cf/stabilityai/stable-diffusion-xl-inpainting-1.0";
