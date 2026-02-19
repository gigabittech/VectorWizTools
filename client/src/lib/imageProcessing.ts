import { jsPDF } from "jspdf";
import heic2any from "heic2any";

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  quality?: number; // 0-1 for lossy formats
}

export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function loadImage(file: File): Promise<HTMLImageElement> {
  let processingFile = file;

  // Jodi file-ti HEIC hoy, seta-ke prothome JPG-te convert kore nite hobe
  if (file.name.toLowerCase().endsWith(".heic") || file.type === "image/heic") {
    const convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });
    processingFile = new File(
      [Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob],
      "temp.jpg",
      { type: "image/jpeg" }
    );
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(processingFile);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image. Ensure it's a valid format."));
    };

    img.src = url;
  });
}

export async function resizeImage(
  file: File,
  options: ResizeOptions
): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  let { width, height } = options;
  const { maintainAspectRatio = true, quality = 0.92 } = options;

  if (maintainAspectRatio) {
    const aspectRatio = img.width / img.height;

    if (width && !height) {
      height = Math.round(width / aspectRatio);
    } else if (height && !width) {
      width = Math.round(height * aspectRatio);
    } else if (width && height) {
      const targetRatio = width / height;
      if (targetRatio > aspectRatio) {
        width = Math.round(height * aspectRatio);
      } else {
        height = Math.round(width / aspectRatio);
      }
    }
  }

  canvas.width = width || img.width;
  canvas.height = height || img.height;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      file.type,
      quality
    );
  });
}

export async function cropImage(file: File, options: CropOptions): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = options.width;
  canvas.height = options.height;

  ctx.drawImage(
    img,
    options.x,
    options.y,
    options.width,
    options.height,
    0,
    0,
    options.width,
    options.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      file.type,
      0.92
    );
  });
}

export type SupportedImageFormat =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/bmp"
  | "image/gif"
  | "image/svg+xml"
  | "application/pdf";

