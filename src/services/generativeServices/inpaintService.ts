import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

// Validate environment variables
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const host = process.env.HOST || "localhost";
const port = process.env.PORT || 4000;

export async function inpaintImage(
  imageBase64: string,
  maskBase64: string,
  prompt: string,
  steps: number = 4,
  model: string = "@cf/runwayml/stable-diffusion-inpainting"
): Promise<{ absolutePath: string; relativePath: string }> {
  if (!accountId || !apiToken) {
    throw new Error(
      "Missing required environment variables: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN"
    );
  }

  if (!imageBase64 || !maskBase64) {
    throw new Error("Both image and mask are required for inpainting");
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
    const requestData = {
      image: imageBase64,
      mask: maskBase64,
      prompt,
      steps,
    };

    console.log(
      `Inpainting with model: ${model}, prompt: "${prompt}", steps: ${steps}`
    );

    // Make the API call
    const response = await axios.post(
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
        "No image data received from inpainting API. Response:",
        JSON.stringify(response.data, null, 2)
      );
      throw new Error("No image data received from inpainting API");
    }

    // Generate a unique filename for inpainted image
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedPrompt = prompt
      .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .substring(0, 30); // Limit length for filename

    const filename = `inpaint_${timestamp}_${sanitizedPrompt}.png`;

    // Ensure the images directory exists (root level)
    const imagesDir = path.join(process.cwd(), "images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const imagePath = path.join(imagesDir, filename);

    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(base64Image, "base64");
    fs.writeFileSync(imagePath, imageBuffer);

    let relativePath = `http://${host}:${port}/images/${filename}`;
    // If host does not start with localhost, use HTTPS
    if (!host.startsWith("localhost")) {
      relativePath = `https://${host}/images/${filename}`;
    }

    console.log(
      `Image successfully inpainted and saved to: ${imagePath} . View at: ${relativePath}`
    );

    return { absolutePath: imagePath, relativePath };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Inpainting API Error:",
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to inpaint image: ${
          error.response?.data?.message || error.message
        }`
      );
    } else {
      console.error("Unexpected inpainting error:", error);
      throw error;
    }
  }
}

// Example usage function (commented out for production)
// export async function inpaintImageExample(): Promise<{ absolutePath: string; relativePath: string } | undefined> {
//   try {
//     // You would need to provide actual base64 image and mask data here
//     const result = await inpaintImage(
//       "base64_image_data_here",
//       "base64_mask_data_here",
//       "a beautiful sunset landscape",
//       6,
//       "@cf/runwayml/stable-diffusion-inpainting"
//     );
//     console.log("Inpainted image result:", result);
//     return result;
//   } catch (error) {
//     console.error("Error in inpainting example:", error);
//     return undefined;
//   }
// }
