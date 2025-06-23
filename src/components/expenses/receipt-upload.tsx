'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CameraIcon, UploadIcon, XIcon, FileTextIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface ReceiptData {
  merchant?: string
  amount?: number
  date?: string
  description?: string
  paymentMethod?: string
}

interface ReceiptUploadProps {
  onReceiptProcessed: (data: ReceiptData) => void
  onImageUploaded?: (url: string) => void
  existingReceiptUrl?: string
}

export function ReceiptUpload({ 
  onReceiptProcessed, 
  onImageUploaded,
  existingReceiptUrl 
}: ReceiptUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(existingReceiptUrl || null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Process the receipt
    await processReceipt(file)
  }, [])

  // Process receipt with OCR
  const processReceipt = async (file: File) => {
    setIsProcessing(true)
    setUploadProgress(0)

    try {
      // Create form data
      const formData = new FormData()
      formData.append('receipt', file)

      // Upload and process receipt
      const response = await fetch('/api/receipts/process', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process receipt')
      }

      const result = await response.json()
      
      // Notify parent component with extracted data
      if (result.extractedData) {
        onReceiptProcessed(result.extractedData)
        toast.success('Receipt processed successfully!')
      }

      // Notify about uploaded image URL
      if (result.imageUrl && onImageUploaded) {
        onImageUploaded(result.imageUrl)
      }
    } catch (error) {
      console.error('Error processing receipt:', error)
      toast.error('Failed to process receipt. Please try manual entry.')
    } finally {
      setIsProcessing(false)
      setUploadProgress(0)
    }
  }

  // Remove uploaded image
  const removeImage = () => {
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Receipt Upload</h3>
            {imagePreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeImage}
                disabled={isProcessing}
              >
                <XIcon className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>

          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Upload a receipt photo to automatically extract expense details
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {/* File upload button */}
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
                
                {/* Camera capture button (mobile) */}
                <Button
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  className="sm:hidden"
                >
                  <CameraIcon className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              <p className="text-xs text-gray-500 mt-4">
                Supported formats: JPG, PNG, HEIC • Max size: 5MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image preview */}
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Receipt preview"
                  className="w-full h-64 object-contain bg-gray-50 rounded-lg"
                />
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="loading-spinner mb-2" />
                      <p className="text-sm">Processing receipt...</p>
                      {uploadProgress > 0 && (
                        <div className="mt-2 w-48 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Processing tips */}
              {isProcessing && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    Tips for better results:
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Ensure the receipt is clearly visible</li>
                    <li>• Avoid shadows and glare</li>
                    <li>• Include the total amount and merchant name</li>
                    <li>• Keep text in focus</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}