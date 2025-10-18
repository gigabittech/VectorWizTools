import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, File, Image as ImageIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
}

interface FileUploaderProps {
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  onFilesSelected: (files: UploadedFile[]) => void;
  multiple?: boolean;
  className?: string;
  allowedTypes?: string[];
  disabled?: boolean;
  "data-testid"?: string;
}

export default function FileUploader({
  accept = "image/*",
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB default
  onFilesSelected,
  multiple = true,
  className,
  allowedTypes = [],
  disabled = false,
  "data-testid": dataTestId = "file-upload-area",
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" exceeds maximum size of ${(maxSize / 1024 / 1024).toFixed(0)}MB`;
    }

    // Check allowed types if specified
    if (allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isAllowed = allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.substring(1);
        }
        return file.type.startsWith(type);
      });

      if (!isAllowed) {
        return `File type "${fileExtension}" is not allowed. Accepted types: ${allowedTypes.join(', ')}`;
      }
    }

    return null;
  };

  const createFilePreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
    return undefined;
  };

  const processFiles = async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Check max files limit
      if (files.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        break;
      }

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        continue;
      }

      // Create preview if image
      const preview = await createFilePreview(file);

      newFiles.push({
        file,
        id: `${Date.now()}-${i}`,
        preview,
      });
    }

    if (errors.length > 0) {
      setError(errors[0]);
      setTimeout(() => setError(""), 5000);
    } else {
      setError("");
    }

    if (newFiles.length > 0) {
      const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
      setFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const clearAll = () => {
    setFiles([]);
    onFilesSelected([]);
    setError("");
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area with Glassmorphism */}
      <div
        className={cn(
          "backdrop-blur-md bg-white/70 border-2 border-dashed rounded-xl transition-all cursor-pointer p-8",
          isDragging 
            ? "border-[#0B9F47] bg-green-50/50 shadow-lg" 
            : "border-white/40 hover:border-white/60 hover:bg-white/80",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        data-testid={dataTestId}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {isDragging ? "Drop files here" : "Drop files or click to upload"}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {multiple ? `Upload up to ${maxFiles} files` : "Upload a single file"}
            {" · "}
            Max {(maxSize / 1024 / 1024).toFixed(0)}MB per file
          </p>
          {allowedTypes.length > 0 && (
            <p className="text-xs text-gray-500">
              Accepted formats: {allowedTypes.join(', ')}
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
            data-testid="file-input"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="backdrop-blur-md bg-red-50/90 border border-red-200/60 text-red-700 px-4 py-3 rounded-lg" data-testid="error-message">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              Selected Files ({files.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              data-testid="clear-all-button"
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-2" data-testid="file-list">
            {files.map((uploadedFile) => (
              <div 
                key={uploadedFile.id} 
                className="backdrop-blur-md bg-white/70 border border-white/40 rounded-lg p-3 hover:bg-white/80 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-100/50 backdrop-blur-sm rounded flex items-center justify-center">
                        {getFileIcon(uploadedFile.file)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`file-name-${uploadedFile.id}`}>
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uploadedFile.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(uploadedFile.id);
                    }}
                    data-testid={`remove-file-${uploadedFile.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
