# Inpaint API - Updated Schema

This document describes the updated inpaint API that follows the new schema specification.

## API Endpoint

```
POST /api/generative/image/inpaint
```

## Request Schema

The inpaint API now accepts the following request body:

```json
{
  "prompt": "string (required)",
  "negative_prompt": "string (optional)",
  "height": "integer (optional, 256-2048)",
  "width": "integer (optional, 256-2048)",
  "image": "array of integers (optional, values 0-255)",
  "image_b64": "string (optional, base64 encoded image)",
  "mask": "array of integers (optional, values 0-255)",
  "num_steps": "integer (optional, max 20, default 20)",
  "strength": "number (optional, 0-1, default 1)",
  "guidance": "number (optional, default 7.5)",
  "seed": "integer (optional)",
  "model": "string (optional, model identifier)"
}
```

### Field Descriptions

- **prompt** (required): A text description of the image you want to generate
- **negative_prompt** (optional): Text describing elements to avoid in the generated image
- **height** (optional): The height of the generated image in pixels (256-2048)
- **width** (optional): The width of the generated image in pixels (256-2048)
- **image** (optional): An array of integers representing image data (0-255 values)
- **image_b64** (optional): A base64-encoded string of the input image
- **mask** (optional): An array of integers representing mask image data (0-255 values)
- **num_steps** (optional): The number of diffusion steps (max 20, default 20)
- **strength** (optional): Controls transformation strength (0-1, default 1)
- **guidance** (optional): Controls prompt adherence (default 7.5)
- **seed** (optional): Random seed for reproducibility

## Response Schema

The API returns binary PNG image data:

```
Content-Type: image/png
Binary image data
```

However, the current implementation wraps this in a JSON response:

```json
{
  "success": "true",
  "message": "Image inpainted successfully",
  "data": {
    "absolutePath": "/path/to/image.png",
    "relativePath": "http://localhost:4000/images/image.png"
  }
}
```

## Example Request

```javascript
const response = await fetch("/api/generative/image/inpaint", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "a serene lake surrounded by mountains",
    negative_prompt: "people, buildings, cars",
    height: 768,
    width: 768,
    num_steps: 15,
    strength: 0.9,
    guidance: 8.0,
    seed: 42,
    image_b64: "base64_encoded_image_data",
    mask: [
      /* array of mask pixel values 0-255 */
    ],
    model: "@cf/runwayml/stable-diffusion-inpainting",
  }),
});
```

## Migration from Old Schema

If you're migrating from the old schema, here are the key changes:

### Old Schema

```json
{
  "image": "base64_string",
  "mask": "base64_string",
  "prompt": "string",
  "steps": "integer"
}
```

### New Schema

```json
{
  "prompt": "string",
  "image_b64": "base64_string",
  "mask": "array_of_integers",
  "num_steps": "integer"
}
```

### Changes:

1. `image` → `image_b64` for base64 image data
2. `mask` now accepts array of integers (0-255) instead of base64
3. `steps` → `num_steps`
4. Added many new optional parameters for fine control
5. `prompt` is now the only required field

## Testing

Run the inpaint tests:

```bash
npm run test-inpaint
```

This will validate the schema structure and demonstrate usage patterns.
