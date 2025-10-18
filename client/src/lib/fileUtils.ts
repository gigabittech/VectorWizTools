export interface FileInfo {
  name: string;
  type: string;
  size: number;
  extension: string;
  isImage: boolean;
  isPDF: boolean;
  isDocument: boolean;
}

export function getFileInfo(file: File): FileInfo {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    extension,
    isImage: isImageFile(file),
    isPDF: file.type === 'application/pdf',
    isDocument: isDocumentFile(file),
  };
}

export function isImageFile(file: File): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'ico', 'heic', 'heif'];
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return file.type.startsWith('image/') || imageExtensions.includes(extension);
}

export function isVectorFile(file: File): boolean {
  const vectorExtensions = ['svg', 'ai', 'eps', 'pdf'];
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return vectorExtensions.includes(extension);
}

export function isRasterFile(file: File): boolean {
  const rasterExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'heic', 'heif'];
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return rasterExtensions.includes(extension);
}

export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function isDocumentFile(file: File): boolean {
  const documentTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  
  const documentExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'];
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  return documentTypes.includes(file.type) || documentExtensions.includes(extension);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  return allowedTypes.some(type => {
    // Check MIME type
    if (type.includes('/')) {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', ''));
      }
      return file.type === type;
    }
    // Check extension
    return extension === type.replace('.', '');
  });
}

export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function createDownloadLink(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
  let blob: Blob;
  
  if (content instanceof Blob) {
    blob = content;
  } else {
    blob = new Blob([content], { type: mimeType || 'text/plain' });
  }
  
  createDownloadLink(blob, filename);
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('File is not an image'));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

export function changeFileExtension(filename: string, newExtension: string): string {
  const parts = filename.split('.');
  parts.pop();
  return `${parts.join('.')}.${newExtension.replace('.', '')}`;
}
