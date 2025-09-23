# AI Assistant Guide: End-to-End Implementation for New AI Models

This comprehensive guide provides step-by-step instructions for AI assistants to implement new AI models in the Cloudflare Workers AI application when given a model identifier, sample inputs, and sample outputs.

## 📋 Prerequisites

Before starting, ensure you have:
- Model identifier (e.g., `@cf/stability-ai/stable-diffusion-xl`)
- Sample input structure (request payload)
- Sample output structure (response format)
- Understanding of the project structure

## 🏗️ Project Structure Overview

```
├── src/                                    # Backend (Node.js/Express)
│   ├── controllers/                        # Request handlers
│   │   └── generativeControllers.ts       # Main controller file
│   ├── interfaces/                         # TypeScript interfaces
│   ├── routes/                            # API route definitions
│   │   └── generativeRoutes.ts           # Main routes file
│   └── services/                          # Business logic
│       └── generativeServices/            # AI service implementations
├── ts-front/                              # Frontend (React/TypeScript)
│   └── src/
│       ├── components/                    # React components
│       ├── services/                      # API communication
│       │   └── apiService.ts             # Main API service
│       └── App.tsx                       # Main app component
└── interfaces/                           # Shared interfaces
```

## 🚀 Step-by-Step Implementation Guide

### Step 1: Analyze the Model Requirements

**Input Analysis Checklist:**
- [ ] Identify all required parameters
- [ ] Identify optional parameters with defaults
- [ ] Note parameter types (string, number, boolean, array, object)
- [ ] Check for file upload requirements (images, audio, etc.)
- [ ] Identify any special validation rules

**Output Analysis Checklist:**
- [ ] Understand response structure
- [ ] Identify if response contains binary data (images, audio)
- [ ] Note if response needs file saving
- [ ] Check for error response format

### Step 2: Create TypeScript Interface

**Location:** `src/interfaces/[modelName]Interface.ts`

```typescript
// Template for interface creation
export interface [ModelName]RequestInterface {
  // Required parameters
  requiredParam: string;
  
  // Optional parameters with defaults
  optionalParam?: number;
  
  // File uploads (if needed)
  image?: string; // base64 or file path
}

export interface [ModelName]ResponseInterface {
  success: boolean;
  data?: {
    // Response data structure
    result: string | object;
    // For file responses
    filePath?: string;
    fileName?: string;
  };
  error?: string;
}
```

### Step 3: Implement Backend Service

**Location:** `src/services/generativeServices/[modelName]Service.ts`

```typescript
// Template for service implementation
import axios from 'axios';
import { [ModelName]RequestInterface } from '../../interfaces/[modelName]Interface';
import { uploadImageBase64 } from '../imagekitService';
import { addImage } from '../imageServices';
import { IImage } from '../../models/imageModel';

// Standard interface for image generation services
interface GeneratedImageResult {
  fileId: string;
  url: string;
  thumbnailUrl: string;
  fileName: string;
  filePath: string;
}

export const [modelName]Service = async (
  requestData: [ModelName]RequestInterface,
  email?: string // Add email parameter for database storage
): Promise<GeneratedImageResult> => {
  try {
    // 1. Validate input parameters
    if (!requestData.requiredParam) {
      throw new Error('Required parameter is missing');
    }

    // 2. Prepare API request
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/model-identifier`;
    
    const headers = {
      'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // 3. Make API call
    const response = await axios.post(apiUrl, requestData, { headers });

    // 4. Process response based on type
    
    // For image generation models - upload to ImageKit instead of local storage
    if (response.data.result?.image || (response.data && Buffer.isBuffer(response.data))) {
      let base64Image: string;
      
      if (response.data.result?.image) {
        // Cloudflare API returns base64 in result.image
        base64Image = response.data.result.image;
      } else {
        // Binary response data
        base64Image = Buffer.from(response.data).toString('base64');
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedPrompt = requestData.prompt || requestData.requiredParam || 'generated';
      const cleanPrompt = sanitizedPrompt
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      const fileName = `${timestamp}_${cleanPrompt}.png`;
      
      // Upload to ImageKit
      const uploadResult = await uploadImageBase64(
        base64Image,
        fileName,
        '/generated-images',
        ['ai-generated', 'model-name', cleanPrompt.substring(0, 20)]
      );
      
      // Store in database if email provided
      if (requestData.email) {
        const imageData: Partial<IImage> = {
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          prompt: requestData.prompt || requestData.requiredParam,
          userEmail: requestData.email
          // Add other model-specific parameters
        };
        await addImage(imageData);
      }
      
      return {
        fileId: uploadResult.fileId,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        fileName: uploadResult.name,
        filePath: uploadResult.filePath
      };
    }
    
    // For text/JSON responses
    if (response.data.result) {
      return {
        success: true,
        data: {
          result: response.data.result
        }
      };
    }

    throw new Error('Unexpected response format');

  } catch (error: any) {
    console.error(`[ModelName] Service Error:`, error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Unknown error occurred'
    };
  }
};
```

### Step 4: Create Controller Function

**Location:** `src/controllers/generativeControllers.ts`

Add the following function to the existing file:

```typescript
// Import the service
import { [modelName]Service } from '../services/generativeServices/[modelName]Service';
import { [ModelName]RequestInterface } from '../interfaces/[modelName]Interface';

