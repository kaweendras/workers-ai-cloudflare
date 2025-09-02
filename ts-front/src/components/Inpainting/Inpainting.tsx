import React, { useState, useRef } from "react";
import {
  inpaintImage,
  imageToBase64,
  imageToMaskArray,
} from "../../services/apiService";
import TextArea from "../common/TextArea";
import Slider from "../common/Slider";
import Button from "../common/Button";
import Dropdown from "../common/Dropdown";
import Card from "../common/Card";
import Input from "../common/Input";
import { notify } from "../../utils/helpers";
import { FiEdit3 } from "react-icons/fi";
import { useDropzone } from "react-dropzone";
import { validateImageFile } from "../../utils/helpers";
import type { InpaintingModel } from "../../types";

const Inpainting: React.FC = () => {
  // State for form inputs
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [steps, setSteps] = useState(10);
  const [strength, setStrength] = useState(0.8);
  const [guidance, setGuidance] = useState(7.5);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [seed, setSeed] = useState<number | null>(null);
  const [model, setModel] = useState<InpaintingModel>(
    "@cf/runwayml/stable-diffusion-v1-5-inpainting"
  );

  // State for file handling
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<HTMLCanvasElement | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  // Available models
  const models: InpaintingModel[] = [
    "@cf/runwayml/stable-diffusion-v1-5-inpainting",
    "@cf/runwayml/stable-diffusion-inpainting",
    "@cf/stabilityai/stable-diffusion-xl-inpainting-1.0",
  ];

  // File dropzone setup
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    onDrop: handleImageDrop,
  });

  function handleImageDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      if (validateImageFile(file)) {
        setSourceImage(file);
        const imageUrl = URL.createObjectURL(file);
        setSourceImageUrl(imageUrl);

        // Load the image to canvas for mask drawing
        const img = new Image();
        img.onload = () => {
          setupCanvases(img);
        };
        img.src = imageUrl;
      }
    }
  }

  function setupCanvases(img: HTMLImageElement) {
    // Set up the main canvas with the image
    const canvas = canvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;

    if (!canvas || !drawingCanvas) return;

    // Calculate aspect ratio
    const containerWidth = 512;
    const aspectRatio = img.width / img.height;

    // Set canvas dimensions
    canvas.width = containerWidth;
    canvas.height = containerWidth / aspectRatio;
    drawingCanvas.width = containerWidth;
    drawingCanvas.height = containerWidth / aspectRatio;

    // Draw the image on the main canvas
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    // Clear the drawing canvas
    const drawingCtx = drawingCanvas.getContext("2d");
    if (drawingCtx) {
      drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      drawingCtx.strokeStyle = "white";
      drawingCtx.lineWidth = 15;
      drawingCtx.lineCap = "round";
      drawingCtx.lineJoin = "round";
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawing.current = true;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    // Save the canvas as the mask
    setMaskImage(canvas);
  };

  const clearMask = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMaskImage(null);
  };

  const handleInpaint = async () => {
    if (!sourceImage) {
      notify.warning("Please upload an image");
      return;
    }

    if (!maskImage) {
      notify.warning("Please draw a mask on the image");
      return;
    }

    if (!prompt.trim()) {
      notify.warning("Please enter an inpainting prompt");
      return;
    }

    setIsLoading(true);
    setResultImage(null);

    try {
      // Convert image to base64
      const imageBase64 = await imageToBase64(sourceImage);

      // Convert mask to array
      const maskArray = await imageToMaskArray(maskImage, [64, 64]);

      // Prepare inpainting request
      const response = await inpaintImage({
        prompt,
        image_b64: imageBase64,
        mask: maskArray,
        num_steps: steps,
        strength,
        guidance,
        width,
        height,
        negative_prompt: negativePrompt.trim() ? negativePrompt : undefined,
        seed: seed !== null ? seed : undefined,
        model,
      });

      if (response.success === "true" && response.data) {
        const imageUrl = response.data.relativePath;
        setResultImage(imageUrl);
        notify.success("Image inpainted successfully!");
      } else {
        notify.error(response.error || "Failed to inpaint image");
      }
    } catch (error) {
      notify.error("Error inpainting image");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setSeed(null);
    } else {
      const num = parseInt(value);
      if (!isNaN(num)) {
        setSeed(num);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Upload Image
          </h2>
          {!sourceImageUrl ? (
            <div
              {...getRootProps()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <input {...getInputProps()} />
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Drag & drop an image here, or click to select
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="relative mb-2">
                <canvas
                  ref={canvasRef}
                  className="w-full rounded-lg"
                  style={{ maxHeight: "400px" }}
                />
                <canvas
                  ref={drawingCanvasRef}
                  className="absolute top-0 left-0 w-full h-full rounded-lg cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                />
              </div>
              <div className="flex justify-between">
                <Button onClick={clearMask} variant="outline">
                  Clear Mask
                </Button>
                <Button
                  onClick={() => {
                    setSourceImage(null);
                    setSourceImageUrl(null);
                    setMaskImage(null);
                  }}
                  variant="outline"
                >
                  Change Image
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Draw with white on areas you want to change
              </p>
            </div>
          )}
        </Card>

        <Card>
          <TextArea
            label="Inpainting Prompt"
            placeholder="Describe what should appear in the masked areas..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <TextArea
            label="Negative Prompt (Optional)"
            placeholder="What you don't want to see (e.g., blurry, low quality, artifacts)"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Slider
              label="Steps"
              value={steps}
              onChange={setSteps}
              min={1}
              max={20}
              step={1}
              info="Quality vs speed trade-off"
            />

            <Slider
              label="Strength"
              value={strength}
              onChange={setStrength}
              min={0.1}
              max={1.0}
              step={0.1}
              info="How much to transform"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Slider
              label="Guidance"
              value={guidance}
              onChange={setGuidance}
              min={1.0}
              max={15.0}
              step={0.5}
              info="How closely to follow prompt"
            />

            <Input
              label="Seed (Optional)"
              type="number"
              placeholder="For reproducible results"
              value={seed !== null ? seed.toString() : ""}
              onChange={handleSeedChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Slider
              label="Width"
              value={width}
              onChange={setWidth}
              min={256}
              max={2048}
              step={64}
              info="Output image width"
            />

            <Slider
              label="Height"
              value={height}
              onChange={setHeight}
              min={256}
              max={2048}
              step={64}
              info="Output image height"
            />
          </div>

          <Dropdown
            label="Inpainting Model"
            options={models}
            value={model}
            onChange={(value) => setModel(value as InpaintingModel)}
          />

          <Button
            onClick={handleInpaint}
            isLoading={isLoading}
            className="w-full mt-4"
            icon={<FiEdit3 />}
            variant="secondary"
            disabled={!sourceImage || !maskImage || !prompt.trim()}
          >
            Inpaint Image
          </Button>
        </Card>
      </div>

      <div>
        <Card className="sticky top-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Result
          </h2>
          <div className="rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 w-full h-[500px] flex items-center justify-center">
            {isLoading ? (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Inpainting your image...
                </p>
              </div>
            ) : resultImage ? (
              <img
                src={resultImage}
                alt="Inpainted result"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-6">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Upload an image, draw a mask, and add a prompt to see results
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Inpainting;
