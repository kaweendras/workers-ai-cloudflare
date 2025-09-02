import React, { useState } from "react";
import { generateImage } from "../../services/apiService";
import TextArea from "../common/TextArea";
import Slider from "../common/Slider";
import Button from "../common/Button";
import Dropdown from "../common/Dropdown";
import { notify } from "../../utils/helpers";
import type { TextToImageModel } from "../../types";
import { FiZap } from "react-icons/fi";

const TextToImage: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [steps, setSteps] = useState(4);
  const [model, setModel] = useState<TextToImageModel>(
    "@cf/black-forest-labs/flux-1-schnell"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Available models
  const models: TextToImageModel[] = [
    "@cf/black-forest-labs/flux-1-schnell",
    "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    "@cf/runwayml/stable-diffusion-v1-5",
  ];

  // Example prompts
  const examples = [
    "A futuristic cityscape at sunset with flying cars",
    "A magical forest with glowing mushrooms and fairy lights",
    "A vintage coffee shop with warm lighting, cozy atmosphere",
    "An abstract painting with vibrant colors and geometric shapes",
    "A cyberpunk cat with neon accessories in a dark alley",
    "A serene mountain lake with perfect reflections at dawn",
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      notify.warning("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const response = await generateImage({
        prompt,
        steps,
        model,
      });

      if (response.success === "true" && response.data) {
        const imageUrl = response.data.relativePath;
        setGeneratedImage(imageUrl);
        notify.success("Image generated successfully!");
      } else {
        notify.error(response.error || "Failed to generate image");
      }
    } catch (error) {
      notify.error("Error generating image");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyExample = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="sticky top-4">
          <TextArea
            label="Prompt"
            placeholder="A futuristic cityscape at sunset with flying cars..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />

          <Slider
            label="Steps"
            value={steps}
            onChange={setSteps}
            min={1}
            max={8}
            step={1}
            info="Higher steps = better quality but slower generation"
          />

          <Dropdown
            label="AI Model"
            options={models}
            value={model}
            onChange={(value) => setModel(value as TextToImageModel)}
            info="Choose the AI model for generation"
          />

          <Button
            onClick={handleGenerate}
            isLoading={isLoading}
            className="w-full mt-4"
            icon={<FiZap />}
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
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 w-full h-[500px] flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Generating your image...
              </p>
            </div>
          ) : generatedImage ? (
            <img
              src={generatedImage}
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

export default TextToImage;
