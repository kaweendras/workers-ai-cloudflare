// Types for the API request and response
export interface ImageGenerationRequest {
  prompt: string;
  steps?: number; // Optional, defaults to 4, max 8
}
export interface ImageGenerationResponse {
  result: {
    image: string; // Base64 encoded image
  };
  success: boolean;
  errors: any[];
  messages: any[];
}
