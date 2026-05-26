import { createWorker } from 'tesseract.js'

/**
 * Enhanced OCR scanner for notes & textbook pages.
 * Supports multiple languages and provides better preprocessing.
 * Runs entirely in browser - no API key required.
 */
export async function scanImageText(file, onProgress, options = {}) {
  const {
    language = 'eng',
    oem = 3, // Default OEM (LSTM only)
    psm = 6, // Assume uniform block of text
    enhance = true, // Apply image preprocessing
  } = options

  const worker = await createWorker(language, oem, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round((m.progress || 0) * 100))
      }
    },
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
      imageToProcess = await preprocessImage(file)
    }

    const { data } = await worker.recognize(imageToProcess)
    
    // Post-process the text
    const cleanedText = postProcessText(data?.text || '')
    
    return cleanedText
  } catch (error) {
    console.error('OCR Error:', error)
    throw new Error(`OCR failed: ${error.message || 'Unknown error'}`)
  } finally {
    await worker.terminate()
  }
}

/**
 * Preprocess image for better OCR accuracy.
 * Converts to grayscale, increases contrast, and reduces noise.
 */
async function preprocessImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height

      // Draw image to canvas
      ctx.drawImage(img, 0, 0)

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
 */
export async function quickScan(file, onProgress) {
  return scanImageText(file, onProgress, {
    language: 'eng',
    enhance: true,
  })
}
