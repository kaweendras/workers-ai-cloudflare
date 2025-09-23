import axios from "axios";
import {
  SdxlRequestInterface,
  SdxlResponseInterface,
} from "../../interfaces/sdxlInterface";
import { uploadImageBase64 } from "../imagekitService";
import { addImage } from "../imageServices";
import { IImage } from "../../models/imageModel";

interface GeneratedImageResult {
  fileId: string;
  url: string;
  thumbnailUrl: string;
  fileName: string;
  filePath: string;
}

export const sdxlService = async (
  requestData: SdxlRequestInterface,
  email?: string
): Promise<GeneratedImageResult> => {
  try {
    // Validate input parameters
    if (!requestData.prompt || requestData.prompt.trim().length === 0) {
      throw new Error("Prompt is required");
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

    // Validate num_steps
    if (requestData.num_steps && requestData.num_steps > 20) {
      throw new Error("Maximum number of steps is 20");
    }

    // Validate strength for img2img
    if (
      requestData.strength !== undefined &&
      (requestData.strength < 0 || requestData.strength > 1)
    ) {
      throw new Error("Strength must be between 0 and 1");
    }

    // Prepare API request
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`;

    const headers = {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    };

    // Prepare request payload with defaults
    const payload = {
      prompt: requestData.prompt.trim(),
      ...(requestData.negative_prompt && {
        negative_prompt: requestData.negative_prompt,
      }),
      ...(requestData.height && { height: requestData.height }),
      ...(requestData.width && { width: requestData.width }),
      ...(requestData.image && { image: requestData.image }),
      ...(requestData.image_b64 && { image_b64: requestData.image_b64 }),
      ...(requestData.mask && { mask: requestData.mask }),
      num_steps: requestData.num_steps || 20,
      strength: requestData.strength || 1,
      guidance: requestData.guidance || 7.5,
      ...(requestData.seed && { seed: requestData.seed }),
    };

    console.log("SDXL API Request:", {
      url: apiUrl,
      payload: {
        ...payload,
        image_b64: payload.image_b64 ? "[BASE64_DATA]" : undefined,
      },
    });

    // Make API call
    const response = await axios.post(apiUrl, payload, {
      headers,
      responseType: "arraybuffer", // Since output is binary PNG
    });

    // Process binary response (PNG image)
    if (response.data && response.data.byteLength > 0) {
      const buffer = Buffer.from(response.data);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const sanitizedPrompt = requestData.prompt
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);
      const fileName = `${timestamp}_sdxl_${sanitizedPrompt}.png`;

      // Convert to base64 for ImageKit upload
      const base64Image = buffer.toString("base64");

      // Upload image to ImageKit
      const uploadResult = await uploadImageBase64(
        base64Image,
        fileName,
        "/generated-images", // folder in ImageKit
        [
          "ai-generated",
          "sdxl",
          "stable-diffusion",
          sanitizedPrompt.substring(0, 20),
        ] // tags
      );

      console.log(
        `SDXL image successfully generated and uploaded to ImageKit. URL: ${uploadResult.url}`
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
            seed: requestData.seed,
            userEmail: email,
          };
          await addImage(imageData);
          console.log("SDXL image data added to database:", imageData);
        }
      } catch (error) {
        console.error("Error adding SDXL image to database:", error);
      }

      return {
        fileId: uploadResult.fileId,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        fileName: uploadResult.name,
        filePath: uploadResult.filePath,
      };
    }

    throw new Error("No image data received from API");
  } catch (error: any) {
    console.error("SDXL Service Error:", error.message);

    // Handle specific API errors
    if (error.response) {
      const apiError =
        error.response.data?.errors?.[0]?.message ||
        error.response.data?.message ||
        `API Error: ${error.response.status}`;
      throw new Error(apiError);
    }

    throw new Error(error.message || "Unknown error occurred");
  }
};