// Add controller function
export const [modelName]Controller = async (req: Request, res: Response) => {
  try {
    const requestData: [ModelName]RequestInterface = req.body;
    
    // Call the service
    const result = await [modelName]Service(requestData);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    console.error(`[ModelName] Controller Error:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
```

### Step 5: Add API Route

**Location:** `src/routes/generativeRoutes.ts`

Add the following route to the existing file:

```typescript
// Import the controller
import * as generativeControllers from "../controllers/generativeControllers";

// Add route (insert with other routes)
router.post(
  "/generative/[model-category]/[modelName]",
  // authMiddleware, // Uncomment if authentication is required
  generativeControllers.[modelName]Controller
);
```

### Step 6: Create Frontend Component

**Location:** `ts-front/src/components/[ModelName]/[ModelName].tsx`

```typescript
import React, { useState } from 'react';
import { [modelName]API } from '../../services/apiService';
import Button from '../common/Button';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Card from '../common/Card';
import { toast } from 'react-toastify';

interface [ModelName]State {
  // Form state matching the API interface
  requiredParam: string;
  optionalParam: number;
  isLoading: boolean;
  result?: any;
}

const [ModelName]: React.FC = () => {
  const [state, setState] = useState<[ModelName]State>({
    requiredParam: '',
    optionalParam: 4, // default value
    isLoading: false,
  });

  const handleInputChange = (field: keyof [ModelName]State, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!state.requiredParam.trim()) {
      toast.error('Required parameter is missing');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await [modelName]API({
        requiredParam: state.requiredParam,
        optionalParam: state.optionalParam,
      });

      if (response.success) {
        setState(prev => ({ ...prev, result: response.data }));
        toast.success('Request completed successfully!');
      } else {
        toast.error(response.error || 'Request failed');
      }
    } catch (error: any) {
      console.error('[ModelName] Error:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold mb-4">[Model Display Name]</h2>
        
        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Required Parameter *
            </label>
            <TextArea
              value={state.requiredParam}
              onChange={(value) => handleInputChange('requiredParam', value)}
              placeholder="Enter your input here..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Optional Parameter
            </label>
            <Input
              type="number"
              value={state.optionalParam}
              onChange={(value) => handleInputChange('optionalParam', parseInt(value) || 4)}
              min={1}
              max={10}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={state.isLoading || !state.requiredParam.trim()}
            className="w-full"
          >
            {state.isLoading ? 'Processing...' : 'Generate'}
          </Button>
        </div>
      </Card>

      {/* Results Display */}
      {state.result && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Result</h3>
          {/* Display results - images now come from ImageKit URLs */}
          {state.result.url ? (
            <div className="space-y-2">
              <img 
                src={state.result.url}
                alt="Generated result"
                className="max-w-full h-auto rounded-lg"
              />
              {state.result.thumbnailUrl && (
                <p className="text-sm text-gray-500">
                  <a href={state.result.url} target="_blank" rel="noopener noreferrer">
                    View full size
                  </a>
                </p>
              )}
            </div>
          ) : (
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
              {JSON.stringify(state.result, null, 2)}
            </pre>
          )}
        </Card>
      )}
    </div>
  );
};

export default [ModelName];
```

### Step 7: Add API Service Function

**Location:** `ts-front/src/services/apiService.ts`

Add the following function to the existing file:

```typescript
// Add interface import at the top
interface [ModelName]Request {
  requiredParam: string;
  optionalParam?: number;
}

interface [ModelName]Response {
  success: boolean;
  data?: any;
  error?: string;
}

// Add API function
export const [modelName]API = async (
  requestData: [ModelName]Request
): Promise<[ModelName]Response> => {
  try {
    const response = await api.post('/generative/[model-category]/[modelName]', requestData);
    return response.data;
  } catch (error: any) {
    console.error('[ModelName] API Error:', error);
    throw new Error(error.response?.data?.error || 'API request failed');
  }
};
```

### Step 8: Integrate into Main App

**Location:** `ts-front/src/App.tsx`

1. **Import the component:**
```typescript
import [ModelName] from './components/[ModelName]/[ModelName]';
```

2. **Add to tabs array:**
```typescript
const tabs = [
  // ... existing tabs
  { id: '[modelName]', label: '[Model Display Name]', component: [ModelName] },
];
```

## 🔍 Testing Checklist

After implementation, verify:

**Backend Testing:**
- [ ] Service function handles valid inputs correctly
- [ ] Service function handles invalid inputs with proper errors
- [ ] Controller returns correct HTTP status codes
- [ ] Route is accessible at the correct endpoint

**Frontend Testing:**
- [ ] Component renders without errors
- [ ] Form validation works correctly
- [ ] API calls are made with correct data
- [ ] Results are displayed properly
- [ ] Error handling shows appropriate messages

**Integration Testing:**
- [ ] End-to-end flow works from frontend to backend
- [ ] File uploads/downloads work (if applicable)
- [ ] Authentication works (if required)

## 🛠️ Common Patterns and Best Practices

### Universal Output Format

All image generation services now return a standardized `GeneratedImageResult` interface:

```typescript
interface GeneratedImageResult {
  fileId: string;      // ImageKit file ID
  url: string;         // Full resolution image URL
  thumbnailUrl: string; // Thumbnail URL from ImageKit
  fileName: string;    // Original filename
  filePath: string;    // ImageKit file path
}
```

This standardization allows for:
- Consistent frontend handling across all image models
- Unified database storage patterns
- Easy integration with ImageKit's transformation features
- Consistent error handling and user experience

### File Naming Conventions
- **Services:** `camelCase` (e.g., `textToImageService`)
- **Controllers:** `camelCase` + `Controller` (e.g., `textToImageController`)
- **Components:** `PascalCase` (e.g., `TextToImage`)
- **Interfaces:** `PascalCase` + `Interface` (e.g., `TextToImageInterface`)

### Error Handling Patterns
```typescript
// Service level
try {
  // API call
} catch (error: any) {
  return {
    success: false,
    error: error.response?.data?.message || error.message || 'Unknown error'
  };
}

// Frontend level
try {
  // API call
} catch (error: any) {
  toast.error(error.message || 'An error occurred');
}
```

### Image Upload and Storage Patterns

The application now uses **ImageKit** for image storage instead of local file storage. All generated images are uploaded to ImageKit and their metadata is stored in the database.

```typescript
// Standard GeneratedImageResult interface used across all image services
interface GeneratedImageResult {
  fileId: string;
  url: string;
  thumbnailUrl: string;
  fileName: string;
  filePath: string;
}

// Upload generated image to ImageKit
import { uploadImageBase64 } from '../imagekitService';
import { addImage } from '../imageServices';
import { IImage } from '../../models/imageModel';

// Generate filename for ImageKit upload
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const sanitizedPrompt = prompt
  .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
  .replace(/\s+/g, '-') // Replace spaces with hyphens
  .substring(0, 50); // Limit length

const filename = `${timestamp}_${sanitizedPrompt}.png`;

// Upload to ImageKit
const uploadResult = await uploadImageBase64(
  base64ImageData, // base64 image data from Cloudflare API
  filename,
  '/generated-images', // folder in ImageKit
  ['ai-generated', 'model-specific-tag', sanitizedPrompt.substring(0, 20)] // tags
);

// Store image metadata in database
if (email) {
  const imageData: Partial<IImage> = {
    url: uploadResult.url,
    thumbnailUrl: uploadResult.thumbnailUrl,
    prompt: prompt,
    // Add other model-specific parameters as needed
    userEmail: email
  };
  await addImage(imageData);
}

// Return standardized result
return {
  fileId: uploadResult.fileId,
  url: uploadResult.url,
  thumbnailUrl: uploadResult.thumbnailUrl,
  fileName: uploadResult.name,
  filePath: uploadResult.filePath
};
```

## 📚 Reference Examples

Look at these existing implementations for reference:
- **Text to Image:** `textToImageService.ts`, `TextToImage.tsx`
- **Inpainting:** `inpaintService.ts`, `Inpainting.tsx`
- **Nano Banana:** `nanoBanana.ts`, `NanoBanana.tsx`

## 🚨 Common Pitfalls to Avoid

1. **Missing error handling** - Always wrap API calls in try-catch
2. **Incorrect interface types** - Match exactly with API requirements
3. **File path issues** - Use `path.join()` for cross-platform compatibility
4. **Missing validation** - Validate inputs both frontend and backend
5. **Hardcoded URLs** - Use environment variables for API endpoints
6. **Memory leaks** - Clean up resources, especially for large files
7. **Security issues** - Never expose API tokens in frontend code

## 📝 Final Checklist

Before considering the implementation complete:

- [ ] All files created and properly imported
- [ ] TypeScript compiles without errors
- [ ] Backend service tested with sample inputs
- [ ] Frontend component renders and functions
- [ ] API endpoints return expected responses
- [ ] Error scenarios handled gracefully
- [ ] Code follows project conventions
- [ ] Documentation updated (if required)

---

**Note for AI Assistants:** Always follow this guide step-by-step and customize the templates based on the specific model requirements provided. Pay special attention to the input/output formats and adjust the implementation accordingly.