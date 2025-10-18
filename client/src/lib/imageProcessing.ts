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
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
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
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/bmp'
  | 'image/gif';

export async function convertImageFormat(
  file: File,
  targetFormat: SupportedImageFormat,
  quality: number = 0.92
): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = img.width;
  canvas.height = img.height;

  // For JPEG and BMP, fill with white background (no transparency)
  if (targetFormat === 'image/jpeg' || targetFormat === 'image/bmp') {
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
      targetFormat,
      quality
    );
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
