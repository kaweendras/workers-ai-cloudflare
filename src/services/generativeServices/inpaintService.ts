import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";
import { InpaintImageRequest } from "../../interfaces/inpaintInterface";

import { uploadImageBase64 } from "../imagekitService";
import { addImage } from "../imageServices";
import { IImage } from "../../models/imageModel";

// Validate environment variables
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const host = process.env.HOST || "localhost";
const port = process.env.PORT || 4000;

interface GeneratedImageResult {
  fileId: string;
  url: string;
  thumbnailUrl: string;
  fileName: string;
  filePath: string;
}

export async function inpaintImage(
  requestData: InpaintImageRequest,
  model: string = "@cf/runwayml/stable-diffusion-inpainting",
  email?: string
): Promise<GeneratedImageResult> {
  if (!accountId || !apiToken) {
    throw new Error(
      "Missing required environment variables: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN"
    );
  }

  // Validate required fields
  if (!requestData.prompt || requestData.prompt.length === 0) {
    throw new Error("Prompt is required and cannot be empty");
  }

  if (requestData.prompt.length > 2048) {
    throw new Error("Prompt cannot exceed 2048 characters");
  }

  // Validate dimensions if provided
  if (
    requestData.height &&
    (requestData.height < 256 || requestData.height > 2048)
  ) {
    throw new Error("Height must be between 256 and 2048 pixels");
  }

  if (
    requestData.width &&
    (requestData.width < 256 || requestData.width > 2048)
  ) {
    throw new Error("Width must be between 256 and 2048 pixels");
  }

  // Validate num_steps if provided
  if (
    requestData.num_steps &&
    (requestData.num_steps < 1 || requestData.num_steps > 20)
  ) {
    throw new Error("Number of steps must be between 1 and 20");
  }

  // Validate strength if provided
  if (
    requestData.strength &&
    (requestData.strength < 0 || requestData.strength > 1)
  ) {
    throw new Error("Strength must be between 0 and 1");
  }

  // Validate image array values if provided
  if (
    requestData.image &&
    requestData.image.some((val) => val < 0 || val > 255)
  ) {
    throw new Error("Image array values must be between 0 and 255");
  }

  // Validate mask array values if provided
  if (
    requestData.mask &&
    requestData.mask.some((val) => val < 0 || val > 255)
  ) {
    throw new Error("Mask array values must be between 0 and 255");
  }

  try {
    // Helper function to strip data URI prefix from base64 strings
    const stripDataUriPrefix = (base64String: string): string => {
      if (base64String.startsWith("data:")) {
        const commaIndex = base64String.indexOf(",");
        return commaIndex !== -1
          ? base64String.substring(commaIndex + 1)
          : base64String;
      }
      return base64String;
    };

    // Prepare the request payload according to Cloudflare schema
    const payload: any = {
      prompt: requestData.prompt,
      num_steps: requestData.num_steps || 20,
      guidance: requestData.guidance || 7.5,
      strength: requestData.strength || 1,
    };

    // Add image data - use image_b64 field as per schema (this works)
    if (requestData.image_b64) {
      payload.image_b64 = stripDataUriPrefix(requestData.image_b64);
      console.log(`Using image_b64, length: ${payload.image_b64.length}`);
    } else if (requestData.image) {
      payload.image = requestData.image;
    }

    // For mask, use the array format as per schema
    if (requestData.mask && Array.isArray(requestData.mask)) {
      payload.mask = requestData.mask;
      console.log(`Using mask array, length: ${requestData.mask.length}`);
    } else if (requestData.mask_b64) {
      // This is the problematic part - we need to convert base64 PNG to pixel array
      // For now, let's skip the mask to see if the rest of the API call works
      console.log(
        "WARNING: mask_b64 conversion not implemented yet - skipping mask"
      );
      console.log(
        "The inpainting may not work without a mask, but testing image_b64 format"
      );
    } else {
      console.log(
        "WARNING: No mask provided - inpainting may not work properly"
      );
    }

    // Add optional fields
    if (requestData.negative_prompt && requestData.negative_prompt.trim()) {
      payload.negative_prompt = requestData.negative_prompt;
    }

    if (requestData.seed) {
      payload.seed = requestData.seed;
    }

    if (
      requestData.width &&
      requestData.width >= 256 &&
      requestData.width <= 2048
    ) {
      payload.width = requestData.width;
    }

    if (
      requestData.height &&
      requestData.height >= 256 &&
      requestData.height <= 2048
    ) {
      payload.height = requestData.height;
    }

    console.log(
      `Inpainting with model: ${model}, prompt: "${requestData.prompt}", steps: ${payload.num_steps}`
    );

    console.log("Payload keys:", Object.keys(payload));
    console.log("Payload sizes:", {
      prompt: payload.prompt?.length || 0,
      negative_prompt: payload.negative_prompt?.length || 0,
      image_b64: payload.image_b64?.length || 0,
      mask:
        typeof payload.mask === "string"
          ? payload.mask.length
          : Array.isArray(payload.mask)
          ? payload.mask.length
          : 0,
      num_steps: payload.num_steps,
      guidance: payload.guidance,
      strength: payload.strength,
      width: payload.width,
      height: payload.height,
    });

    // Make the API call
    const response = await axios.post(
      `http://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // Expect binary data
      }
    );

    // For inpainting, the response is typically binary image data
    let imageBuffer: Buffer;

    // Check if the response is already a buffer or needs conversion
    if (Buffer.isBuffer(response.data)) {
      imageBuffer = response.data;
    } else if (typeof response.data === "string") {
      // If it's base64 encoded
      imageBuffer = Buffer.from(response.data, "base64");
    } else {
      // If it's an array buffer
      imageBuffer = Buffer.from(response.data);
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      console.error(
        "No image data received from inpainting API. Response headers:",
        response.headers
      );
      throw new Error("No image data received from inpainting API");
    }

    // Generate a unique filename for inpainted image
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedPrompt = requestData.prompt
      .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .substring(0, 30); // Limit length for filename

    const filename = `inpaint_${timestamp}_${sanitizedPrompt}.png`;

    // Convert buffer to base64 for ImageKit upload
    const base64Image = imageBuffer.toString("base64");

    // Upload image to ImageKit using base64
    const uploadResult = await uploadImageBase64(
      base64Image, // base64 image data
      filename,
      "/generated-images", // folder in ImageKit
      ["ai-generated", "inpainting", sanitizedPrompt.substring(0, 20)] // tags
    );

    console.log(
      `Image successfully inpainted and uploaded to ImageKit. URL: ${uploadResult.url}`
    );

    // Add image details to database with addImage function and IImage interface
    try {
      if (email) {
        const imageData: Partial<IImage> = {
          fileId: uploadResult.fileId,
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          prompt: requestData.prompt,
          guidance: requestData.guidance,
          height: requestData.height,
          width: requestData.width,
          steps: requestData.num_steps,
          userEmail: email,
        };
        await addImage(imageData);
        console.log("Inpainted image data added to database:", imageData);
      }
    } catch (error) {
      console.error("Error adding inpainted image to database:", error);
    }

    return {
      fileId: uploadResult.fileId,
      url: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl,
      fileName: uploadResult.name,
      filePath: uploadResult.filePath,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      let errorMessage = error.message;
      let errorData = error.response?.data;

      // If response data is a buffer, convert it to string
      if (Buffer.isBuffer(errorData)) {
        try {
          const errorString = errorData.toString("utf8");
          const errorJson = JSON.parse(errorString);
          errorMessage = errorJson.errors?.[0]?.message || errorString;
          console.error("Decoded Cloudflare API Error:", errorJson);
        } catch (parseError) {
          errorMessage = errorData.toString("utf8");
          console.error("Raw Cloudflare API Error:", errorMessage);
        }
      } else {
        console.error("Inpainting API Error:", errorData || error.message);
      }

      throw new Error(`Failed to inpaint image: ${errorMessage}`);
    } else {
      console.error("Unexpected inpainting error:", error);
      throw error;
    }
  }
}

// Legacy function for backward compatibility
export async function inpaintImageLegacy(
  imageBase64: string,
  maskBase64: string,
  prompt: string,
  steps: number = 4,
  model: string = "@cf/runwayml/stable-diffusion-inpainting",
  email?: string
): Promise<GeneratedImageResult> {
  const requestData: InpaintImageRequest = {
    prompt,
    image_b64: imageBase64,
    mask: [], // Convert base64 to array if needed, or use a different field
    num_steps: steps,
  };

  return inpaintImage(requestData, model, email);
}

// Example usage function (commented out for production)
// export async function inpaintImageExample(): Promise<{ absolutePath: string; relativePath: string } | undefined> {
//   try {
//     const requestData: InpaintImageRequest = {
//       prompt: "a beautiful sunset landscape",
//       image_b64: "base64_image_data_here",
//       mask: [], // mask data as array
//       num_steps: 6,
//     };
//     const result = await inpaintImage(requestData, "@cf/runwayml/stable-diffusion-inpainting");
//     console.log("Inpainted image result:", result);
//     return result;
//   } catch (error) {
//     console.error("Error in inpainting example:", error);
//     return undefined;
//   }
// }
