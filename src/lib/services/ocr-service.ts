// /src/lib/services/ocr-service.ts
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';

export interface OCRResult {
  fullText: string;
  confidence: number;
  extractedData: {
    amount?: number;
    date?: string;
    merchant?: string;
    paymentMethod?: string;
    description?: string;
  };
}

export class AWSTextractService {
  private client: TextractClient;

  constructor() {
    this.client = new TextractClient({ 
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });
  }

  async processImage(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    try {
      const command = new DetectDocumentTextCommand({
        Document: { 
          Bytes: imageBuffer 
        }
      });

      const response = await this.client.send(command);
      
      // Extract text from blocks
      const textBlocks = response.Blocks?.filter(block => block.BlockType === 'LINE') || [];
      const fullText = textBlocks
        .map(block => block.Text || '')
        .join('\n');

      // Calculate average confidence
      const confidences = textBlocks
        .map(block => block.Confidence || 0)
        .filter(conf => conf > 0);
      
      const averageConfidence = confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length / 100
        : 0;

      // Extract structured data from text
      const extractedData = this.extractDataFromText(fullText);

      return {
        fullText,
        confidence: averageConfidence,
        extractedData,
      };
    } catch (error) {
      console.error('AWS Textract processing error:', error);
      throw new Error('Failed to process image with AWS Textract');
    }
  }

