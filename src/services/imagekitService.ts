import imagekit from '../utils/imagekitConfig';

interface UploadResult {
    fileId: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    size: number;
    filePath: string;
    tags?: string[];
    customMetadata?: Record<string, any>;
}

interface ImageListOptions {
    skip?: number;
    limit?: number;
    folder?: string;
    tags?: string[];
}

interface TransformationOptions {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number;
    format?: string;
}

/**
 * Upload an image to ImageKit
 * @param file - File buffer or base64 string
 * @param fileName - Name for the uploaded file
 * @param folder - Optional folder path
 * @param tags - Optional tags array
 * @returns Upload result
 */
export async function uploadImage(
    file: Buffer | string,
    fileName: string,
    folder?: string,
    tags?: string[]
): Promise<UploadResult> {
    try {
        const uploadOptions: any = {
            file,
            fileName,
            useUniqueFileName: true,
        };

        if (folder) {
            uploadOptions.folder = folder;
        }

        if (tags && tags.length > 0) {
            uploadOptions.tags = tags;
        }

        const result = await imagekit.upload(uploadOptions);
        
        return {
            fileId: result.fileId,
            name: result.name,
            url: result.url,
            thumbnailUrl: result.thumbnailUrl,
            size: result.size,
            filePath: result.filePath,
            tags: result.tags,
            customMetadata: result.customMetadata,
        };
    } catch (error) {
        console.error('Error uploading image to ImageKit:', error);
        throw new Error(`Failed to upload image: ${error}`);
    }
}

/**
 * Upload image as base64 to ImageKit
 * @param base64Data - Base64 encoded image data (with or without data:image prefix)
 * @param fileName - Name for the uploaded file
 * @param folder - Optional folder path
 * @param tags - Optional tags array
 * @returns Upload result
 */
export async function uploadImageBase64(
    base64Data: string,
    fileName: string,
    folder?: string,
    tags?: string[]
): Promise<UploadResult> {
    try {
        // Clean base64 data - remove data:image/xxx;base64, prefix if present
        const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
        
        const uploadOptions: any = {
            file: cleanBase64,
            fileName,
            useUniqueFileName: true,
        };

        if (folder) {
            uploadOptions.folder = folder;
        }

        if (tags && tags.length > 0) {
            uploadOptions.tags = tags;
        }

        const result = await imagekit.upload(uploadOptions);
        
        return {
            fileId: result.fileId,
            name: result.name,
            url: result.url,
            thumbnailUrl: result.thumbnailUrl,
            size: result.size,
            filePath: result.filePath,
            tags: result.tags,
            customMetadata: result.customMetadata,
        };
    } catch (error) {
        console.error('Error uploading base64 image to ImageKit:', error);
        throw new Error(`Failed to upload base64 image: ${error}`);
    }
}

/**
 * Upload image from URL
 * @param imageUrl - URL of the image to upload
 * @param fileName - Name for the uploaded file
 * @param folder - Optional folder path
 * @param tags - Optional tags array
 * @returns Upload result
 */
export async function uploadFromUrl(
    imageUrl: string,
    fileName: string,
    folder?: string,
    tags?: string[]
): Promise<UploadResult> {
    try {
        const uploadOptions: any = {
            file: imageUrl,
            fileName,
            useUniqueFileName: true,
        };

        if (folder) {
            uploadOptions.folder = folder;
        }

        if (tags && tags.length > 0) {
            uploadOptions.tags = tags;
        }

        const result = await imagekit.upload(uploadOptions);
        
        return {
            fileId: result.fileId,
            name: result.name,
            url: result.url,
            thumbnailUrl: result.thumbnailUrl,
            size: result.size,
            filePath: result.filePath,
            tags: result.tags,
            customMetadata: result.customMetadata,
        };
    } catch (error) {
        console.error('Error uploading image from URL to ImageKit:', error);
        throw new Error(`Failed to upload image from URL: ${error}`);
    }
}

/**
 * Get all images from ImageKit
 * @param options - Options for listing images
 * @returns Array of image objects
 */
