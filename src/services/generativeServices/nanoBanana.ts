import { OpenAI } from "openai";
import dotenv from "dotenv";
import { ImageCompletionInterface } from "../../interfaces/ImageCompletionInterface";
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

dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "<YOUR_SITE_URL>", // Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "<YOUR_SITE_NAME>", // Optional. Site title for rankings on openrouter.ai.
  },
});
export async function nanaoBanana(prompt: string, imageURL: string, email?: string): Promise<GeneratedImageResult> {
  try {
    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash-image-preview:free",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageURL,
              },
            },
          ],
        },
      ],
    });

    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    
    // Extract base64 image from ImageCompletionInterface response
    const imageCompletion: ImageCompletionInterface = completion as any;
    const base64Image =
      imageCompletion.choices?.[0]?.message?.images?.[0]?.image_url?.url?.split(
        ","
      )[1];

    if (!base64Image) {
      console.error(
        "No image data found in ImageCompletionInterface response."
      );
      throw new Error(
        "No image data found in ImageCompletionInterface response."
      );
    }

    // Generate filename and upload to ImageKit
    const filename = `${timestamp}_nanoBanana.png`;
    
    // Create a simple prompt snippet for tagging
    const promptSnippet = prompt
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 20);

    // Upload image to ImageKit
    const uploadResult = await uploadImageBase64(
      base64Image,
      filename,
      "/generated-images", // folder in ImageKit
      ["ai-generated", "nano-banana", "vision-analysis", promptSnippet] // tags
    );

    console.log(
      `NanoBanana image successfully generated and uploaded to ImageKit. URL: ${uploadResult.url}`
    );

    // Add image details to database with addImage function and IImage interface
    try {
      if(email) {
        const imageData: Partial<IImage> = {
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          prompt: prompt,
          userEmail: email
        };
        await addImage(imageData);
        console.log("NanoBanana image data added to database:", imageData);
      }
    } catch (error) {
      console.error("Error adding NanoBanana image to database:", error);
    }

    return {
      fileId: uploadResult.fileId,
      url: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl,
      fileName: uploadResult.name,
      filePath: uploadResult.filePath
    };
  } catch (error) {
    console.error("Error generating nanoBanana:", error);
    throw new Error("Error generating nanoBanana");
  }
}
