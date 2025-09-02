import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
} from "../../interfaces/textToImageInterface";

// Validate environment variables
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const host = process.env.HOST || "localhost";
const port = process.env.PORT || 4000;

export async function generateImage(
  prompt: string,
  steps: number = 4,
  model: string = "@cf/black-forest-labs/flux-1-schnell"
): Promise<string | any> {
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

// usage of the function
// export async function generateImageExample(): Promise<string | undefined> {
//   try {
//     const imagePath = await generateImage(
//       "Dark city at night from distance",
//       8,
//       "@cf/black-forest-labs/flux-1-schnell"
//     );
//     // console.log("Generated image saved at:", imagePath);
//     return imagePath;
//   } catch (error) {
//     console.error("Error generating image:", error);
//     return undefined;
//   }
// }

// If running this file directly
// if (require.main === module) {
//   generateImageExample();
// }
