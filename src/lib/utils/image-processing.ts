// /src/lib/utils/image-processing.ts
import sharp from 'sharp';

export interface ProcessedImage {
  buffer: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export async function optimizeReceiptImage(buffer: Buffer): Promise<ProcessedImage> {
  try {
    // Get original metadata
    const metadata = await sharp(buffer).metadata();
    
    // Process image for storage
    const processedBuffer = await sharp(buffer)
      .resize(1024, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ 
        quality: 85,
        progressive: true 
      })
      .toBuffer();

    // Get processed metadata
    const processedMetadata = await sharp(processedBuffer).metadata();

    return {
      buffer: processedBuffer,
      metadata: {
        width: processedMetadata.width || 0,
        height: processedMetadata.height || 0,
        format: processedMetadata.format || 'jpeg',
        size: processedBuffer.length,
      },
    };
  } catch (error) {
    console.error('Image optimization error:', error);
    throw new Error('Failed to optimize image');
  }
}

export async function enhanceReceiptForOCR(buffer: Buffer): Promise<Buffer> {
  try {
    // Enhance image for better OCR results
    const enhancedBuffer = await sharp(buffer)
      .resize(2048, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .grayscale() // Convert to grayscale for better text recognition
      .normalize() // Normalize contrast
      .sharpen({ sigma: 1.5 }) // Sharpen text
      .toBuffer();

    return enhancedBuffer;
  } catch (error) {
    console.error('Image enhancement error:', error);
    throw new Error('Failed to enhance image for OCR');
  }
}

export async function validateImage(buffer: Buffer): Promise<{
  isValid: boolean;
  error?: string;
  metadata?: sharp.Metadata;
}> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    // Check if it's a valid image
    if (!metadata.width || !metadata.height) {
      return {
        isValid: false,
        error: 'Invalid image dimensions',
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (buffer.length > maxSize) {
      return {
        isValid: false,
        error: 'Image size exceeds 5MB limit',
      };
    }

    // Check minimum dimensions
    const minWidth = 200;
    const minHeight = 200;
    if (metadata.width < minWidth || metadata.height < minHeight) {
      return {
        isValid: false,
        error: `Image dimensions must be at least ${minWidth}x${minHeight} pixels`,
      };
    }

    // Check supported formats
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'heif', 'heic'];
    if (!supportedFormats.includes(metadata.format || '')) {
      return {
        isValid: false,
        error: 'Unsupported image format. Please use JPEG, PNG, or HEIC',
      };
    }

    return {
      isValid: true,
      metadata,
    };
  } catch (error) {
    console.error('Image validation error:', error);
    return {
      isValid: false,
      error: 'Failed to validate image',
    };
  }
}

export async function rotateImageIfNeeded(buffer: Buffer): Promise<Buffer> {
  try {
    // Sharp automatically handles EXIF orientation
    const rotatedBuffer = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF data
      .toBuffer();

    return rotatedBuffer;
  } catch (error) {
    console.error('Image rotation error:', error);
    // Return original buffer if rotation fails
    return buffer;
  }
}

export async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    // Check if it's HEIC/HEIF format
    if (metadata.format === 'heif' || metadata.format === 'heic') {
      const convertedBuffer = await sharp(buffer)
        .jpeg({ quality: 90 })
        .toBuffer();
      
      return convertedBuffer;
    }
    
    // Return original if not HEIC
    return buffer;
  } catch (error) {
    console.error('HEIC conversion error:', error);
    throw new Error('Failed to convert HEIC image');
  }
}

export async function generateThumbnail(buffer: Buffer, size: number = 200): Promise<Buffer> {
  try {
    const thumbnailBuffer = await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return thumbnailBuffer;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw new Error('Failed to generate thumbnail');
  }
}

export async function extractImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
  density?: number;
  hasAlpha?: boolean;
  orientation?: number;
}> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    throw new Error('Failed to extract image metadata');
  }
}

// Utility function to prepare image for OCR processing
export async function prepareImageForOCR(buffer: Buffer): Promise<Buffer> {
  try {
    // Apply a series of transformations to improve OCR accuracy
    let processedBuffer = buffer;

    // First, handle HEIC conversion if needed
    processedBuffer = await convertHeicToJpeg(processedBuffer);

    // Rotate based on EXIF data
    processedBuffer = await rotateImageIfNeeded(processedBuffer);

    // Enhance for OCR
    processedBuffer = await enhanceReceiptForOCR(processedBuffer);

    return processedBuffer;
  } catch (error) {
    console.error('OCR preparation error:', error);
    // Return original buffer if processing fails
    return buffer;
  }
}

// Utility function to prepare image for storage
export async function prepareImageForStorage(buffer: Buffer): Promise<ProcessedImage> {
  try {
    // Apply optimizations for storage
    let processedBuffer = buffer;

    // Handle HEIC conversion
    processedBuffer = await convertHeicToJpeg(processedBuffer);

    // Rotate if needed
    processedBuffer = await rotateImageIfNeeded(processedBuffer);

    // Optimize for storage
    return await optimizeReceiptImage(processedBuffer);
  } catch (error) {
    console.error('Storage preparation error:', error);
    throw new Error('Failed to prepare image for storage');
  }
}