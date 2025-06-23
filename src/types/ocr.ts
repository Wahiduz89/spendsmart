// /src/types/ocr.ts
export interface OCRResponse {
    fullText: string;
    blocks?: Array<{
      text: string;
      confidence: number;
      boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
    metadata?: {
      pages: number;
      language: string;
    };
  }
  
  export interface ExtractedReceiptData {
    amount?: {
      value: number;
      currency?: string;
      confidence: number;
    };
    date?: {
      value: string;
      format: string;
      confidence: number;
    };
    merchant?: {
      name: string;
      confidence: number;
    };
    items?: Array<{
      description: string;
      quantity?: number;
      price?: number;
    }>;
    paymentMethod?: {
      type: string;
      lastFourDigits?: string;
      confidence: number;
    };
  }