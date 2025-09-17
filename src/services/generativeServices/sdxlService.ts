import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { SdxlRequestInterface, SdxlResponseInterface } from '../../interfaces/sdxlInterface';

export const sdxlService = async (
  requestData: SdxlRequestInterface
): Promise<SdxlResponseInterface> => {
  try {
    // Validate input parameters
    if (!requestData.prompt || requestData.prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    // Validate dimensions if provided
    if (requestData.height && (requestData.height < 256 || requestData.height > 2048)) {
      throw new Error('Height must be between 256 and 2048 pixels');
    }

    if (requestData.width && (requestData.width < 256 || requestData.width > 2048)) {
      throw new Error('Width must be between 256 and 2048 pixels');
    }

    // Validate num_steps
    if (requestData.num_steps && requestData.num_steps > 20) {
      throw new Error('Maximum number of steps is 20');
    }

    // Validate strength for img2img
    if (requestData.strength !== undefined && (requestData.strength < 0 || requestData.strength > 1)) {
      throw new Error('Strength must be between 0 and 1');
    }

    // Prepare API request
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`;
    
    const headers = {
      'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // Prepare request payload with defaults
    const payload = {
      prompt: requestData.prompt.trim(),
      ...(requestData.negative_prompt && { negative_prompt: requestData.negative_prompt }),
      ...(requestData.height && { height: requestData.height }),
      ...(requestData.width && { width: requestData.width }),
      ...(requestData.image && { image: requestData.image }),
      ...(requestData.image_b64 && { image_b64: requestData.image_b64 }),
      ...(requestData.mask && { mask: requestData.mask }),
      num_steps: requestData.num_steps || 20,
      strength: requestData.strength || 1,
      guidance: requestData.guidance || 7.5,
      ...(requestData.seed && { seed: requestData.seed }),
    };

    console.log('SDXL API Request:', { url: apiUrl, payload: { ...payload, image_b64: payload.image_b64 ? '[BASE64_DATA]' : undefined } });

    // Make API call
    const response = await axios.post(apiUrl, payload, { 
      headers,
      responseType: 'arraybuffer' // Since output is binary PNG
    });

    // Process binary response (PNG image)
    if (response.data && response.data.byteLength > 0) {
      const buffer = Buffer.from(response.data);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedPrompt = requestData.prompt
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      const fileName = `${timestamp}_sdxl_${sanitizedPrompt}.png`;
      const filePath = path.join(process.cwd(), 'images', fileName);
      
      // Ensure images directory exists
      const imagesDir = path.join(process.cwd(), 'images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, buffer);
      
      // Convert to base64 for response
      const base64Image = buffer.toString('base64');
      
      return {
        success: true,
        data: {
          result: base64Image,
          filePath,
          fileName,
          meta: {
            seed: requestData.seed
          }
        }
      };
    }

    throw new Error('No image data received from API');

  } catch (error: any) {
    console.error('SDXL Service Error:', error.message);
    
    // Handle specific API errors
    if (error.response) {
      const apiError = error.response.data?.errors?.[0]?.message || 
                      error.response.data?.message || 
                      `API Error: ${error.response.status}`;
      return {
        success: false,
        error: apiError
      };
    }
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};