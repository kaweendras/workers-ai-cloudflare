import React, { useState, useEffect } from "react";
import { imageToImageAPI } from "../../services/apiService";
import Button from "../common/Button";
import TextArea from "../common/TextArea";
import Slider from "../common/Slider";
import { notify } from "../../utils/helpers";
import { useDropzone } from "react-dropzone";
import { validateImageFile } from "../../utils/helpers";

const ImageToImage: React.FC = () => {
  const [params, setParams] = useState({
    prompt: "",
    negative_prompt: "",
    height: 1024,
    width: 1024,
    num_steps: 20,
    strength: 0.8,
    guidance: 7.5,
    seed: undefined as number | undefined,
  });
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);

  // Cleanup object URL when component unmounts or sourceImageUrl changes
  useEffect(() => {
    return () => {
      if (sourceImageUrl) {
        URL.revokeObjectURL(sourceImageUrl);
      }
    };
  }, [sourceImageUrl]);

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

        // Create an image element to get dimensions
        const img = new Image();
        img.onload = () => {
          console.log("Image loaded:", img.width, "x", img.height);
          // Set the width and height to match the uploaded image
          setParams((prev) => {
            const newParams = {
              ...prev,
              width: img.width,
              height: img.height,
            };
            console.log("Setting new params:", newParams);
            return newParams;
          });
        };
        img.onerror = () => {
          console.error("Failed to load image for dimension detection");
        };
        img.src = imageUrl;
      }
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setParams((prev) => ({
      ...prev,
      [name]:
        name === "prompt" || name === "negative_prompt"
          ? value
          : value === ""
          ? undefined
          : Number(value),
    }));
  };

  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    setParams((prev) => ({ ...prev, seed: randomSeed }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.prompt.trim()) {
      notify.warning("Prompt is required");
      return;
    }

    if (!sourceImage) {
      notify.warning("Please upload an image");
      return;
    }

    setLoading(true);
    setError(null);
    setImage(null);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1];

        const response = await imageToImageAPI({
          prompt: params.prompt,
          negative_prompt: params.negative_prompt || undefined,
          height: params.height,
          width: params.width,
          image_b64: base64Data,
          num_steps: params.num_steps,
          strength: params.strength,
          guidance: params.guidance,
          seed: params.seed || undefined,
        });

        if (response.success === "true" && response.data) {
          // Use the URL from the response data
          setImage(response.data.url);
          notify.success(response.message || "Image generated successfully!");
        } else {
          throw new Error(response.error || "Request failed");
        }
        setLoading(false);
      };
      reader.readAsDataURL(sourceImage);
    } catch (error: any) {
      console.error("ImageToImage Error:", error);
      setError(error.message || "Unknown error");
      notify.error(error.message || "An error occurred");
      setLoading(false);
    }
  };

  // Example prompts
  const examples = [
    "Transform this into a watercolor painting",
    "Make this look like a cyberpunk scene",
    "Convert to a vintage sepia photograph",
    "Turn into a fantasy illustration",
    "Make it look like an oil painting",
    "Transform into a cartoon style",
  ];

  const applyExample = (example: string) => {
    setParams((prev) => ({ ...prev, prompt: example }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="sticky top-4">
          {/* Image Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Source Image *
            </label>
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
                <img
                  src={sourceImageUrl}
                  alt="Source"
                  className="w-full rounded-lg max-h-48 object-cover"
                />
                <div className="mt-2 flex gap-2">
                  <Button
                    onClick={() => {
                      setSourceImage(null);
                      setSourceImageUrl(null);
                      // Reset dimensions to default when removing image
                      setParams((prev) => ({
                        ...prev,
                        width: 1024,
                        height: 1024,
                      }));
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Change Image
                  </Button>
                  <Button
                    onClick={() => {
                      if (sourceImageUrl) {
                        const img = new Image();
                        img.onload = () => {
                          console.log(
                            "Manual dimension update:",
                            img.width,
                            "x",
                            img.height
                          );
                          setParams((prev) => ({
                            ...prev,
                            width: img.width,
                            height: img.height,
                          }));
                          notify.success(
                            `Output dimensions set to ${img.width}x${img.height} (from uploaded image)`
                          );
                        };
                        img.src = sourceImageUrl;
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Auto-Size
                  </Button>
                </div>
              </div>
            )}
          </div>

          <TextArea
            label="Prompt"
            name="prompt"
            placeholder="Describe the transformation you want to apply..."
            value={params.prompt}
            onChange={handleChange}
            rows={4}
            required
          />

          <TextArea
            label="Negative Prompt"
            name="negative_prompt"
            placeholder="Describe what you want to avoid in the transformation..."
            value={params.negative_prompt}
            onChange={handleChange}
            rows={2}
          />

          <div className="grid grid-cols-2 gap-2">
            <Slider
              label="Width"
              value={params.width}
              onChange={(v) => setParams((prev) => ({ ...prev, width: v }))}
              min={256}
              max={Math.max(2048, params.width)}
              step={64}
              info={
                sourceImage
                  ? `${params.width}px (from image)`
                  : `${params.width}px`
              }
            />
            <Slider
              label="Height"
              value={params.height}
              onChange={(v) => setParams((prev) => ({ ...prev, height: v }))}
              min={256}
              max={Math.max(2048, params.height)}
              step={64}
              info={
                sourceImage
                  ? `${params.height}px (from image)`
                  : `${params.height}px`
              }
            />
          </div>

          <Slider
            label="Steps"
            value={params.num_steps}
            onChange={(v) => setParams((prev) => ({ ...prev, num_steps: v }))}
            min={1}
            max={50}
            step={1}
            info="Higher steps = better quality but slower"
          />

          <Slider
            label="Guidance"
            value={params.guidance}
            onChange={(v) => setParams((prev) => ({ ...prev, guidance: v }))}
            min={1}
            max={20}
            step={0.5}
            info="Higher guidance = more aligned to prompt"
          />

          <Slider
            label="Strength"
            value={params.strength}
            onChange={(v) => setParams((prev) => ({ ...prev, strength: v }))}
            min={0.1}
            max={1}
            step={0.1}
            info="Controls how much the image is transformed"
          />

          <div className="flex gap-2">
            <input
              type="number"
              name="seed"
              min={0}
              value={params.seed ?? ""}
              onChange={handleChange}
              placeholder="Seed (optional)"
              className="p-2 border rounded flex-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <Button
              onClick={generateRandomSeed}
              variant="outline"
              className="whitespace-nowrap"
            >
              Random
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            isLoading={loading}
            className="w-full mt-4"
            disabled={!sourceImage || !params.prompt.trim()}
          >
            Transform Image
          </Button>

          {/* Examples */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Example Prompts
            </h3>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <div
                  key={index}
                  className="text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => applyExample(example)}
                >
                  {example}
                </div>
              ))}
            </div>
          </div>
          {error && <div className="text-red-600 mt-2">Error: {error}</div>}
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 w-full h-[500px] flex items-center justify-center">
          {loading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Transforming your image...
              </p>
            </div>
          ) : image ? (
            <img
              src={image}
              alt="Transformed"
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
                Upload an image and enter a prompt to see the transformation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageToImage;
