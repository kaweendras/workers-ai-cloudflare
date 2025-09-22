import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/authUtils";
import { JwtPayload } from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.log(`No token provided`);
    return res.status(401).json({
      message: "No token provided User must logged in to do this action",
    });
  }

  const { valid, decoded, error } = verifyToken(token);
  if (!valid) {
    console.log(`Invalid token: ${error}`);
    return res.status(401).json({ message: "Invalid token", error });
  }

  next();
};

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.log(`No token provided`);
    return res.status(401).json({
      message: "No token provided User must logged in to do this action",
    });
  }
  const { valid, decoded, error } = verifyToken(token);
  if (!valid) {
    console.log(`Invalid token: ${error}`);
    return res.status(401).json({ message: "Invalid token", error });
  }
  const payload = decoded as JwtPayload;
  if (payload.role !== "admin") {
    console.log(`User is not admin`);
    return res.status(403).json({ message: "Access denied, admin only" });
  }
  next();
};

export const decodedToken = (req: Request): JwtPayload | null => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.log(`No token provided`);
    return null;
  }
  const { valid, decoded, error } = verifyToken(token);
  if (!valid) {
    console.log(`Invalid token: ${error}`);
    return null;
  }
  return decoded as JwtPayload;
};
