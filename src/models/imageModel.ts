import mongoose, { Schema, Document } from "mongoose";

export interface IImage extends Document {
  url: string;
  thumbnailUrl: string;
  prompt: string;
  guidance: number;
  seed: number | undefined;
  height: number;
  width: number;
  steps: number;
  userEmail: string | undefined;
}

const imageschema: Schema = new Schema(
  {
    url: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    prompt: { type: String, required: true },
    guidance: { type: Number, required: false },
    seed: { type: Number, required: false },
    height: { type: Number, required: false },
    width: { type: Number, required: false },
    steps: { type: Number, required: false },
    userEmail: { type: String, required: false },
  },
  { timestamps: true }
);

export default mongoose.model<IImage>("Images", imageschema);
