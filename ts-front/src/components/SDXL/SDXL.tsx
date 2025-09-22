import React, { useState } from "react";
import TextArea from "../common/TextArea";
import Slider from "../common/Slider";
import Button from "../common/Button";
import { notify } from "../../utils/helpers";
import { sdxlAPI } from "../../services/apiService";

const SDXL: React.FC = () => {
  const [params, setParams] = useState({
    prompt: "",
    negative_prompt: "",
    height: 1024,
    width: 1024,
    num_steps: 20,
    strength: 1,
    guidance: 7.5,
    seed: undefined as number | undefined,
  });
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Example prompts
  const examples = [
    "A majestic dragon soaring through cloudy skies",
    "A cyberpunk cityscape with neon lights at night",
    "A peaceful zen garden with cherry blossoms",
    "A vintage steampunk airship floating above clouds",
    "A mystical forest with glowing magical creatures",
    "A futuristic space station orbiting Earth",
  ];

  const applyExample = (example: string) => {
    setParams((prev) => ({ ...prev, prompt: example }));
  };

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

    setLoading(true);
    setError(null);
    setImage(null);

    try {
      const data = await sdxlAPI(params);

      if (data.success && data.success === "true" && data.data) {
        // The backend returns base64 image data, so we need to format it as a data URL
        const imageDataUrl = data.data.url;
        setImage(imageDataUrl);
        notify.success("Image generated successfully!");
      } else {
        throw new Error("Failed to generate image");
      }
    } catch (err:any) {
      setError(err.message || "Unknown error");
      notify.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="sticky top-4">
          <TextArea
            label="Prompt"
            name="prompt"
            placeholder="Describe the image you want to generate..."
            value={params.prompt}
            onChange={handleChange}
            rows={4}
            required
          />

          <TextArea
            label="Negative Prompt"
            name="negative_prompt"
            placeholder="Describe what you want to avoid in the image..."
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
              max={2048}
              step={64}
              info={`${params.width}px`}
            />
            <Slider
              label="Height"
              value={params.height}
              onChange={(v) => setParams((prev) => ({ ...prev, height: v }))}
              min={256}
              max={2048}
              step={64}
              info={`${params.height}px`}
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
              className="p-2 border rounded flex-1"
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
          >
            Generate Image
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
                Generating your image...
              </p>
            </div>
          ) : image ? (
            <img
              src={image}
              alt="Generated"
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
                Enter a prompt and click Generate to create an image
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SDXL;