export async function convertImageFormat(
  file: File,
  targetFormat: SupportedImageFormat,
  quality: number = 0.92
): Promise<Blob> {
  // SVG output logic (Very basic: Wraps image in SVG tag)
  if (targetFormat === "image/svg+xml") {
    const img = await loadImage(file);
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${img.width}" height="${img.height}">
        <image href="${await fileToBase64(file)}" width="${img.width}" height="${img.height}" />
      </svg>`;
    return new Blob([svgString], { type: "image/svg+xml" });
  }

  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not get canvas context");

  canvas.width = img.width;
  canvas.height = img.height;

  // JPEG/BMP er jonno white background (karoon eigulo transparency support kore na)
  if (targetFormat === "image/jpeg" || targetFormat === "image/bmp") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  // PDF output logic
  if (targetFormat === "application/pdf") {
    const imgData = canvas.toDataURL("image/jpeg", quality);
    const pdf = new jsPDF({
      orientation: img.width > img.height ? "l" : "p",
      unit: "px",
      format: [img.width, img.height],
    });
    pdf.addImage(imgData, "JPEG", 0, 0, img.width, img.height);
    return pdf.output("blob");
  }

  // Standard image logic
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      targetFormat,
      quality
    );
  });
}

// Helper to handle SVG conversion
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function rotateImage(file: File, degrees: number): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const radians = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  canvas.width = img.width * cos + img.height * sin;
  canvas.height = img.width * sin + img.height * cos;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      file.type,
      0.92
    );
  });
}

export async function flipImage(file: File, direction: 'horizontal' | 'vertical'): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = img.width;
  canvas.height = img.height;

  if (direction === 'horizontal') {
    ctx.scale(-1, 1);
    ctx.drawImage(img, -canvas.width, 0);
  } else {
    ctx.scale(1, -1);
    ctx.drawImage(img, 0, -canvas.height);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      file.type,
      0.92
    );
  });
}

export async function compressImage(file: File, quality: number = 0.7): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = img.width;
  canvas.height = img.height;

  // For better compression, convert to JPEG if not already
  const outputType = file.type === 'image/png' || file.type === 'image/jpeg'
    ? file.type
    : 'image/jpeg';

  if (outputType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      outputType,
      quality
    );
  });
}

export function calculateAspectRatio(width: number, height: number): { ratio: number; formatted: string } {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);

  return {
    ratio: width / height,
    formatted: `${width / divisor}:${height / divisor}`,
  };
}

export function calculateNewDimensions(
  currentWidth: number,
  currentHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  maintainAspectRatio: boolean = true
): ImageDimensions {
  if (!maintainAspectRatio) {
    return {
      width: targetWidth || currentWidth,
      height: targetHeight || currentHeight,
    };
  }

  const aspectRatio = currentWidth / currentHeight;

  if (targetWidth && !targetHeight) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  }

  if (targetHeight && !targetWidth) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight,
    };
  }

  if (targetWidth && targetHeight) {
    const targetRatio = targetWidth / targetHeight;
    if (targetRatio > aspectRatio) {
      return {
        width: Math.round(targetHeight * aspectRatio),
        height: targetHeight,
      };
    } else {
      return {
        width: targetWidth,
        height: Math.round(targetWidth / aspectRatio),
      };
    }
  }

  return { width: currentWidth, height: currentHeight };
}

export interface FilterOptions {
  brightness?: number; // 0-200, 100 = normal
  contrast?: number; // 0-200, 100 = normal
  saturation?: number; // 0-200, 100 = normal
  blur?: number; // 0-20 pixels
  grayscale?: boolean;
  sepia?: boolean;
  invert?: boolean;
}

export async function applyFilters(file: File, filters: FilterOptions): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = img.width;
  canvas.height = img.height;

  // Build filter string
  const filterParts: string[] = [];

  if (filters.brightness !== undefined && filters.brightness !== 100) {
    filterParts.push(`brightness(${filters.brightness}%)`);
  }

  if (filters.contrast !== undefined && filters.contrast !== 100) {
    filterParts.push(`contrast(${filters.contrast}%)`);
  }

  if (filters.saturation !== undefined && filters.saturation !== 100) {
    filterParts.push(`saturate(${filters.saturation}%)`);
  }

  if (filters.blur !== undefined && filters.blur > 0) {
    filterParts.push(`blur(${filters.blur}px)`);
  }

  if (filters.grayscale) {
    filterParts.push('grayscale(100%)');
  }

  if (filters.sepia) {
    filterParts.push('sepia(100%)');
  }

  if (filters.invert) {
    filterParts.push('invert(100%)');
  }

  ctx.filter = filterParts.join(' ');
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      file.type,
      0.92
    );
  });
}

export interface WatermarkOptions {
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  opacity?: number; // 0-1
  rotation?: number; // degrees
  padding?: number; // pixels from edge
}

export interface ImageWatermarkOptions {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity?: number; // 0-1
  scale?: number; // 0-1, percentage of main image size
  padding?: number; // pixels from edge
}

export async function addTextWatermark(
  file: File,
  options: WatermarkOptions
): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = img.width;
  canvas.height = img.height;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Configure watermark
  const {
    text,
    position,
    fontSize = Math.max(20, img.width / 30),
    fontFamily = 'Arial',
    color = '#FFFFFF',
    opacity = 0.5,
    rotation = 0,
    padding = 20,
  } = options;

  ctx.font = `${fontSize}px ${fontFamily}`;
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  // Calculate position
  let x = 0;
  let y = 0;

  switch (position) {
    case 'top-left':
      x = padding;
      y = padding + textHeight;
      break;
    case 'top-right':
      x = canvas.width - textWidth - padding;
      y = padding + textHeight;
      break;
    case 'bottom-left':
      x = padding;
      y = canvas.height - padding;
      break;
    case 'bottom-right':
      x = canvas.width - textWidth - padding;
      y = canvas.height - padding;
      break;
    case 'center':
      x = (canvas.width - textWidth) / 2;
      y = (canvas.height + textHeight) / 2;
      break;
  }

  // Apply rotation if specified
  if (rotation !== 0) {
    ctx.save();
    ctx.translate(x + textWidth / 2, y - textHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-(x + textWidth / 2), -(y - textHeight / 2));
  }

  // Draw watermark
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillText(text, x, y);

  if (rotation !== 0) {
    ctx.restore();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      file.type,
      0.92
    );
  });
}

export async function addImageWatermark(
  file: File,
  watermarkFile: File,
  options: ImageWatermarkOptions
): Promise<Blob> {
  const img = await loadImage(file);
  const watermarkImg = await loadImage(watermarkFile);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = img.width;
  canvas.height = img.height;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Configure watermark
  const {
    position,
    opacity = 0.5,
    scale = 0.2,
    padding = 20,
  } = options;

  // Calculate watermark size
  const watermarkWidth = Math.min(img.width * scale, watermarkImg.width);
  const watermarkHeight = (watermarkWidth / watermarkImg.width) * watermarkImg.height;

  // Calculate position
  let x = 0;
  let y = 0;

  switch (position) {
    case 'top-left':
      x = padding;
      y = padding;
      break;
    case 'top-right':
      x = canvas.width - watermarkWidth - padding;
      y = padding;
      break;
    case 'bottom-left':
      x = padding;
      y = canvas.height - watermarkHeight - padding;
      break;
    case 'bottom-right':
      x = canvas.width - watermarkWidth - padding;
      y = canvas.height - watermarkHeight - padding;
      break;
    case 'center':
      x = (canvas.width - watermarkWidth) / 2;
      y = (canvas.height - watermarkHeight) / 2;
      break;
  }

  // Draw watermark with opacity
  ctx.globalAlpha = opacity;
  ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight);
  ctx.globalAlpha = 1.0;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      file.type,
      0.92
    );
  });
}

export interface BorderOptions {
  width: number; // pixels
  color: string;
  padding?: number; // inner padding
  shadowBlur?: number;
  shadowColor?: string;
}

export async function addBorder(
  file: File,
  options: BorderOptions
): Promise<Blob> {
  const img = await loadImage(file);
  const {
    width: borderWidth,
    color,
    padding = 0,
    shadowBlur = 0,
    shadowColor = '#000000',
  } = options;

  const totalPadding = borderWidth + padding;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = img.width + (totalPadding * 2);
  canvas.height = img.height + (totalPadding * 2);

  // Fill background with border color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add shadow if specified
  if (shadowBlur > 0) {
    ctx.shadowBlur = shadowBlur;
    ctx.shadowColor = shadowColor;
  }

  // Draw image with padding
  ctx.drawImage(img, totalPadding, totalPadding);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      file.type,
      0.92
    );
  });
}

export async function extractColors(file: File, colorCount: number = 5): Promise<string[]> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Resize to smaller size for faster processing
  const maxSize = 200;
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const colorMap = new Map<string, number>();

  // Sample pixels (every 10th pixel for performance)
  for (let i = 0; i < pixels.length; i += 40) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    // Skip transparent pixels
    if (a < 128) continue;

    // Quantize colors to reduce variation
    const qr = Math.round(r / 10) * 10;
    const qg = Math.round(g / 10) * 10;
    const qb = Math.round(b / 10) * 10;

    const colorKey = `${qr},${qg},${qb}`;
    colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
  }

  // Sort by frequency and get top colors
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, colorCount)
    .map(([color]) => {
      const [r, g, b] = color.split(',').map(Number);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    });

  return sortedColors;
}

export interface UpscaleOptions {
  factor: number; // 2, 3, 4, etc.
  quality?: number; // 0-1 for lossy formats
}

export async function upscaleImage(
  file: File,
  options: UpscaleOptions
): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const { factor, quality = 0.95 } = options;

  // Calculate new dimensions
  const newWidth = Math.round(img.width * factor);
  const newHeight = Math.round(img.height * factor);

  // Check for reasonable limits (max 8192px on any side)
  const maxDimension = 8192;
  if (newWidth > maxDimension || newHeight > maxDimension) {
    throw new Error(`Upscaled image would exceed maximum dimension of ${maxDimension}px. Please use a smaller scale factor.`);
  }

  canvas.width = newWidth;
  canvas.height = newHeight;

  // Enable high-quality image smoothing for better upscaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the image scaled up
  ctx.drawImage(img, 0, 0, newWidth, newHeight);

  // Determine output format (preserve original format, default to PNG for transparency)
  const outputType = file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp'
    ? file.type
    : 'image/png';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      outputType,
      quality
    );
  });
}

export interface WatermarkRemovalOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  blendRadius?: number; // How far to look for source pixels (default: 20)
}

export async function removeWatermark(
  file: File,
  options: WatermarkRemovalOptions
): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = img.width;
  canvas.height = img.height;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  const { x, y, width, height, blendRadius = 40 } = options;

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Create a copy for reading original pixels (never modified)
  const originalData = new Uint8ClampedArray(data);

  // Process all pixels in the watermark area
  for (let py = y; py < y + height; py++) {
    for (let px = x; px < x + width; px++) {
      if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue;

      const idx = (py * canvas.width + px) * 4;

      // Find nearby pixels OUTSIDE the watermark area
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
      let totalWeight = 0;

      // Sample pixels around the current pixel
      for (let dy = -blendRadius; dy <= blendRadius; dy++) {
        for (let dx = -blendRadius; dx <= blendRadius; dx++) {
          const sampleX = px + dx;
          const sampleY = py + dy;

          // Skip if outside image bounds
          if (sampleX < 0 || sampleX >= canvas.width || sampleY < 0 || sampleY >= canvas.height) continue;

          // CRITICAL: Only use pixels OUTSIDE the watermark area
          const isInsideWatermark = sampleX >= x && sampleX < x + width && sampleY >= y && sampleY < y + height;
          if (isInsideWatermark) continue;

          // Calculate distance
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > blendRadius) continue;

          // Weight: closer pixels have more influence, prefer pixels just outside watermark
          const distToWatermarkEdge = Math.min(
            Math.abs(sampleX - x),
            Math.abs(sampleX - (x + width)),
            Math.abs(sampleY - y),
            Math.abs(sampleY - (y + height))
          );

          // Higher weight for pixels closer to watermark edge (just outside)
          const edgeWeight = distToWatermarkEdge < 5 ? 3 : 1;
          const distanceWeight = 1 / (1 + dist * 0.1);
          const weight = edgeWeight * distanceWeight;

          const sampleIdx = (sampleY * canvas.width + sampleX) * 4;
          rSum += originalData[sampleIdx] * weight;
          gSum += originalData[sampleIdx + 1] * weight;
          bSum += originalData[sampleIdx + 2] * weight;
          aSum += originalData[sampleIdx + 3] * weight;
          totalWeight += weight;
        }
      }

      // Apply the new pixel value
      if (totalWeight > 0) {
        data[idx] = Math.round(rSum / totalWeight);
        data[idx + 1] = Math.round(gSum / totalWeight);
        data[idx + 2] = Math.round(bSum / totalWeight);
        data[idx + 3] = Math.round(aSum / totalWeight);
      } else {
        // Fallback: use nearest pixel outside watermark
        let found = false;
        for (let radius = 1; radius <= blendRadius * 2 && !found; radius++) {
          for (let dy = -radius; dy <= radius && !found; dy++) {
            for (let dx = -radius; dx <= radius && !found; dx++) {
              const sampleX = px + dx;
              const sampleY = py + dy;
              if (sampleX < 0 || sampleX >= canvas.width || sampleY < 0 || sampleY >= canvas.height) continue;

              const isInsideWatermark = sampleX >= x && sampleX < x + width && sampleY >= y && sampleY < y + height;
              if (isInsideWatermark) continue;

              const sampleIdx = (sampleY * canvas.width + sampleX) * 4;
              data[idx] = originalData[sampleIdx];
              data[idx + 1] = originalData[sampleIdx + 1];
              data[idx + 2] = originalData[sampleIdx + 2];
              data[idx + 3] = originalData[sampleIdx + 3];
              found = true;
            }
          }
        }
      }
    }
  }

  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);

  // Second pass: refine the result using the inpainted pixels
  const refinedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const refinedData = refinedImageData.data;

  for (let py = y; py < y + height; py++) {
    for (let px = x; px < x + width; px++) {
      if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue;

      const idx = (py * canvas.width + px) * 4;

      // Blend with surrounding pixels (now including already-inpainted ones)
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
      let totalWeight = 0;

      for (let dy = -20; dy <= 20; dy++) {
        for (let dx = -20; dx <= 20; dx++) {
          const sampleX = px + dx;
          const sampleY = py + dy;

          if (sampleX < 0 || sampleX >= canvas.width || sampleY < 0 || sampleY >= canvas.height) continue;

          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 20) continue;

          // Prefer pixels outside watermark, but also use nearby inpainted pixels
          const isInsideWatermark = sampleX >= x && sampleX < x + width && sampleY >= y && sampleY < y + height;
          const weight = isInsideWatermark ? (1 / (1 + dist * 0.5)) : (1 / (1 + dist * 0.1)) * 2;

          const sampleIdx = (sampleY * canvas.width + sampleX) * 4;
          rSum += refinedData[sampleIdx] * weight;
          gSum += refinedData[sampleIdx + 1] * weight;
          bSum += refinedData[sampleIdx + 2] * weight;
          aSum += refinedData[sampleIdx + 3] * weight;
          totalWeight += weight;
        }
      }

      if (totalWeight > 0) {
        refinedData[idx] = Math.round(rSum / totalWeight);
        refinedData[idx + 1] = Math.round(gSum / totalWeight);
        refinedData[idx + 2] = Math.round(bSum / totalWeight);
        refinedData[idx + 3] = Math.round(aSum / totalWeight);
      }
    }
  }

  ctx.putImageData(refinedImageData, 0, 0);

  // Determine output format
  const outputType = file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp'
    ? file.type
    : 'image/png';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      outputType,
      0.95
    );
  });
}
