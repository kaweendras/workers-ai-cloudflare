import { generateImage } from "./generateImage";

async function testImageGeneration() {
  try {
    console.log("Starting image generation...");

    // Example 1: Basic usage
    const imagePath1 = await generateImage("cyberpunk cat");
    console.log("✅ Image 1 generated:", imagePath1);

    // Example 2: With custom steps
    const imagePath2 = await generateImage("futuristic cityscape at sunset", 6);
    console.log("✅ Image 2 generated:", imagePath2);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the test
testImageGeneration();