export async function getAllImages(options: ImageListOptions = {}): Promise<any[]> {
    try {
        const { skip = 0, limit = 1000, folder, tags } = options;
        
        let searchQuery = 'type="image"';
        
        if (folder) {
            searchQuery += ` AND filePath INCLUDES "${folder}"`;
        }
        
        if (tags && tags.length > 0) {
            const tagQuery = tags.map(tag => `tags INCLUDES "${tag}"`).join(' AND ');
            searchQuery += ` AND ${tagQuery}`;
        }

        const result = await imagekit.listFiles({
            skip,
            limit,
            searchQuery,
            sort: 'DESC_CREATED'
        });

        return result;
    } catch (error) {
        console.error('Error fetching images from ImageKit:', error);
        throw new Error(`Failed to fetch images: ${error}`);
    }
}

/**
 * Get all images with pagination support
 * @param options - Options for listing images
 * @returns Array of all images
 */
export async function getAllImagesPaginated(options: ImageListOptions = {}): Promise<any[]> {
    try {
        let allImages: any[] = [];
        let skip = 0;
        const limit = 1000; // Max per request
        let hasMore = true;

        while (hasMore) {
            const batch = await getAllImages({
                ...options,
                skip,
                limit
            });

            allImages = allImages.concat(batch);
            
            if (batch.length < limit) {
                hasMore = false;
            } else {
                skip += limit;
            }
        }

        return allImages;
    } catch (error) {
        console.error('Error fetching all images with pagination:', error);
        throw new Error(`Failed to fetch all images: ${error}`);
    }
}

/**
 * Get image by file ID
 * @param fileId - The file ID of the image
 * @returns Image details
 */
export async function getImageById(fileId: string): Promise<any> {
    try {
        const result = await imagekit.getFileDetails(fileId);
        return result;
    } catch (error) {
        console.error('Error fetching image by ID:', error);
        throw new Error(`Failed to fetch image: ${error}`);
    }
}

/**
 * Generate transformed image URL
 * @param imageUrl - Original image URL
 * @param transformations - Transformation options
 * @returns Transformed image URL
 */
export function getTransformedUrl(
    imageUrl: string,
    transformations: TransformationOptions = {}
): string {
    try {
        const transformationArray: any[] = [];
        
        if (Object.keys(transformations).length > 0) {
            transformationArray.push(transformations);
        }

        return imagekit.url({
            src: imageUrl,
            transformation: transformationArray
        });
    } catch (error) {
        console.error('Error generating transformed URL:', error);
        return imageUrl; // Return original URL if transformation fails
    }
}

/**
 * Delete image by file ID
 * @param fileId - The file ID of the image to delete
 * @returns Deletion result
 */
export async function deleteImage(fileId: string): Promise<void> {
    try {
        await imagekit.deleteFile(fileId);
    } catch (error) {
        console.error('Error deleting image:', error);
        throw new Error(`Failed to delete image: ${error}`);
    }
}

/**
 * Get images with thumbnail URLs
 * @param options - Options for listing images
 * @param thumbnailTransformations - Transformations for thumbnails
 * @returns Array of images with thumbnail URLs
 */
export async function getImagesWithThumbnails(
    options: ImageListOptions = {},
    thumbnailTransformations: TransformationOptions = { width: 300, height: 200, crop: 'maintain_ratio' }
): Promise<any[]> {
    try {
        const images = await getAllImages(options);
        
        return images.map(image => ({
            ...image,
            thumbnailUrl: getTransformedUrl(image.url, thumbnailTransformations),
            originalUrl: image.url
        }));
    } catch (error) {
        console.error('Error fetching images with thumbnails:', error);
        throw new Error(`Failed to fetch images with thumbnails: ${error}`);
    }
}

/**
 * Search images by name or tags
 * @param searchTerm - Term to search for
 * @param searchInTags - Whether to search in tags
 * @returns Array of matching images
 */
export async function searchImages(searchTerm: string, searchInTags: boolean = true): Promise<any[]> {
    try {
        let searchQuery = `type="image" AND name INCLUDES "${searchTerm}"`;
        
        if (searchInTags) {
            searchQuery += ` OR tags INCLUDES "${searchTerm}"`;
        }

        const result = await imagekit.listFiles({
            searchQuery,
            sort: 'DESC_CREATED'
        });

        return result;
    } catch (error) {
        console.error('Error searching images:', error);
        throw new Error(`Failed to search images: ${error}`);
    }
}