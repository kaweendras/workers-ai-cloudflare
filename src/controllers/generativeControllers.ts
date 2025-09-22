import { Request, Response, NextFunction } from "express";
import * as generativeServices from "../services/generativeServices/textToImageService";
import * as inpaintServices from "../services/generativeServices/inpaintService";
import { InpaintImageRequest } from "../interfaces/inpaintInterface";
import { nanaoBanana } from "../services/generativeServices/nanoBanana";
import { lucidOriginTTI } from "../services/generativeServices/lucidOriginTTI";
import { sdxlService } from "../services/generativeServices/sdxlService";
import { SdxlRequestInterface } from "../interfaces/sdxlInterface";
import * as path from "path";
import * as fs from "fs";

import { verifyToken } from "../utils/authUtils";

const textToImageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { prompt, steps, model } = req.body;
  try {
    const textToImageResponse = await generativeServices.generateImage(
      prompt,
      steps,
      model
    );

    console.log("Text to Image Response:", textToImageResponse);
    return res.status(200).json({
      success: "true",
      message: "Image generated successfully",
      data: textToImageResponse,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: "false",
      message: "Failed to generate image",
      error: err.message,
      data: [],
    });
  }
};

const lucidOriginTTIController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { prompt, steps, height, width, guidance } = req.body;
  try {
    const lucidOriginTTIResponse = await lucidOriginTTI({
      prompt,
      steps,
      height,
      width,
      guidance,
    });
    return res.status(200).json({
      success: "true",
      message: "Image generated successfully",
      data: lucidOriginTTIResponse,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: "false",
      message: "Failed to generate image",
      error: err.message,
      data: [],
    });
  }
};

const inpaintImageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      prompt,
      negative_prompt,
      height,
      width,
      image,
      image_b64,
      mask,
      mask_b64,
      num_steps,
      strength,
      guidance,
      seed,
      model,
    } = req.body;

    // Validate required fields according to the new schema
    if (!prompt) {
      return res.status(400).json({
        success: "false",
        message: "Missing required field: prompt is required",
        data: [],
      });
    }

    // Validate field constraints
    if (height && (height < 256 || height > 2048)) {
      return res.status(400).json({
        success: "false",
        message: "Height must be between 256 and 2048 pixels",
        data: [],
      });
    }

    if (width && (width < 256 || width > 2048)) {
      return res.status(400).json({
        success: "false",
        message: "Width must be between 256 and 2048 pixels",
        data: [],
      });
    }

    if (num_steps && num_steps > 20) {
      return res.status(400).json({
        success: "false",
        message: "Number of steps cannot exceed 20",
        data: [],
      });
    }

    if (strength && (strength < 0 || strength > 1)) {
      return res.status(400).json({
        success: "false",
        message: "Strength must be between 0 and 1",
        data: [],
      });
    }

    // Prepare the request data according to the new interface
    const requestData: InpaintImageRequest = {
      prompt,
      ...(negative_prompt && { negative_prompt }),
      ...(height && { height }),
      ...(width && { width }),
      ...(image && { image }),
      ...(image_b64 && { image_b64 }),
      ...(mask && { mask }),
      ...(mask_b64 && { mask_b64 }),
      ...(num_steps && { num_steps }),
      ...(strength && { strength }),
      ...(guidance && { guidance }),
      ...(seed && { seed }),
    };

    const inpaintResponse = await inpaintServices.inpaintImage(
      requestData,
      model
    );

    return res.status(200).json({
      success: "true",
      message: "Image inpainted successfully",
      data: inpaintResponse,
    });
  } catch (err: any) {
    console.error("Inpainting error:", err);
    return res.status(500).json({
      success: "false",
      message: "Failed to inpaint image",
      error: err.message,
      data: [],
    });
  }
};

