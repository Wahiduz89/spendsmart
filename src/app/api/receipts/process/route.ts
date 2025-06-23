import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Simple text extraction patterns for receipts
const extractionPatterns = {
  amount: [
    /total[:\s]*(?:₹|rs\.?|inr)?\s*(\d+(?:[,\d]*)?(?:\.\d{1,2})?)/i,
    /grand\s*total[:\s]*(?:₹|rs\.?|inr)?\s*(\d+(?:[,\d]*)?(?:\.\d{1,2})?)/i,
    /amount[:\s]*(?:₹|rs\.?|inr)?\s*(\d+(?:[,\d]*)?(?:\.\d{1,2})?)/i,
    /(?:₹|rs\.?|inr)\s*(\d+(?:[,\d]*)?(?:\.\d{1,2})?)\s*(?:total|paid)/i,
  ],
  date: [
    /date[:\s]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i,
    /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/,
    /(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/,
  ],
  merchant: [
    /^([A-Z][A-Za-z\s&'.,-]+)(?:\n|$)/m,
    /from[:\s]*([A-Za-z\s&'.,-]+)/i,
    /merchant[:\s]*([A-Za-z\s&'.,-]+)/i,
    /store[:\s]*([A-Za-z\s&'.,-]+)/i,
  ],
  paymentMethod: [
    /payment[:\s]*(?:method[:\s]*)?([A-Za-z\s]+)/i,
    /paid\s*(?:by|via)[:\s]*([A-Za-z\s]+)/i,
    /(cash|card|credit|debit|upi|paytm|phonepe|gpay|wallet)/i,
  ],
}

// Mock OCR function - in production, use a real OCR service
async function performOCR(imageBuffer: Buffer, mimeType: string): Promise<string> {
  // In a real implementation, you would:
  // 1. Use Google Cloud Vision API, AWS Textract, or Azure Computer Vision
  // 2. Send the image to the OCR service
  // 3. Return the extracted text
  
  // For this implementation, we'll simulate OCR with basic parsing
  // This is where you'd integrate with an actual OCR service
  
  // Example with Google Cloud Vision (pseudo-code):
  /*
  const vision = new ImageAnnotatorClient();
  const [result] = await vision.textDetection({
    image: { content: imageBuffer.toString('base64') }
  });
  return result.fullTextAnnotation?.text || '';
  */
  
  // Simulated response for demonstration
  return `
    BigBasket
    Your Daily Needs Delivered
    
    Date: ${new Date().toLocaleDateString('en-IN')}
    Order #: BB${Math.random().toString(36).substr(2, 9).toUpperCase()}
    
    Items:
    Vegetables & Fruits
    Dairy Products
    Groceries
    
    Subtotal: ₹850.00
    Delivery: ₹30.00
    
    Total: ₹880.00
    
    Payment Method: UPI
    
    Thank you for shopping with us!
  `.trim()
}

// Extract structured data from OCR text
function extractReceiptData(ocrText: string) {
  const cleanText = ocrText.replace(/\s+/g, ' ').trim()
  
  const extractedData: any = {}
  
  // Extract amount
  for (const pattern of extractionPatterns.amount) {
    const match = cleanText.match(pattern)
    if (match) {
      const amountStr = match[1].replace(/,/g, '')
      const amount = parseFloat(amountStr)
      if (!isNaN(amount) && amount > 0) {
        extractedData.amount = amount
        break
      }
    }
  }
  
  // Extract date
  for (const pattern of extractionPatterns.date) {
    const match = cleanText.match(pattern)
    if (match) {
      const dateStr = match[1]
      // Parse various date formats
      const parsedDate = parseReceiptDate(dateStr)
      if (parsedDate) {
        extractedData.date = parsedDate.toISOString().split('T')[0]
        break
      }
    }
  }
  
  // Extract merchant name
  for (const pattern of extractionPatterns.merchant) {
    const match = cleanText.match(pattern)
    if (match) {
      const merchant = match[1].trim()
      if (merchant.length > 2 && merchant.length < 50) {
        extractedData.merchant = merchant
        break
      }
    }
  }
  
  // Extract payment method
  for (const pattern of extractionPatterns.paymentMethod) {
    const match = cleanText.match(pattern)
    if (match) {
      const method = match[1].toLowerCase().trim()
      extractedData.paymentMethod = mapPaymentMethod(method)
      if (extractedData.paymentMethod) break
    }
  }
  
  // Generate description if we have merchant
  if (extractedData.merchant) {
    extractedData.description = `Purchase at ${extractedData.merchant}`
  }
  
  return extractedData
}

// Parse various date formats
function parseReceiptDate(dateStr: string): Date | null {
  // Try different date formats
  const formats = [
    /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/, // DD-MM-YYYY or DD/MM/YYYY
    /(\d{2,4})[-/.](\d{1,2})[-/.](\d{1,2})/, // YYYY-MM-DD
  ]
  
  for (const format of formats) {
    const match = dateStr.match(format)
    if (match) {
      let day, month, year
      
      if (match[1].length === 4) {
        // YYYY-MM-DD format
        year = parseInt(match[1])
        month = parseInt(match[2]) - 1
        day = parseInt(match[3])
      } else {
        // DD-MM-YYYY format
        day = parseInt(match[1])
        month = parseInt(match[2]) - 1
        year = parseInt(match[3])
        
        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900
        }
      }
      
      const date = new Date(year, month, day)
      if (!isNaN(date.getTime())) {
        return date
      }
    }
  }
  
  return null
}

// Map payment method strings to enum values
function mapPaymentMethod(method: string): string | null {
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
    'gpay': 'UPI',
    'google pay': 'UPI',
    'wallet': 'WALLET',
    'net banking': 'NET_BANKING',
    'netbanking': 'NET_BANKING',
  }
  
  return mappings[method] || null
}

// Upload image to storage (mock implementation)
async function uploadToStorage(buffer: Buffer, filename: string): Promise<string> {
  // In production, upload to:
  // - AWS S3
  // - Google Cloud Storage
  // - Cloudinary
  // - Supabase Storage
  
  // Example with Cloudinary:
  /*
  const cloudinary = require('cloudinary').v2;
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'receipts', resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
  return result.secure_url;
  */
  
  // For now, return a mock URL
  return `https://storage.example.com/receipts/${filename}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has premium features for receipt scanning
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })
    
    if (subscription?.plan === 'FREE') {
      return NextResponse.json(
        { error: "Receipt scanning is a premium feature. Please upgrade your plan." },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const receiptFile = formData.get('receipt') as File
    
    if (!receiptFile) {
      return NextResponse.json(
        { error: "No receipt file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif']
    if (!validTypes.includes(receiptFile.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPG, PNG, or HEIC image." },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await receiptFile.arrayBuffer())
    
    // Perform OCR
    const ocrText = await performOCR(buffer, receiptFile.type)
    
    // Extract structured data
    const extractedData = extractReceiptData(ocrText)
    
    // Upload image to storage
    const filename = `${session.user.id}_${Date.now()}_${receiptFile.name}`
    const imageUrl = await uploadToStorage(buffer, filename)
    
    // Return processed data
    return NextResponse.json({
      success: true,
      imageUrl,
      ocrText, // For debugging
      extractedData,
      confidence: {
        amount: extractedData.amount ? 0.8 : 0,
        date: extractedData.date ? 0.7 : 0,
        merchant: extractedData.merchant ? 0.6 : 0,
        overall: extractedData.amount ? 0.7 : 0.3,
      }
    })
  } catch (error) {
    console.error("Error processing receipt:", error)
    return NextResponse.json(
      { error: "Failed to process receipt" },
      { status: 500 }
    )
  }
}