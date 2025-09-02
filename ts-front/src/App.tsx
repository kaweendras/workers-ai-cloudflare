import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Tabs from "./components/common/Tabs";
import TextToImage from "./components/TextToImage/TextToImage";
import Inpainting from "./components/Inpainting/Inpainting";
import NanoBanana from "./components/NanoBanana/NanoBanana";
import Gallery from "./components/Gallery/Gallery";

function App() {
  const [activeTab, setActiveTab] = useState("🖼️ Image Gallery");

  const tabs = [
    "🖼️ Image Gallery",
    "✨ Text to Image",
    "🎭 Inpainting",
    "🍌 nanoBanana",
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "🖼️ Image Gallery":
        return <Gallery />;
      case "✨ Text to Image":
        return <TextToImage />;
      case "🎭 Inpainting":
        return <Inpainting />;
      case "🍌 nanoBanana":
        return <NanoBanana />;
      default:
        return <Gallery />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            🎨 AI Image Generation Studio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate images from text or edit existing images with inpainting
            using Cloudflare Workers AI
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="mt-6">{renderContent()}</div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            <strong>Note</strong>: Make sure your backend server is running on{" "}
            <code>http://localhost:4001</code>
            with the required API endpoints: <code>/api/v1/image/generate</code>
            , <code>/api/v1/generative/image/inpaint</code>,
            <code>/api/v1/images</code>, and{" "}
            <code>/api/v1/generative/image/nanoBanana</code>. For nanoBanana,
            make sure the IMGBB_API_KEY is set in your .env file.
          </p>
        </div>
      </footer>

      <ToastContainer position="top-right" />
    </div>
  );
}

export default App;
