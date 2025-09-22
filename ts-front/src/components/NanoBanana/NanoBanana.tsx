import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  processWithNanoBanana,
  uploadToImgBB,
} from "../../services/apiService";
import { validateImageFile } from "../../utils/helpers";
import { notify } from "../../utils/helpers";
import Tabs from "../common/Tabs";
import TextArea from "../common/TextArea";
import Button from "../common/Button";
import Card from "../common/Card";
import Input from "../common/Input";
import { FiPenTool } from "react-icons/fi";

const NanoBanana: React.FC = () => {
  // State
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("Upload Image");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        setImageFile(file);
        const imageUrl = URL.createObjectURL(file);
        setImagePreview(imageUrl);
      }
    }
  }

  const handleNanoBanana = async () => {
    if (!prompt.trim()) {
      notify.warning("Please enter a prompt");
      return;
    }

    let finalImageUrl: string | null = null;

    if (activeTab === "Upload Image") {
      if (!imageFile) {
        notify.warning("Please upload an image");
        return;
      }

      setIsLoading(true);
      try {
        // Upload the image to ImgBB first
        finalImageUrl = await uploadToImgBB(imageFile);
        if (!finalImageUrl) {
          notify.error(
            "Failed to upload image. Please try again or use an image URL."
          );
          return;
        }
      } catch (error) {
        notify.error("Error uploading image");
        console.error("Error:", error);
        setIsLoading(false);
        return;
      }
    } else {
      // Image URL tab
      if (!imageUrl.trim()) {
        notify.warning("Please enter an image URL");
        return;
      }
      finalImageUrl = imageUrl.trim();
      console.log("Using image URL:", finalImageUrl);
    }

    // Now process with nanoBanana
    try {
      const response = await processWithNanoBanana({
        prompt,
        imageURL: finalImageUrl,
      });

      if (response.success === "true" && response.data) {
        const resultUrl = response.data.relativePath;
        setResultImage(resultUrl);
        notify.success("Image processed successfully!");
      } else {
        notify.error(response.error || "Failed to process image");
      }
    } catch (error) {
      notify.error("Error processing with nanoBanana");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Card className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          nanoBanana Image Generation
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Upload an image or provide an image URL, and add a prompt to generate
          a new image using nanoBanana.
        </p>

        <TextArea
          label="Prompt"
          placeholder="Describe what you want nanoBanana to do with the image..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className="mt-6">
          <Tabs
            tabs={["Upload Image", "Image URL"]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {activeTab === "Upload Image" ? (
            <div className="mt-4">
              {!imagePreview ? (
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
                <div className="mt-4">
                  <div className="relative rounded-lg overflow-hidden mb-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-64 object-contain"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    variant="outline"
                  >
                    Change Image
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <Input
                label="Image URL"
                placeholder="Paste an image URL here..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          )}

          <Button
            onClick={handleNanoBanana}
            isLoading={isLoading}
            className="w-full mt-6"
            icon={<FiPenTool />}
            variant="primary"
            disabled={
              !prompt.trim() ||
              (activeTab === "Upload Image" ? !imageFile : !imageUrl.trim())
            }
          >
            Generate with nanoBanana
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          Result
        </h2>
        <div className="rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 w-full h-[400px] flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Processing your image...
              </p>
            </div>
          ) : resultImage ? (
            <img
              src={resultImage}
              alt="nanoBanana result"
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
                Add an image and prompt to see nanoBanana results
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NanoBanana;
