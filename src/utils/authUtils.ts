import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET as string;

const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return { valid: true, decoded };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
};

export { verifyToken };
