import { Request, Response, NextFunction } from "express";
import * as generativeServices from "../services/generativeServices/textToImageService";

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

export { textToImageController };
