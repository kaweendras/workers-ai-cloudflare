import { generateImage } from "../samples/generateImage";

async function testImageGeneration() {
  try {
    console.log("Starting image generation...");

    // Example 1: Basic usage
    const imagePath1 = await generateImage("cyberpunk dog");
    console.log("✅ Image 1 generated:", imagePath1);

    // Example 2: With custom steps
    const imagePath2 = await generateImage("futuristic cityscape at Dawn", 6);
    console.log("✅ Image 2 generated:", imagePath2);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the test
testImageGeneration();
