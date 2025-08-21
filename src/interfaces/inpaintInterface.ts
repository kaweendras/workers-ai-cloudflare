// Interface for inpainting image request based on the new schema
export interface InpaintImageRequest {
  prompt: string; // Required - A text description of the image you want to generate
  negative_prompt?: string; // Optional - Text describing elements to avoid in the generated image
  height?: number; // Optional - The height of the generated image in pixels (256-2048)
  width?: number; // Optional - The width of the generated image in pixels (256-2048)
  image?: number[]; // Optional - An array of integers that represent the image data (0-255)
  image_b64?: string; // Optional - A base64-encoded string of the input image
  mask?: number[]; // Optional - An array of integers that represent mask image data (0-255)
  mask_b64?: string; // Optional - A base64-encoded string of the mask image (more efficient than array)
  num_steps?: number; // Optional - The number of diffusion steps (max 20, default 20)
  strength?: number; // Optional - A value between 0 and 1 (default 1)
  guidance?: number; // Optional - Controls prompt adherence (default 7.5)
  seed?: number; // Optional - Random seed for reproducibility
}

// Interface for inpainting image response
export interface InpaintImageResponse {
  success: boolean;
  result?: {
    image: string; // Base64 encoded result image
  };
  errors?: Array<{
    code: number;
    message: string;
  }>;
}

// Extended interface that matches your API response structure
export interface InpaintApiResponse {
  success: string; // "true" or "false"
  message: string;
  data: {
    absolutePath: string;
    relativePath: string;
  };
  error?: string;
}
