import { toast } from "react-toastify";

// Display toast messages
export const notify = {
  success: (message: string) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },
  error: (message: string) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 5000,
    });
  },
  info: (message: string) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },
  warning: (message: string) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 4000,
    });
  },
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Validate image file
export const validateImageFile = (file: File): boolean => {
  // Check file type
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(file.type)) {
    notify.error(
      "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image."
    );
    return false;
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    notify.error(
      `File size exceeds 10MB. Your file is ${formatFileSize(file.size)}`
    );
    return false;
  }

  return true;
};

// Generate a random seed
export const generateRandomSeed = (): number => {
  return Math.floor(Math.random() * 1000000);
};

// Debounce function for inputs
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number
): ((...args: Parameters<F>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};
