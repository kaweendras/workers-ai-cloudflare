import React, { useState } from "react";
import TextArea from "./common/TextArea";
import Slider from "./common/Slider";
import Button from "./common/Button";
import { generateLucidOriginTTI } from "../services/apiService";

const defaultParams = {
  prompt: "",
  guidance: 4.5,
  seed: undefined,
  height: 1120,
  width: 1120,
  steps: 8,
};

export default function LucidOriginTTITab() {
  const [params, setParams] = useState(defaultParams);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Example prompts
  const examples = [
    "A tranquil forest with mist and sun rays",
    "A futuristic city skyline at night",
    "A dragon flying over snowy mountains",
    "A cozy cabin by a lake in autumn",
    "A surreal landscape with floating islands",
    "A portrait of a cat in renaissance style",
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
        name === "prompt" ? value : value === "" ? undefined : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setImage(null);
    try {
      const data = await generateLucidOriginTTI(params);
      setImage(data.image);
    } catch (err: any) {
      setError(err.message || "Unknown error");
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
            placeholder="A tranquil forest with mist and sun rays..."
            value={params.prompt}
            onChange={handleChange}
            rows={4}
            required
          />
          <Slider
            label="Guidance"
            value={params.guidance}
            onChange={(v) => setParams((prev) => ({ ...prev, guidance: v }))}
            min={0}
            max={10}
            step={0.1}
            info="Higher guidance = more aligned to prompt"
          />
          <Slider
            label="Steps"
            value={params.steps}
            onChange={(v) => setParams((prev) => ({ ...prev, steps: v }))}
            min={1}
            max={40}
            step={1}
            info="Higher steps = better quality but slower"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              name="height"
              min={1}
              max={2500}
              value={params.height}
              onChange={handleChange}
              placeholder="Height"
              className="p-2 border rounded"
            />
            <input
              type="number"
              name="width"
              min={1}
              max={2500}
              value={params.width}
              onChange={handleChange}
              placeholder="Width"
              className="p-2 border rounded"
            />
          </div>
          <input
            type="number"
            name="seed"
            min={0}
            value={params.seed ?? ""}
            onChange={handleChange}
            placeholder="Seed (optional)"
            className="p-2 border rounded mt-2 w-full"
          />
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
}
