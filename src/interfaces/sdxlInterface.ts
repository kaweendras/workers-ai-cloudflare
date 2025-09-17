export interface SdxlRequestInterface {
  prompt: string;
  negative_prompt?: string;
  height?: number; // 256-2048
  width?: number; // 256-2048
  image?: number[]; // For img2img tasks
  image_b64?: string; // Base64 for img2img tasks
  mask?: number[]; // For inpainting
  num_steps?: number; // Default 20, max 20
  strength?: number; // 0-1, default 1
  guidance?: number; // Default 7.5
  seed?: number;
}

export interface SdxlResponseInterface {
  success: boolean;
  data?: {
    result: string; // base64 encoded image
    filePath?: string;
    fileName?: string;
    meta?: {
      duration?: number;
      seed?: number;
    };
  };
  error?: string;
}