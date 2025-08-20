"""
Demo script to test the Gradio UI functionality
"""

import requests
import json
import base64
from io import BytesIO
from PIL import Image


def test_text_to_image_api():
    """Test the text-to-image API endpoint"""
    url = "http://localhost:4000/api/v1/image/generate"

    payload = {
        "prompt": "A cute cyberpunk cat with neon accessories",
        "steps": 4,
        "model": "@cf/black-forest-labs/flux-1-schnell"
    }

    try:
        print("Testing text-to-image API...")
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()

        result = response.json()
        print(f"API Response: {json.dumps(result, indent=2)}")

        if result.get('success') == 'true' and 'data' in result:
            print("✅ Text-to-image API is working!")
            return True
        else:
            print("❌ Text-to-image API returned an error")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server at http://localhost:4000")
        return False
    except Exception as e:
        print(f"❌ Error testing text-to-image API: {e}")
        return False


def create_test_mask():
    """Create a simple test mask for inpainting"""
    # Create a white square on black background (mask format)
    img = Image.new('RGB', (512, 512), 'black')
    # Create a white rectangle in the center (this will be the inpainting area)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    draw.rectangle([200, 200, 312, 312], fill='white')

    return img


def image_to_base64(img):
    """Convert PIL Image to base64 string"""
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return img_str


def test_inpainting_api():
    """Test the inpainting API endpoint (requires test images)"""
    url = "http://localhost:4000/api/v1/image/inpaint"

    # Create test images
    test_image = Image.new('RGB', (512, 512), 'blue')  # Simple blue image
    test_mask = create_test_mask()  # White square mask

    # Convert to base64
    image_b64 = image_to_base64(test_image)
    mask_b64 = image_to_base64(test_mask)

    payload = {
        "image": image_b64,
        "mask": mask_b64,
        "prompt": "a red flower",
        "steps": 4,
        "model": "@cf/runwayml/stable-diffusion-inpainting"
    }

    try:
        print("Testing inpainting API...")
        response = requests.post(url, json=payload, timeout=120)
        response.raise_for_status()

        result = response.json()
        print(f"Inpainting API Response: {json.dumps(result, indent=2)}")

        if result.get('success') == 'true' and 'data' in result:
            print("✅ Inpainting API is working!")
            return True
        else:
            print("❌ Inpainting API returned an error")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server at http://localhost:4000")
        return False
    except Exception as e:
        print(f"❌ Error testing inpainting API: {e}")
        return False


def main():
    """Run all API tests"""
    print("🧪 Testing AI Image Generation APIs\n")

    # Test backend connectivity
    try:
        response = requests.get("http://localhost:4000/", timeout=5)
        print("✅ Backend server is running")
    except:
        print("❌ Backend server is not running at http://localhost:4000")
        print("   Please start your backend server first:")
        print("   cd .. && npm run dev")
        return

    print("\n" + "="*50)

    # Test text-to-image
    text_to_image_ok = test_text_to_image_api()

    print("\n" + "="*50)

    # Test inpainting
    inpainting_ok = test_inpainting_api()

    print("\n" + "="*50)
    print("\n📊 Test Results:")
    print(f"Text-to-Image: {'✅ PASS' if text_to_image_ok else '❌ FAIL'}")
    print(f"Inpainting: {'✅ PASS' if inpainting_ok else '❌ FAIL'}")

    if text_to_image_ok and inpainting_ok:
        print("\n🎉 All APIs are working! You can now run the Gradio UI:")
        print("   python app.py")
    else:
        print("\n⚠️  Some APIs are not working. Please check your backend server and Cloudflare credentials.")


if __name__ == "__main__":
    main()
