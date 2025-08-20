# Gradio UI for AI Image Generation

A user-friendly web interface for generating images using AI models via the Cloudflare Workers AI API.

## Features

- **Text-to-Image Generation**: Create images from text descriptions
- **Inpainting**: Edit specific parts of existing images using masks
- **Multiple Models**: Support for various AI models
- **Real-time Preview**: Instant image generation and display
- **Easy-to-use Interface**: Drag-and-drop functionality

## Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Make sure your backend server is running on `http://localhost:4000` with the following endpoints:

- `POST /api/v1/image/generate` - For text-to-image generation
- `POST /api/v1/image/inpaint` - For image inpainting

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
4. Select an inpainting model
5. Click "Inpaint"

## Models Supported

### Text-to-Image Models

- `@cf/black-forest-labs/flux-1-schnell`
- `@cf/stabilityai/stable-diffusion-xl-base-1.0`
- `@cf/runwayml/stable-diffusion-v1-5`

### Inpainting Models

- `@cf/runwayml/stable-diffusion-inpainting`
- `@cf/stabilityai/stable-diffusion-xl-inpainting-1.0`

## Environment Variables

The backend should have these environment variables configured:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `HOST`
- `PORT`
