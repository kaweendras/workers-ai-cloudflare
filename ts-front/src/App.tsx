import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Tabs from "./components/common/Tabs";
import TextToImage from "./components/TextToImage/TextToImage";
import Inpainting from "./components/Inpainting/Inpainting";
import NanoBanana from "./components/NanoBanana/NanoBanana";
import Gallery from "./components/Gallery/Gallery";
import LucidOriginTTITab from "./components/LucidOriginTTITab";
import SDXL from "./components/SDXL/SDXL";
import ImageToImage from "./components/ImageToImage/ImageToImage";
import Login from "./components/Login";
import AuthGuard from "./components/AuthGuard";
import { logout, getUserFromToken } from "./utils/auth";

function App() {
  const [activeTab, setActiveTab] = useState("🖼️ Image Gallery");
  const [authKey, setAuthKey] = useState(0); // Force re-render after login/logout

  const tabs = [
    "🖼️ Image Gallery",
    "✨ TTI FLUX",
    "🌄 Lucid Origin TTI",
    "🚀 SDXL",
    "🔄 Image to Image",
    "🎭 Inpainting",
    "🍌 nanoBanana",
  ];

  const handleLoginSuccess = () => {
    setAuthKey(prev => prev + 1); // Force re-render
  };

  const handleLogout = () => {
    logout();
    setAuthKey(prev => prev + 1); // Force re-render
  };

  // Get user info for display
  const userInfo = getUserFromToken();
  const userName = userInfo?.name || userInfo?.email || 'User';
  const userRole = userInfo?.role || '';

  const renderContent = () => {
    switch (activeTab) {
      case "🖼️ Image Gallery":
        return <Gallery />;
      case "✨ TTI FLUX":
        return <TextToImage />;
      case "🎭 Inpainting":
        return <Inpainting />;
      case "🍌 nanoBanana":
        return <NanoBanana />;
      case "🌄 Lucid Origin TTI":
        return <LucidOriginTTITab />;
      case "🚀 SDXL":
        return <SDXL />;
      case "🔄 Image to Image":
        return <ImageToImage />;
      default:
        return <Gallery />;
    }
  };

  const AuthenticatedApp = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                🎨 AI Image Generation Studio
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Generate images from text or edit existing images with inpainting
                using Cloudflare Workers AI
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Welcome, {userName}
                </p>
                {userRole && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {userRole}
                  </p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
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
            <code>/api/v1/generative/image/nanoBanana</code>,{" "}
            <code>/api/v1/generative/image/sdxl</code>, and{" "}
            <code>/api/v1/generative/image/imageToImage</code>. For nanoBanana,
            make sure the IMGBB_API_KEY is set in your .env file.
          </p>
        </div>
      </footer>

      <ToastContainer position="top-right" />
    </div>
  );

  return (
    <AuthGuard
      key={authKey}
      fallback={<Login onLoginSuccess={handleLoginSuccess} />}
    >
      <AuthenticatedApp />
    </AuthGuard>
  );
}

export default App;
