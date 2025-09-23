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
import AdminDashboard from "./components/AdminDashboard";
import Login from "./components/Login";
import AuthGuard from "./components/AuthGuard";
import {
  logout,
  getUserFromToken,
  isAdmin as checkIsAdmin,
} from "./utils/auth";

function App() {
  const [activeTab, setActiveTab] = useState("🖼️ Image Gallery");
  const [authKey, setAuthKey] = useState(0); // Force re-render after login/logout

  // Get user info for display
  const userInfo = getUserFromToken();
  const userName = userInfo?.name || userInfo?.email || "User";
  const userRole = userInfo?.role || "";
  const isAdmin = checkIsAdmin(); // Use the auth utility function

  // Debug logging
  console.log("User Role Debug:", { userRole, isAdmin, userInfo });

  const baseTabs = [
    "🖼️ Image Gallery",
    "✨ TTI FLUX",
    "🌄 Lucid Origin TTI",
    "🚀 SDXL",
    "🔄 Image to Image",
  ];

  const adminTabs = ["🎭 Inpainting", "🍌 nanoBanana", "🛠️ Admin Dashboard"];

  const tabs = isAdmin ? [...baseTabs, ...adminTabs] : baseTabs;

  const handleLoginSuccess = () => {
    setAuthKey((prev) => prev + 1); // Force re-render
  };

  const handleLogout = () => {
    logout();
    setAuthKey((prev) => prev + 1); // Force re-render
  };

  const renderContent = () => {
    // Double-check admin status for sensitive routes
    const isCurrentlyAdmin = checkIsAdmin();

    switch (activeTab) {
      case "🖼️ Image Gallery":
        return <Gallery />;
      case "✨ TTI FLUX":
        return <TextToImage />;
      case "🎭 Inpainting":
        if (!isCurrentlyAdmin) {
          console.warn("Non-admin user attempted to access Inpainting");
          setActiveTab("🖼️ Image Gallery");
          return <Gallery />;
        }
        return <Inpainting />;
      case "🍌 nanoBanana":
        if (!isCurrentlyAdmin) {
          console.warn("Non-admin user attempted to access nanoBanana");
          setActiveTab("🖼️ Image Gallery");
          return <Gallery />;
        }
        return <NanoBanana />;
      case "🛠️ Admin Dashboard":
        if (!isCurrentlyAdmin) {
          console.warn("Non-admin user attempted to access Admin Dashboard");
          setActiveTab("🖼️ Image Gallery");
          return <Gallery />;
        }
        return <AdminDashboard />;
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
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
                <img
                  src="/assets/logo.png"
                  alt="Bamla AI Studio Logo"
                  className="w-7 h-7 mr-3"
                />
                Bamla AI Studio
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Generate images from text or edit existing images
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 sm:space-x-4 ml-auto">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Welcome, {userName}
                </p>
                {userRole && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {userRole}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:hidden">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {userName}
                </p>
                {userRole && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {userRole}
                  </p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-2 py-1.5 sm:px-3 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <svg
                  className="w-4 h-4 sm:mr-1"
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
                <span className="hidden sm:inline">Logout</span>
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
            Built with ❤️ by{" "}
            <a
              href="https://github.com/kaweendras"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              Kaweendra
            </a>{" "}
            |{" "}
            <a
              href="https://github.com/kaweendras/workers-ai-cloudflare"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              View on GitHub
            </a>
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