  private extractDataFromText(text: string): OCRResult['extractedData'] {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const extractedData: OCRResult['extractedData'] = {};

    // Extract amount with Indian currency patterns
    const amountPatterns = [
      /total[:\s]*(?:₹|rs\.?|inr)?\s*(\d+(?:[,\d]*)?(?:\.\d{1,2})?)/i,
      /grand\s*total[:\s]*(?:₹|rs\.?|inr)?\s*(\d+(?:[,\d]*)?(?:\.\d{1,2})?)/i,
      /amount[:\s]*(?:₹|rs\.?|inr)?\s*(\d+(?:[,\d]*)?(?:\.\d{1,2})?)/i,
      /(?:₹|rs\.?|inr)\s*(\d+(?:[,\d]*)?(?:\.\d{1,2})?)\s*(?:total|paid)?/i,
      /net\s*payable[:\s]*(?:₹|rs\.?|inr)?\s*(\d+(?:[,\d]*)?(?:\.\d{1,2})?)/i,
      /subtotal[:\s]*(?:₹|rs\.?|inr)?\s*(\d+(?:[,\d]*)?(?:\.\d{1,2})?)/i,
    ];

    for (const pattern of amountPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
          extractedData.amount = amount;
          break;
        }
      }
    }

    // Extract date with Indian date formats
    const datePatterns = [
      /date[:\s]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i,
      /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/,
      /(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/,
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const parsedDate = this.parseIndianDate(match[1]);
        if (parsedDate) {
          extractedData.date = parsedDate;
          break;
        }
      }
    }

    // Extract merchant name
    const merchantPatterns = [
      /^([A-Z][A-Za-z\s&'.,-]+)(?:\n|$)/m,
      /from[:\s]*([A-Za-z\s&'.,-]+)/i,
      /merchant[:\s]*([A-Za-z\s&'.,-]+)/i,
      /store[:\s]*([A-Za-z\s&'.,-]+)/i,
      /billed\s*to[:\s]*([A-Za-z\s&'.,-]+)/i,
    ];

    // Check for common Indian merchants first
    const commonMerchants = [
      'Swiggy', 'Zomato', 'BigBasket', 'Amazon', 'Flipkart', 'Myntra',
      'Reliance', 'DMart', 'Spencer', 'More', 'Big Bazaar', 'Shoppers Stop',
      'Dominos', 'Pizza Hut', 'McDonald', 'KFC', 'Burger King', 'Subway',
      'Uber', 'Ola', 'Rapido', 'Metro', 'Petrol', 'Shell', 'HP', 'Indian Oil',
      'Paytm', 'PhonePe', 'Google Pay', 'HDFC', 'ICICI', 'SBI', 'Axis',
    ];

    for (const merchant of commonMerchants) {
      if (cleanText.toLowerCase().includes(merchant.toLowerCase())) {
        extractedData.merchant = merchant;
        break;
      }
    }

    // If no common merchant found, try patterns
    if (!extractedData.merchant) {
      for (const pattern of merchantPatterns) {
        const match = cleanText.match(pattern);
        if (match) {
          const merchant = match[1].trim();
          if (merchant.length > 2 && merchant.length < 50) {
            extractedData.merchant = merchant;
            break;
          }
        }
      }
    }

    // Extract payment method
    const paymentPatterns = [
      /payment[:\s]*(?:method[:\s]*)?([A-Za-z\s]+)/i,
      /paid\s*(?:by|via)[:\s]*([A-Za-z\s]+)/i,
      /(cash|card|credit|debit|upi|paytm|phonepe|gpay|google\s*pay|wallet|net\s*banking|neft|imps|rtgs)/i,
      /mode[:\s]*([A-Za-z\s]+)/i,
    ];

    for (const pattern of paymentPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const method = match[1].toLowerCase().trim();
        const mappedMethod = this.mapPaymentMethod(method);
        if (mappedMethod) {
          extractedData.paymentMethod = mappedMethod;
          break;
        }
      }
    }

    // Generate description if we have merchant and amount
    if (extractedData.merchant) {
      extractedData.description = `Purchase at ${extractedData.merchant}`;
      if (extractedData.amount) {
        extractedData.description += ` for ₹${extractedData.amount}`;
      }
    }

    return extractedData;
  }

  private parseIndianDate(dateStr: string): string | null {
    try {
      // Clean the date string
      dateStr = dateStr.trim();
      
      // Handle DD-MM-YYYY or DD/MM/YYYY format
      const ddmmyyyyPattern = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/;
      const ddmmyyyyMatch = dateStr.match(ddmmyyyyPattern);
      if (ddmmyyyyMatch) {
        const day = parseInt(ddmmyyyyMatch[1]);
        const month = parseInt(ddmmyyyyMatch[2]);
        let year = parseInt(ddmmyyyyMatch[3]);
        
        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      // Handle YYYY-MM-DD format
      const yyyymmddPattern = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/;
      const yyyymmddMatch = dateStr.match(yyyymmddPattern);
      if (yyyymmddMatch) {
        const year = parseInt(yyyymmddMatch[1]);
        const month = parseInt(yyyymmddMatch[2]);
        const day = parseInt(yyyymmddMatch[3]);
        
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      // Handle text month format (e.g., "15 Jan 2024")
      const textMonthPattern = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/i;
      const textMonthMatch = dateStr.match(textMonthPattern);
      if (textMonthMatch) {
        const day = parseInt(textMonthMatch[1]);
        const monthStr = textMonthMatch[2].toLowerCase().substring(0, 3);
        let year = parseInt(textMonthMatch[3]);
        
        const monthMap: Record<string, number> = {
          jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
        };
        
        if (monthMap.hasOwnProperty(monthStr)) {
          if (year < 100) {
            year += year < 50 ? 2000 : 1900;
          }
          
          const date = new Date(year, monthMap[monthStr], day);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Date parsing error:', error);
      return null;
    }
  }

  private mapPaymentMethod(method: string): string | null {
    const mappings: Record<string, string> = {
      'cash': 'CASH',
      'card': 'CREDIT_CARD',
      'credit': 'CREDIT_CARD',
      'credit card': 'CREDIT_CARD',
      'debit': 'DEBIT_CARD',
      'debit card': 'DEBIT_CARD',
      'upi': 'UPI',
      'paytm': 'WALLET',
      'phonepe': 'WALLET',
      'phone pe': 'WALLET',
      'gpay': 'UPI',
      'google pay': 'UPI',
      'googlepay': 'UPI',
      'wallet': 'WALLET',
      'net banking': 'NET_BANKING',
      'netbanking': 'NET_BANKING',
      'internet banking': 'NET_BANKING',
      'neft': 'NET_BANKING',
      'imps': 'NET_BANKING',
      'rtgs': 'NET_BANKING',
    };
    
    return mappings[method] || null;
  }
}

// Export a singleton instance
export const ocrService = new AWSTextractService();