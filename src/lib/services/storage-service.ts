// /src/lib/services/storage-service.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface StorageResult {
  url: string;
  path: string;
  error?: string;
}

export class SupabaseStorageService {
  private supabase: SupabaseClient;
  private bucketName = 'receipts';

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.initializeBucket();
  }

  private async initializeBucket() {
    try {
      // Check if bucket exists
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);

      if (!bucketExists) {
        // Create bucket if it doesn't exist
        const { error } = await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif']
        });

        if (error && !error.message.includes('already exists')) {
          console.error('Error creating storage bucket:', error);
        }
      }
    } catch (error) {
      console.error('Error initializing storage bucket:', error);
    }
  }

  async uploadImage(
    buffer: Buffer, 
    filename: string, 
    mimeType: string,
    userId: string
  ): Promise<StorageResult> {
    try {
      // Generate unique filename with user ID and timestamp
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilename = `${userId}/${timestamp}_${sanitizedFilename}`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(uniqueFilename, buffer, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return {
          url: '',
          path: '',
          error: error.message || 'Failed to upload image'
        };
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      return {
        url: publicUrl,
        path: data.path,
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        url: '',
        path: '',
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  async deleteImage(path: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  async getImageUrl(path: string): Promise<string | null> {
    try {
      const { data } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      console.error('Get URL error:', error);
      return null;
    }
  }

  async listUserReceipts(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        console.error('List error:', error);
        return [];
      }

      return data?.map(file => `${userId}/${file.name}`) || [];
    } catch (error) {
      console.error('List error:', error);
      return [];
    }
  }

  async downloadImage(path: string): Promise<Buffer | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(path);

      if (error) {
        console.error('Download error:', error);
        return null;
      }

      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  }

  // Utility method to extract path from Supabase URL
  extractPathFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf(this.bucketName);
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      
      return '';
    } catch (error) {
      console.error('URL parsing error:', error);
      return '';
    }
  }

  // Check if a receipt exists
  async receiptExists(path: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(path);

      return !error;
    } catch (error) {
      return false;
    }
  }

  // Get signed URL for temporary access (useful for private buckets)
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Signed URL error:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const storageService = new SupabaseStorageService();