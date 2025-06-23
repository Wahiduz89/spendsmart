// /src/app/api/receipts/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getOCRService } from "@/lib/services/ocr-service";
import { getStorageService } from "@/lib/services/storage-service";

export async function GET(request: NextRequest) {
  try {
    // Test OCR service availability
    const ocrService = getOCRService();
    
    // Test storage service availability
    const storageService = getStorageService();
    
    return NextResponse.json({
      status: "ready",
      services: {
        ocr: ocrService.constructor.name,
        storage: storageService.constructor.name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}