import { Request, Response, NextFunction } from "express";
import * as generativeServices from "../services/generativeServices/textToImageService";
import * as inpaintServices from "../services/generativeServices/inpaintService";
import { InpaintImageRequest } from "../interfaces/inpaintInterface";
import { nanaoBanana } from "../services/generativeServices/nanoBanana";

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

export { textToImageController, inpaintImageController, nanaoBananaController };