const nanaoBananaController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { prompt, imageURL } = req.body;
  try {
    const nanaoBananaResponse = await nanaoBanana(prompt, imageURL);
    return res.status(200).json({
      success: "true",
      message: "Image processed successfully",
      data: nanaoBananaResponse,
    });
  } catch (err: any) {
    console.error("nanaoBanana error:", err);
    return res.status(500).json({
      success: "false",
      message: "Failed to process image",
      error: err.message,
      data: [],
    });
  }
};



const sdxlController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requestData: SdxlRequestInterface = req.body;
    
    const result = await sdxlService(requestData);
    
    if (result.url) {
      res.status(200).json({
        success: "true",
        message: "Image generated successfully",
        data: result
      });
    } else {
      res.status(400).json({
        success: "false",
        message: "Failed to generate image",
        data: []
      });
    }
  } catch (error: any) {
    console.error('SDXL Controller Error:', error.message);
    res.status(500).json({
      success: "false",
      error: 'Internal server error'
    });
  }
};



//// manipulations

const getAllImagesController = (req: Request, res: Response) => {
  const imagesDir = path.join(process.cwd(), "images");
  try {
    // Check if directory exists
    if (!fs.existsSync(imagesDir)) {
      return res.status(404).json({
        success: "false",
        message: "Images directory not found",
        data: [],
      });
    }

    // Get all files with image extensions
    const files = fs
      .readdirSync(imagesDir)
      .filter((file) =>
        [".png", ".jpg", ".jpeg", ".gif", ".webp"].some((ext) =>
          file.toLowerCase().endsWith(ext)
        )
      );

    // Generate URLs for each image
    const host = process.env.HOST || req.hostname || "localhost";
    const port = process.env.PORT || 4000;
    const imageUrls = files.map((file) => {
      if (!host.startsWith("localhost")) {
        return `https://${host}/images/${file}`;
      }
      return `http://${host}:${port}/images/${file}`;
    });

    return res.status(200).json({
      success: "true",
      message: "Images listed successfully",
      count: imageUrls.length,
      data: imageUrls,
    });
  } catch (err: any) {
    console.error("Error listing images:", err);
    return res.status(500).json({
      success: "false",
      message: "Failed to list images",
      error: err.message,
      data: [],
    });
  }
};

const deleteImageController = (req: Request, res: Response) => {
  const { filename } = req.params;
  const imagesDir = path.join(process.cwd(), "images");

  console.log(`DELETE request received for image: ${filename}`);
  console.log(`Request params:`, req.params);
  console.log(`Request path:`, req.path);

  try {
    // Check if directory exists
    if (!fs.existsSync(imagesDir)) {
      console.log(`Images directory not found at: ${imagesDir}`);
      return res.status(404).json({
        success: "false",
        message: "Images directory not found",
        data: [],
      });
    }

    const imagePath = path.join(imagesDir, filename);
    console.log(`Looking for image at path: ${imagePath}`);

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.log(`Image not found at path: ${imagePath}`);
      return res.status(404).json({
        success: "false",
        message: "Image not found",
        data: [],
      });
    }

    // Check if the file is actually an image
    const isImage = [".png", ".jpg", ".jpeg", ".gif", ".webp"].some((ext) =>
      filename.toLowerCase().endsWith(ext)
    );

    if (!isImage) {
      console.log(`File is not an image: ${filename}`);
      return res.status(400).json({
        success: "false",
        message: "File is not an image",
        data: [],
      });
    }

    // Delete the image
    fs.unlinkSync(imagePath);
    console.log(`Successfully deleted image at: ${imagePath}`);

    return res.status(200).json({
      success: "true",
      message: "Image deleted successfully",
      data: {
        filename,
      },
    });
  } catch (err: any) {
    console.error("Error deleting image:", err);
    return res.status(500).json({
      success: "false",
      message: "Failed to delete image",
      error: err.message,
      data: [],
    });
  }
};

export {
  textToImageController,
  inpaintImageController,
  nanaoBananaController,
  getAllImagesController,
  deleteImageController,
  lucidOriginTTIController,
  sdxlController,
};
