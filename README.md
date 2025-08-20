# Image Generation with Cloudflare AI

This project provides a TypeScript function to generate images using Cloudflare's AI API (Flux-1-Schnell model) and save them locally.

## Features

- ✅ Convert curl command to axios-based TypeScript function
- ✅ Type-safe with input/output schemas
- ✅ Automatic base64 to image file conversion
- ✅ Error handling and validation
- ✅ Environment variable configuration
- ✅ Automatic filename generation with timestamps

## Setup

1. **Install dependencies** (already done):

   ```bash
   npm install
   ```

2. **Configure environment variables**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Fill in your Cloudflare credentials:
     ```
     CLOUDFLARE_ACCOUNT_ID=your_account_id_here
     CLOUDFLARE_API_TOKEN=your_api_token_here
     ```

## Usage

### Basic Usage

```typescript
import { generateImage } from "./generateImage";

async function example() {
  try {
    const imagePath = await generateImage("cyberpunk cat");
    console.log("Image saved at:", imagePath);
  } catch (error) {
    console.error("Error:", error);
  }
}
```

### Advanced Usage

```typescript
import { generateImage } from "./generateImage";

async function advancedExample() {
  try {
    // With custom steps (1-8, default: 4)
    const imagePath = await generateImage(
      "futuristic cityscape at sunset",
      6 // Higher steps = better quality but slower
    );
    console.log("High-quality image saved at:", imagePath);
  } catch (error) {
    console.error("Error:", error);
  }
}
```

## API Reference

### `generateImage(prompt: string, steps?: number): Promise<string>`

**Parameters:**

- `prompt` (string, required): Text description of the image (1-2048 characters)
- `steps` (number, optional): Number of diffusion steps (1-8, default: 4)

**Returns:**

- Promise that resolves to the file path of the saved image

**Throws:**

- Error if environment variables are missing
- Error if prompt is invalid (empty or too long)
- Error if steps are out of range
- Error if API request fails

## Scripts

- `npm run generate-image` - Run the main generateImage.ts file
- `npm run generate-text` - Run the AI worker (ai-worker.ts)
- `npm run test` - Run the test file with examples
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled JavaScript

## File Structure

```
├── package.json                    # Dependencies and scripts
├── README.md                       # Project documentation
├── tsconfig.json                   # TypeScript configuration
├── images/                         # Generated images saved here
├── interfaces/                     # TypeScript interfaces
│   └── ImageGenerationRequestInterface.ts
├── samples/                        # Sample implementations
│   ├── ai-worker.ts               # AI worker sample
│   └── generateImage.ts           # Main image generation function
└── tests/                         # Test files
    └── test-generate.ts           # Test examples and usage
```

## Generated Images

Images are saved in the `images/` folder with automatically generated filenames:

- Format: `YYYY-MM-DDTHH-MM-SS_prompt-preview.png`
- Example: `2024-08-20T10-30-45_cyberpunk-cat.png`

## Original curl Command

This function replaces the following curl command:

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/black-forest-labs/flux-1-schnell \
  -X POST \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -d '{ "prompt": "cyberpunk cat", "steps": 4 }'
```
