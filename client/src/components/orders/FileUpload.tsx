import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, FileText, X } from "lucide-react";
import type { UploadResult } from "@uppy/core";

interface FileUploadProps {
  files: Array<{ name: string; size: number; url: string }>;
  onFilesChange: (files: Array<{ name: string; size: number; url: string }>) => void;
}

export default function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const { toast } = useToast();

  const getUploadParametersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/files/presign");
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    },
  });

  const createFileMutation = useMutation({
    mutationFn: async (fileData: any) => {
      const response = await apiRequest("POST", "/api/files", fileData);
      return response.json();
    },
  });

  const handleGetUploadParameters = async () => {
    const result = await getUploadParametersMutation.mutateAsync();
    return result;
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFiles = result.successful.map((file) => ({
        name: file.name || "Unnamed file",
        size: file.size || 0,
        url: file.uploadURL || "",
      }));

      // Create file records in the database
      for (const file of uploadedFiles) {
        try {
          await createFileMutation.mutateAsync({
            name: file.name,
            size: file.size,
            mime: "application/octet-stream", // Would be determined from file
            storageKey: file.url,
            kind: "SOURCE",
          });
        } catch (error) {
          console.error("Failed to create file record:", error);
        }
      }

      const newFiles = [...files, ...uploadedFiles];
      onFilesChange(newFiles);

      toast({
        title: "Files uploaded successfully",
        description: `${uploadedFiles.length} file(s) have been uploaded.`,
      });
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div data-testid="file-upload">
      <h3 className="text-xl font-semibold mb-6">Upload Your Files</h3>
      
      <Card className="file-upload-zone bg-muted/30 border-2 border-dashed border-border rounded-2xl p-12 text-center mb-6">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CloudUpload className="h-8 w-8 text-primary" />
          </div>
          <h4 className="text-lg font-semibold mb-2">Drop files here or click to browse</h4>
          <p className="text-muted-foreground mb-4">
            Support for JPG, PNG, PDF, AI, EPS up to 50MB each
          </p>
          
          <ObjectUploader
            maxNumberOfFiles={10}
            maxFileSize={50 * 1024 * 1024} // 50MB
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="gradient-primary text-white"
          >
            Choose Files
          </ObjectUploader>
        </div>
      </Card>

      {files.length > 0 && (
        <div className="space-y-3" data-testid="uploaded-files">
          <h4 className="font-medium">Uploaded Files ({files.length})</h4>
          {files.map((file, index) => (
            <Card key={index} className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium" data-testid={`file-name-${index}`}>
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid={`file-size-${index}`}>
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
                className="text-destructive hover:text-destructive/80"
                data-testid={`remove-file-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
