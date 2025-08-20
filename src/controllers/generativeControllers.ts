import { Request, Response, NextFunction } from "express";
import * as generativeServices from "../services/generativeServices/textToImageService";
import * as inpaintServices from "../services/generativeServices/inpaintService";

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
  const { image, mask, prompt, steps, model } = req.body;

  try {
    // Validate required fields
    if (!image || !mask || !prompt) {
      return res.status(400).json({
        success: "false",
        message:
          "Missing required fields: image, mask, and prompt are required",
        data: [],
      });
    }

    const inpaintResponse = await inpaintServices.inpaintImage(
      image,
      mask,
      prompt,
      steps,
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

export { textToImageController, inpaintImageController };
