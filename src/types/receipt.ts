// /src/types/receipt.ts
export interface ReceiptData {
    merchant?: string;
    amount?: number;
    date?: string;
    description?: string;
    paymentMethod?: string;
  }
  
  export interface ReceiptProcessingResult {
    success: boolean;
    imageUrl?: string;
    ocrText?: string;
    extractedData?: ReceiptData;
    confidence: {
      amount: number;
      date: number;
      merchant: number;
      overall: number;
    };
    error?: string;
  }
  
  export interface ReceiptUploadProgress {
    stage: 'uploading' | 'processing' | 'extracting' | 'complete';
    progress: number;
    message: string;
  }