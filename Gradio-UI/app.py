import gradio as gr
import requests
import base64
from PIL import Image
import io
import os
import numpy as np
from typing import Optional, Tuple
import json


class ImageGenerationUI:
    def __init__(self, api_base_url: str = "http://localhost:4000/api/v1"):
        self.api_base_url = api_base_url

    def text_to_image(self, prompt: str, steps: int, model: str) -> Optional[Image.Image]:
        """Generate image from text prompt"""
        if not prompt.strip():
            gr.Warning("Please enter a prompt")
            return None

        try:
            print(
                f"Generating image with prompt: '{prompt}', steps: {steps}, model: {model}")

            response = requests.post(
                f"{self.api_base_url}/image/generate",
                json={
                    "prompt": prompt,
                    "steps": steps,
                    "model": model
                },
                timeout=120
            )
            response.raise_for_status()

            result = response.json()
            print(f"API Response: {result}")

            # Handle the response based on your API structure
            if result.get('success') == 'true' and 'data' in result:
                data = result['data']
                if 'relativePath' in data:
                    # Convert relative path to full URL
                    image_url = data['relativePath']
                    print(f"Fetching image from: {image_url}")

                    img_response = requests.get(image_url)
                    img_response.raise_for_status()

                    return Image.open(io.BytesIO(img_response.content))
                elif 'absolutePath' in data:
                    # If absolute path is returned, try to read the file
                    abs_path = data['absolutePath']
                    if os.path.exists(abs_path):
                        return Image.open(abs_path)
                    else:
                        gr.Warning(f"Image file not found at: {abs_path}")
                        return None
                else:
                    gr.Warning("No image path found in API response")
                    return None
            else:
                error_msg = result.get('error', 'Unknown error occurred')
                gr.Warning(f"API Error: {error_msg}")
                return None

        except requests.exceptions.Timeout:
            gr.Warning(
                "Request timeout. The image generation is taking too long.")
            return None
        except requests.exceptions.RequestException as e:
            gr.Warning(f"Network error: {str(e)}")
            return None
        except Exception as e:
            gr.Warning(f"Error generating image: {str(e)}")
            print(f"Full error: {e}")
            return None

    def inpaint_image(self, image: Optional[Image.Image], mask: Optional[Image.Image],
                      prompt: str, negative_prompt: str, steps: int, strength: float,
                      guidance: float, width: int, height: int, seed: Optional[int], model: str) -> Optional[Image.Image]:
        """Inpaint image with mask using the new schema"""
        if image is None:
            gr.Warning("Please upload an image")
            return None

        if mask is None:
            gr.Warning("Please draw a mask on the image")
            return None

        if not prompt.strip():
            gr.Warning("Please enter an inpainting prompt")
            return None

        try:
            print(
                f"Inpainting with prompt: '{prompt}', steps: {steps}, model: {model}")
            print(
                f"Parameters - negative_prompt: '{negative_prompt}', strength: {strength}, guidance: {guidance}")
            print(
                f"Dimensions - width: {width}, height: {height}, seed: {seed}")
            print(f"Mask type: {type(mask)}")
            if isinstance(mask, dict):
                print(f"Mask keys: {mask.keys()}")

            # Convert images to base64
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='PNG')
            img_b64 = base64.b64encode(img_buffer.getvalue()).decode()

            # Handle mask data - ImageEditor returns dict with 'background' and 'layers'
            mask_image = None
            if isinstance(mask, dict):
                # If mask is a dict (from ImageEditor), extract the composite image
                if 'composite' in mask and mask['composite'] is not None:
                    mask_image = mask['composite']
                elif 'layers' in mask and mask['layers']:
                    # Get the first layer as mask
                    mask_image = mask['layers'][0]
                elif 'background' in mask and mask['background'] is not None:
                    mask_image = mask['background']
                else:
                    raise ValueError(
                        "No valid mask data found in ImageEditor output")
            elif hasattr(mask, 'convert'):
                # If mask is already a PIL Image
                mask_image = mask
            else:
                raise ValueError(f"Unsupported mask type: {type(mask)}")

            # Convert mask to numpy array and then to list of integers (0-255)
            if mask_image is None:
                raise ValueError("Could not extract mask image from editor")

            # Convert mask to grayscale and resize to reduce payload size
            # Resize to smaller dimensions to reduce array size
            target_size = (64, 64)  # Much smaller to reduce payload
            mask_resized = mask_image.convert('L').resize(target_size)
            mask_array = np.array(mask_resized)
            mask_list = mask_array.flatten().tolist()

            print(f"Image b64 length: {len(img_b64)}")
            print(
                f"Mask array length: {len(mask_list)} (resized to {target_size})")

            # Prepare request data according to new schema
            request_data = {
                "prompt": prompt,
                "image_b64": img_b64,
                "mask": mask_list,  # Use small array instead of base64
                "num_steps": steps,
                "strength": strength,
                "guidance": guidance,
                "width": width,
                "height": height,
                "model": model
            }

            # Add optional fields
            if negative_prompt.strip():
                request_data["negative_prompt"] = negative_prompt

            if seed is not None:
                request_data["seed"] = seed

            response = requests.post(
                f"{self.api_base_url}/generative/image/inpaint",
                json=request_data,
                timeout=120
            )
            response.raise_for_status()

            result = response.json()

            if result.get('success') == 'true' and 'data' in result:
                data = result['data']
                if 'relativePath' in data:
                    image_url = data['relativePath']
                    img_response = requests.get(image_url)
                    img_response.raise_for_status()
                    return Image.open(io.BytesIO(img_response.content))
                elif 'absolutePath' in data:
                    abs_path = data['absolutePath']
                    if os.path.exists(abs_path):
                        return Image.open(abs_path)
                    else:
                        gr.Warning(f"Image file not found at: {abs_path}")
                        return None
                else:
                    gr.Warning(
                        "No image path found in inpainting API response")
                    return None
            else:
                error_msg = result.get(
                    'error', 'Unknown inpainting error occurred')
                gr.Warning(f"Inpainting API Error: {error_msg}")
                return None

        except requests.exceptions.Timeout:
            gr.Warning("Request timeout. The inpainting is taking too long.")
            return None
        except requests.exceptions.RequestException as e:
            gr.Warning(f"Network error: {str(e)}")
            return None
        except Exception as e:
            gr.Warning(f"Error inpainting image: {str(e)}")
            print(f"Full error: {e}")
            return None


