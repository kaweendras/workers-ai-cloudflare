import axios from "axios";
import "dotenv/config";
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
} from "../../interfaces/textToImageInterface";
import { uploadImageBase64 } from "../imagekitService";

import {addImage} from "../imageServices";
import {IImage} from "../../models/imageModel";

interface GeneratedImageResult {
  fileId: string;
  url: string;
  thumbnailUrl: string;
  fileName: string;
  filePath: string;
}

// Validate environment variables
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

export async function generateImage(
  prompt: string,
  steps: number = 4,
  model: string = "@cf/black-forest-labs/flux-1-schnell",
  email: string | undefined
): Promise<GeneratedImageResult> {
  if (!accountId || !apiToken) {
    throw new Error(
      "Missing required environment variables: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN"
    );
  }

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
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const http = response.data.result?.image;

    if (!http) {
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

    // Upload image to ImageKit using base64
    const uploadResult = await uploadImageBase64(
      http, // base64 image data from Cloudflare API
      filename,
      "/generated-images", // folder in ImageKit
      ["ai-generated", "text-to-image", sanitizedPrompt.substring(0, 20)] // tags
    );

    console.log(
      `Image successfully generated and uploaded to ImageKit. URL: ${uploadResult.url}`
    );

    //add image details to db with addImage function and IImage interface
    try {
      if(email) {
        const imageData: Partial<IImage> = {
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          prompt: prompt,
          steps: steps,
          userEmail: email
        };
        await addImage(imageData);
        console.log("Image data added to database:", imageData);
      }
    } catch (error) {
      console.error("Error adding image to database:", error);
    }

    return { 
      fileId: uploadResult.fileId,
      url: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl,
      fileName: uploadResult.name,
      filePath: uploadResult.filePath
    };
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
// export async function generateImageExample(): Promise<GeneratedImageResult | undefined> {
//   try {
//     const imageResult = await generateImage(
//       "Dark city at night from distance",
//       8,
//       "@cf/black-forest-labs/flux-1-schnell"
//     );
//     console.log("Generated image uploaded to ImageKit:", imageResult.url);
//     return imageResult;
//   } catch (error) {
//     console.error("Error generating image:", error);
//     return undefined;
//   }
// }

// If running this file directly
// if (require.main === module) {
//   generateImageExample();
// }
