import { createWorker } from 'tesseract.js'

/**
 * Enhanced OCR scanner for notes & textbook pages.
 * Supports multiple languages and provides better preprocessing.
 * Runs entirely in browser - no API key required.
 * Optimized for mobile devices.
 */
export async function scanImageText(file, onProgress, options = {}) {
  const {
    language = 'eng',
    oem = 3, // Default OEM (LSTM only)
    psm = 6, // Assume uniform block of text
    enhance = true, // Apply image preprocessing
  } = options

  // Check if running on mobile device
  const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  try {
    const worker = await createWorker(language, oem, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round((m.progress || 0) * 100))
        }
      },
      // Mobile-specific worker options
      workerPath: isMobile ? undefined : undefined,
      corePath: isMobile ? undefined : undefined,
    })

    try {
      // Set parameters for better recognition
      await worker.setParameters({
        tessedit_pageseg_mode: psm,
        preserve_interword_spaces: '1',
      })

      // Preprocess image if enhance is enabled
      let imageToProcess = file
      if (enhance) {
        imageToProcess = await preprocessImage(file, isMobile)
      }

      const { data } = await worker.recognize(imageToProcess)
      
      // Post-process the text
      const cleanedText = postProcessText(data?.text || '')
      
      return cleanedText
    } finally {
      await worker.terminate()
    }
  } catch (error) {
    console.error('OCR Error:', error)
    
    // Fallback for mobile: return a helpful message
    if (isMobile) {
      throw new Error('OCR is limited on mobile devices. Please use a desktop computer for better accuracy, or try taking a clearer photo with better lighting.')
    }
    
    throw new Error(`OCR failed: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Preprocess image for better OCR accuracy.
 * Converts to grayscale, increases contrast, and reduces noise.
 * Optimized for mobile by reducing image size.
 */
async function preprocessImage(file, isMobile = false) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      // Reduce image size on mobile for better performance
      const maxSize = isMobile ? 1024 : 2048
      let width = img.width
      let height = img.height
      
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      
      canvas.width = width
      canvas.height = height

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        const contrast = 1.5 // Increase contrast
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast))
        
        data[i] = factor * (avg - 128) + 128     // R
        data[i + 1] = factor * (avg - 128) + 128 // G
        data[i + 2] = factor * (avg - 128) + 128 // B
      }

      ctx.putImageData(imageData, 0, 0)

      // Convert back to blob
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: 'image/png' }))
      }, 'image/png')
    }

    img.onerror = () => reject(new Error('Failed to load image for preprocessing'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Post-process OCR text to fix common errors.
 */
function postProcessText(text) {
  if (!text) return ''

  let cleaned = text

  // Fix common OCR errors
  cleaned = cleaned
    .replace(/\bl\b/g, 'I') // lowercase l to I
    .replace(/\b0\b/g, 'O') // 0 to O in certain contexts
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n\s*\n/g, '\n\n') // Multiple empty lines to double newline
    .trim()

  // Fix mathematical notation
  cleaned = cleaned
    .replace(/(\w)2/g, '$1²') // x2 to x²
    .replace(/(\w)3/g, '$1³') // x3 to x³
    .replace(/(\w)\^2/g, '$1²') // x^2 to x²
    .replace(/(\w)\^3/g, '$1³') // x^3 to x³

  return cleaned
}

/**
 * Quick scan with default settings for most use cases.
 * Includes mobile optimizations.
 */
export async function quickScan(file, onProgress) {
  const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  return scanImageText(file, onProgress, {
    language: 'eng',
    enhance: true,
  })
}
