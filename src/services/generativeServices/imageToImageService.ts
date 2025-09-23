import axios from 'axios';
import { ImageToImageRequestInterface } from '../../interfaces/imageToImageInterface';
import { uploadImageBase64 } from '../imagekitService';
import { addImage } from '../imageServices';
import { IImage } from '../../models/imageModel';

interface GeneratedImageResult {
  fileId: string;
  url: string;
  thumbnailUrl: string;
  fileName: string;
  filePath: string;
}

export const imageToImageService = async (
  requestData: ImageToImageRequestInterface,
  email?: string
): Promise<GeneratedImageResult> => {
  try {
    if (!requestData.prompt) {
      throw new Error('Prompt is required');
    }

    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/runwayml/stable-diffusion-v1-5-img2img`;
    
    const headers = {
      'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    };

    const payload = {
      prompt: requestData.prompt,
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

    const response = await axios.post(apiUrl, payload, { 
      headers,
      responseType: 'arraybuffer'
    });

    if (response.data) {
      const base64Image = Buffer.from(response.data).toString('base64');
      
      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedPrompt = requestData.prompt
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      
      const fileName = `${timestamp}_img2img_${sanitizedPrompt}.png`;

      // Upload image to ImageKit
      const uploadResult = await uploadImageBase64(
        base64Image,
        fileName,
        '/generated-images',
        ['ai-generated', 'image-to-image', 'stable-diffusion', sanitizedPrompt.substring(0, 20)]
      );

      console.log(
        `Image-to-Image successfully generated and uploaded to ImageKit. URL: ${uploadResult.url}`
      );

      // Add image details to database
      try {
        if (email) {
          const imageData: Partial<IImage> = {
            url: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl,
            prompt: requestData.prompt,
            guidance: requestData.guidance || 7.5,
            height: requestData.height || 512,
            width: requestData.width || 512,
            steps: requestData.num_steps || 20,
            seed: requestData.seed,
            userEmail: email
          };
          await addImage(imageData);
          console.log('Image-to-Image data added to database:', imageData);
        }
      } catch (error) {
        console.error('Error adding Image-to-Image to database:', error);
      }

      return {
        fileId: uploadResult.fileId,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        fileName: uploadResult.name,
        filePath: uploadResult.filePath
      };
    }

    throw new Error('Unexpected response format');

  } catch (error: any) {
    console.error('ImageToImage Service Error:', error.message);
    throw new Error(error.response?.data?.message || error.message || 'Unknown error occurred');
  }
};