def create_ui():
    ui = ImageGenerationUI()

    # Available models
    text_to_image_models = [
        "@cf/black-forest-labs/flux-1-schnell",
        "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        "@cf/runwayml/stable-diffusion-v1-5"
    ]

    inpaint_models = [
        "@cf/runwayml/stable-diffusion-v1-5-inpainting",
        "@cf/runwayml/stable-diffusion-inpainting",
        "@cf/stabilityai/stable-diffusion-xl-inpainting-1.0"
    ]

    # Custom CSS for better styling
    css = """
    .gradio-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .generate-btn {
        background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        font-weight: bold;
    }
    .inpaint-btn {
        background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
        border: none;
        color: white;
        font-weight: bold;
    }
    """

    with gr.Blocks(title="AI Image Generator", css=css) as demo:
        gr.Markdown(
            """
            # 🎨 AI Image Generation Studio
            Generate images from text or edit existing images with inpainting using Cloudflare Workers AI
            """
        )

        with gr.Tabs():
            # Text-to-Image Tab
            with gr.TabItem("✨ Text to Image"):
                with gr.Row():
                    with gr.Column(scale=1):
                        txt_prompt = gr.Textbox(
                            label="Prompt",
                            placeholder="A futuristic cityscape at sunset with flying cars...",
                            lines=4,
                            max_lines=8
                        )

                        with gr.Row():
                            txt_steps = gr.Slider(
                                minimum=1, maximum=8, value=4, step=1,
                                label="Steps",
                                info="Higher steps = better quality but slower generation"
                            )

                        txt_model = gr.Dropdown(
                            choices=text_to_image_models,
                            value=text_to_image_models[0],
                            label="AI Model",
                            info="Choose the AI model for generation"
                        )

                        txt_generate_btn = gr.Button(
                            "🚀 Generate Image",
                            variant="primary",
                            elem_classes=["generate-btn"]
                        )

                    with gr.Column(scale=2):
                        txt_output = gr.Image(
                            label="Generated Image",
                            type="pil",
                            interactive=False,
                            height=500
                        )

                txt_generate_btn.click(
                    fn=ui.text_to_image,
                    inputs=[txt_prompt, txt_steps, txt_model],
                    outputs=txt_output,
                    show_progress="full"
                )

            # Inpainting Tab
            with gr.TabItem("🎭 Inpainting"):
                gr.Markdown(
                    "Upload an image and draw a mask to edit specific areas")

                with gr.Row():
                    with gr.Column(scale=1):
                        inp_image = gr.Image(
                            label="Upload Image",
                            type="pil",
                            sources=["upload", "clipboard"],
                            height=300
                        )

                        inp_mask = gr.ImageEditor(
                            label="Draw Mask",
                            type="pil",
                            brush=gr.Brush(
                                colors=["white"], color_mode="fixed"),
                            height=300,
                            sources=[]
                        )

                    with gr.Column(scale=1):
                        inp_prompt = gr.Textbox(
                            label="Inpainting Prompt",
                            placeholder="Describe what should appear in the masked (white) areas...",
                            lines=3
                        )

                        inp_negative_prompt = gr.Textbox(
                            label="Negative Prompt (Optional)",
                            placeholder="What you don't want to see (e.g., blurry, low quality, artifacts)",
                            lines=2
                        )

                        with gr.Row():
                            inp_steps = gr.Slider(
                                minimum=1, maximum=20, value=10, step=1,
                                label="Steps",
                                info="Quality vs speed trade-off (max 20)"
                            )

                            inp_strength = gr.Slider(
                                minimum=0.1, maximum=1.0, value=0.8, step=0.1,
                                label="Strength",
                                info="How much to transform (0.1-1.0)"
                            )

                        with gr.Row():
                            inp_guidance = gr.Slider(
                                minimum=1.0, maximum=15.0, value=7.5, step=0.5,
                                label="Guidance",
                                info="How closely to follow prompt"
                            )

                            inp_seed = gr.Number(
                                label="Seed (Optional)",
                                value=None,
                                precision=0,
                                info="For reproducible results"
                            )

                        with gr.Row():
                            inp_width = gr.Slider(
                                minimum=256, maximum=2048, value=512, step=64,
                                label="Width",
                                info="Output image width (256-2048)"
                            )

                            inp_height = gr.Slider(
                                minimum=256, maximum=2048, value=512, step=64,
                                label="Height",
                                info="Output image height (256-2048)"
                            )

                        inp_model = gr.Dropdown(
                            choices=inpaint_models,
                            value=inpaint_models[0] if inpaint_models else "",
                            label="Inpainting Model"
                        )

                        inp_generate_btn = gr.Button(
                            "🎨 Inpaint Image",
                            variant="primary",
                            elem_classes=["inpaint-btn"]
                        )

                    with gr.Column(scale=2):
                        inp_output = gr.Image(
                            label="Inpainted Result",
                            type="pil",
                            interactive=False,
                            height=500
                        )

                # Auto-populate mask editor when image is uploaded
                inp_image.change(
                    lambda img: img if img else None,
                    inputs=[inp_image],
                    outputs=[inp_mask]
                )

                inp_generate_btn.click(
                    fn=ui.inpaint_image,
                    inputs=[inp_image, inp_mask, inp_prompt, inp_negative_prompt,
                            inp_steps, inp_strength, inp_guidance, inp_width,
                            inp_height, inp_seed, inp_model],
                    outputs=inp_output,
                    show_progress="full"
                )

        # Examples section
        with gr.Accordion("💡 Example Prompts", open=False):
            gr.Examples(
                examples=[
                    ["A futuristic cityscape at sunset with flying cars", 6],
                    ["A magical forest with glowing mushrooms and fairy lights", 4],
                    ["A vintage coffee shop with warm lighting, cozy atmosphere", 5],
                    ["An abstract painting with vibrant colors and geometric shapes", 4],
                    ["A cyberpunk cat with neon accessories in a dark alley", 6],
                    ["A serene mountain lake with perfect reflections at dawn", 5]
                ],
                inputs=[txt_prompt, txt_steps],
                label="Click any example to try it"
            )

        # Footer
        gr.Markdown(
            """
            ---
            **Note**: Make sure your backend server is running on `http://localhost:4000` 
            with the required API endpoints for image generation.
            """
        )

    return demo


if __name__ == "__main__":
    print("🚀 Starting AI Image Generation Studio...")
    print("📱 Interface will be available at: http://localhost:7860")
    print("🔧 Make sure your backend is running at: http://localhost:4000")

    demo = create_ui()
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        debug=True,
        show_error=True
    )
