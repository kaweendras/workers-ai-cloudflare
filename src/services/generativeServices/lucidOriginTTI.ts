import axios from "axios";
import "dotenv/config";
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
} from "../../interfaces/textToImageInterface";
import { uploadImageBase64 } from "../imagekitService";
import { addImage } from "../imageServices";
import { IImage } from "../../models/imageModel";

interface LucidOriginTTIParams {
  prompt: string;
  guidance?: number;
  seed?: number;
  height?: number;
  width?: number;
  num_steps?: number;
  steps?: number;
  model?: string;
}

interface GeneratedImageResult {
  fileId: string;
  url: string;
  thumbnailUrl: string;
  fileName: string;
  filePath: string;
}
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const apiToken = process.env.CLOUDFLARE_API_TOKEN || "";

export async function lucidOriginTTI(
  params: LucidOriginTTIParams,
  email?: string
): Promise<GeneratedImageResult> {
  const {
    prompt,
    guidance = 4.5,
    seed,
    height = 1120,
    width = 1120,
    num_steps,
    steps,
    model = "@cf/leonardo/lucid-origin",
  } = params;
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
  // Use steps or num_steps, default to 8 if not provided
  const diffusionSteps = steps ?? num_steps ?? 8;
  if (diffusionSteps < 1 || diffusionSteps > 40) {
    throw new Error("Steps must be between 1 and 40");
  }
  if (height < 1 || height > 2500) {
    throw new Error("Height must be between 1 and 2500");
  }
  if (width < 1 || width > 2500) {
    throw new Error("Width must be between 1 and 2500");
  }
  if (guidance < 0 || guidance > 10) {
    throw new Error("Guidance must be between 0 and 10");
  }
  try {
    // Prepare the request payload
    const requestData: any = {
      prompt,
      steps: diffusionSteps,
      guidance,
      height,
      width,
    };
    if (typeof seed === "number") requestData.seed = seed;
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
    const base64Image = response.data.result?.image;
    if (!base64Image) {
      console.error(
        "No image data received from API. Response:",
        JSON.stringify(response.data, null, 2)
      );
      throw new Error("No image data received from API");
    }

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

    const filename = `${timestamp}_lucid-origin_${sanitizedPrompt}.png`;

    // Upload image to ImageKit
    const uploadResult = await uploadImageBase64(
      http, // base64 image data from Cloudflare API
      filename,
      "/generated-images", // folder in ImageKit
      ["ai-generated", "lucid-origin", "text-to-image", sanitizedPrompt.substring(0, 20)] // tags
    );

    console.log(
      `Lucid Origin image successfully generated and uploaded to ImageKit. URL: ${uploadResult.url}`
    );

    // Add image details to database with addImage function and IImage interface
    try {
      if(email) {
        const imageData: Partial<IImage> = {
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          prompt: prompt,
          guidance: guidance,
          height: height,
          width: width,
          steps: diffusionSteps,
          seed: seed,
          userEmail: email
        };
        await addImage(imageData);
        console.log("Lucid Origin image data added to database:", imageData);
      }
    } catch (error) {
      console.error("Error adding Lucid Origin image to database:", error);
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

// Example usage (uncomment for testing)
// (async () => {
//   try {
//     const result = await lucidOriginTTI({
//       prompt: "A serene landscape with mountains and a river",
//       steps: 8,
//       height: 1120,
//       width: 1120,
//       guidance: 4.5,
//     });
//     console.log("Generated image uploaded to ImageKit:", result.url);
//   } catch (err) {
//     console.error("Error generating image:", err);
//   }
// })();
