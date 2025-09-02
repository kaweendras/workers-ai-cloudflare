import { OpenAI } from "openai";
import dotenv from "dotenv";
import * as fs from "fs";
import { ImageCompletionInterface } from "../../interfaces/ImageCompletionInterface";

dotenv.config();

const host = process.env.HOST || "localhost";
const port = process.env.PORT || 4000;
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "<YOUR_SITE_URL>", // Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "<YOUR_SITE_NAME>", // Optional. Site title for rankings on openrouter.ai.
  },
});
export async function nanaoBanana(prompt: string, imageURL: string) {
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

    const tmpDir = `${process.cwd()}/tmp`;
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    //save response data as a json in tmpDir
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const jsonPath = `${tmpDir}/${timestamp}_nanoBanana.json`;
    fs.writeFileSync(jsonPath, JSON.stringify(completion, null, 2));

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

    // Generate a unique filename
    const filename = `${timestamp}_nanoBanana.png`;
    const imagesDir = `${process.cwd()}/images`;
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const imagePath = `${imagesDir}/${filename}`;

    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(base64Image, "base64");
    fs.writeFileSync(imagePath, imageBuffer);

    console.log(`Image saved to: ${imagePath}`);

    let relativePath = `http://${host}:${port}/images/${filename}`;
    //if host does not start with localhost
    if (!host.startsWith("localhost")) {
      relativePath = `https://${host}/images/${filename}`;
    }
    return { absolutePath: imagePath, relativePath };
  } catch (error) {
    console.error("Error generating nanoBanana:", error);
    throw new Error("Error generating nanoBanana");
  }
}
