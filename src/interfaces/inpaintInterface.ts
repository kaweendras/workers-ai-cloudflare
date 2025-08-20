// Interface for inpainting image request
export interface InpaintImageRequest {
  image: string; // Base64 encoded image
  mask: string; // Base64 encoded mask
  prompt: string;
  steps?: number; // Optional, defaults to 4
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
