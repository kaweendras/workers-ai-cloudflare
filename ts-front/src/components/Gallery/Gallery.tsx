import React, { useState, useEffect } from "react";
import { getAllImages, deleteImage } from "../../services/apiService";
import Button from "../common/Button";
import { notify } from "../../utils/helpers";
import { FiRefreshCw, FiTrash2 } from "react-icons/fi";

const Gallery: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const imageList = await getAllImages();
      console.log("Fetched images front:", imageList);
      setImages(imageList.data.map(item => item.url)); // Extract URL strings from ImageItem objects
    } catch (error) {
      notify.error("Failed to load images");
      console.error("Error fetching images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
  };

  const handleDeleteImage = async (imageUrl: string) => {
    // Extract the filename from the URL
    const filename = imageUrl.split("/").pop();

    if (!filename) {
      notify.error("Could not determine the filename");
      return;
    }

    setIsDeleting(filename);
    try {
      const success = await deleteImage(filename);
      if (success) {
        notify.success("Image deleted successfully");
        // Refresh the gallery
        fetchImages();
      } else {
        notify.error("Failed to delete image");
      }
    } catch (error) {
      notify.error("An error occurred while deleting the image");
      console.error("Error deleting image:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Generated Images
        </h2>
        <Button
          onClick={fetchImages}
          isLoading={isLoading}
          icon={<FiRefreshCw />}
          variant="outline"
          className="px-4 py-2"
        >
          Refresh Gallery
        </Button>
      </div>

      {/* Image modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full rounded-lg object-contain"
            />
            <button
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 relative group"
            >
              <img
                src={image}
                alt={`Generated image ${index + 1}`}
                className="w-full h-64 object-cover cursor-pointer"
                onClick={() => handleImageClick(image)}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        "Are you sure you want to delete this image?"
                      )
                    ) {
                      handleDeleteImage(image);
                    }
                  }}
                  disabled={isDeleting === image.split("/").pop()}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg"
                  title="Delete image"
                >
                  {isDeleting === image.split("/").pop() ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-b-2 border-white"></div>
                  ) : (
                    <FiTrash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            No images found. Generate some images first!
          </p>
        </div>
      )}
    </div>
  );
};

export default Gallery;
