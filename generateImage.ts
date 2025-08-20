import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
} from "./interfaces/ImageGenerationRequestInterface";

export async function generateImage(
  prompt: string,
  steps: number = 4
): Promise<string> {
  // Validate environment variables
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error(
      "Missing required environment variables: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN"
    );
  }

  // Validate input parameters
  if (!prompt || prompt.length === 0) {
    throw new Error("Prompt is required and cannot be empty");
  }

  if (prompt.length > 2048) {
    throw new Error("Prompt cannot exceed 2048 characters");
  }

  if (steps < 1 || steps > 8) {
    throw new Error("Steps must be between 1 and 8");
  }

  try {
    // Prepare the request payload
    const requestData: ImageGenerationRequest = {
      prompt,
      steps,
    };

    // Make the API call
    const response = await axios.post<ImageGenerationResponse>(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the base64 image from response
    const base64Image = response.data.result?.image;

    if (!base64Image) {
      console.error(
        "No image data received from API. Response:",
        JSON.stringify(response.data, null, 2)
      );
      throw new Error("No image data received from API");
    }

    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedPrompt = prompt
      .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .substring(0, 50); // Limit length

    const filename = `${timestamp}_${sanitizedPrompt}.png`;
    const imagePath = path.join(__dirname, "images", filename);

    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(base64Image, "base64");
    fs.writeFileSync(imagePath, imageBuffer);

    console.log(`Image successfully generated and saved to: ${imagePath}`);
    return imagePath;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", error.response?.data || error.message);
      throw new Error(
        `Failed to generate image: ${
          error.response?.data?.message || error.message
        }`
      );
    } else {
      console.error("Unexpected error:", error);
      throw error;
    }
  }
}

// usage of the function
export async function generateImageExample(): Promise<void> {
  try {
    const imagePath = await generateImage("futuristic cityscape at sunset", 8);
    console.log("Generated image saved at:", imagePath);
  } catch (error) {
    console.error("Error generating image:", error);
  }
}

// If running this file directly
if (require.main === module) {
  generateImageExample();
}
