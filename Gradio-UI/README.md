# Gradio UI for AI Image Generation

A user-friendly web interface for generating images using AI models via the Cloudflare Workers AI API.

## Features

- **Text-to-Image Generation**: Create images from text descriptions
- **Advanced Inpainting**: Edit specific parts of existing images using masks with full control
- **nanoBanana Image Processing**: Process images with text prompts using the nanoBanana model
- **Image Gallery**: View all generated images in one place
- **Multiple Models**: Support for various AI models
- **Real-time Preview**: Instant image generation and display
- **Easy-to-use Interface**: Drag-and-drop functionality
- **Advanced Controls**: Fine-tune generation with negative prompts, strength, guidance, dimensions, and seeds

## Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file in the Gradio-UI directory with the following content:

```
IMGBB_API_KEY=your_imgbb_api_key_here
```

You can get an ImgBB API key by registering at [imgbb.com](https://imgbb.com/).

Make sure your backend server is running on `http://localhost:4001` with the following endpoints:

- `POST /api/v1/image/generate` - For text-to-image generation
- `POST /api/v1/generative/image/inpaint` - For image inpainting
- `GET /api/v1/images` - For fetching all generated images
- `POST /api/v1/generative/image/nanoBanana` - For nanoBanana image processing

### 3. Run the Gradio Interface

```bash
python app.py
```

The interface will be available at `http://localhost:7860`

## Usage

### Text-to-Image

1. Enter a descriptive prompt
2. Adjust the steps (1-8) for quality vs speed
3. Select an AI model
4. Click "Generate Image"

### Inpainting

1. Upload an image
2. Draw a mask on areas you want to edit (white areas will be inpainted)
3. Enter a prompt describing what should appear in the masked area
4. Adjust parameters as needed
5. Click "Inpaint Image"

### Image Gallery

1. Navigate to the "Image Gallery" tab
2. View all generated images
3. Click "Refresh Gallery" to update the gallery with newly generated images

### nanoBanana Image Processing

1. Navigate to the "nanoBanana" tab
2. Enter a prompt describing what you want to do with the image
3. Either:
   - Upload an image directly
   - OR provide an image URL
4. Click "Generate with nanoBanana"

The uploaded images will be automatically sent to ImgBB for hosting before processing. 4. **NEW**: Optionally add a negative prompt to avoid unwanted elements 5. **NEW**: Adjust advanced parameters:

- **Steps**: Number of diffusion steps (1-20, default 10)
- **Strength**: How much to transform the masked area (0.1-1.0, default 0.8)
- **Guidance**: How closely to follow the prompt (1.0-15.0, default 7.5)
- **Width/Height**: Output dimensions (256-2048, default 512x512)
- **Seed**: For reproducible results (optional)

6. Select an inpainting model
7. Click "Inpaint Image"

## Models Supported

### Text-to-Image Models

- `@cf/black-forest-labs/flux-1-schnell`
- `@cf/stabilityai/stable-diffusion-xl-base-1.0`
- `@cf/runwayml/stable-diffusion-v1-5`

### Inpainting Models

- `@cf/runwayml/stable-diffusion-inpainting` (default)
- `@cf/runwayml/stable-diffusion-v1-5-inpainting`
- `@cf/stabilityai/stable-diffusion-xl-inpainting-1.0`

## New Inpainting Schema

The inpainting functionality now uses an updated schema with the following features:

### Required Fields

- `prompt`: Description of what to generate in masked areas

### Optional Fields

- `negative_prompt`: What to avoid in the generation
- `height`, `width`: Output dimensions (256-2048 pixels)
- `num_steps`: Diffusion steps (max 20)
- `strength`: Transformation intensity (0-1)
- `guidance`: Prompt adherence (higher = more faithful to prompt)
- `seed`: For reproducible results
- `image_b64`: Base64 encoded input image
- `mask`: Array of mask pixel values (0-255)

## Environment Variables

The backend should have these environment variables configured:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `HOST`
- `PORT`

## Dependencies

- **gradio**: Web interface framework
- **requests**: HTTP client for API calls
- **Pillow**: Image processing
- **numpy**: Array operations for mask processing
- **python-dotenv**: Environment variable management
