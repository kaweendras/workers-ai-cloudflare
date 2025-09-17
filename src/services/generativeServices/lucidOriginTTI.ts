import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
} from "../../interfaces/textToImageInterface";

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
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const apiToken = process.env.CLOUDFLARE_API_TOKEN || "";

const host = process.env.HOST || "localhost";
const port = process.env.PORT || 4001;

export async function lucidOriginTTI(
  params: LucidOriginTTIParams
): Promise<any> {
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

    // Optionally save image to disk (uncomment if needed)
    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedPrompt = prompt
      .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .substring(0, 50); // Limit length

    const filename = `${timestamp}_${sanitizedPrompt}.png`;
    // Ensure the images directory exists (root level)
    const imagesDir = path.join(process.cwd(), "images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    const imagePath = path.join(imagesDir, filename);

    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(http, "base64");
    fs.writeFileSync(imagePath, imageBuffer);

    let relativePath = `http://${host}:${port}/images/${filename}`;
    //if host does not start with localhost
    if (!host.startsWith("localhost")) {
      relativePath = `https://${host}/images/${filename}`;
    }

    console.log(
      `Image successfully generated and saved to: ${imagePath} . View at: ${relativePath}`
    );
    return { absolutePath: imagePath, relativePath };
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
//     // console.log("Generated image data:", result.image);
//   } catch (err) {
//     console.error("Error generating image:", err);
//   }
// })();
