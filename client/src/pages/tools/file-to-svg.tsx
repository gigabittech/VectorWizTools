import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { loadImage } from "@/lib/imageProcessing";
import { FileCode } from "lucide-react";

export default function FileToSVG() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setProcessedPreview(null);
  };

  const handleConvertToSVG = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const img = await loadImage(files[0].file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Convert to base64
      const base64 = canvas.toDataURL('image/png');

      // Create SVG with embedded image
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${img.width}" height="${img.height}" xmlns="http://www.w3.org/2000/svg">
  <image href="${base64}" width="${img.width}" height="${img.height}"/>
</svg>`;

      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      setProcessedBlob(blob);
      setProcessedPreview(URL.createObjectURL(blob));
      setStatus("success");
      toast({
        title: "Success!",
        description: "File converted to SVG",
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}.svg`);
  };

  return (
    <ToolLayout
      title="File to SVG"
      description="Convert images and files to SVG vector format. Create scalable vector graphics from raster images."
      category="Image Tools"
      keywords={["file to svg", "convert to svg", "image to svg", "svg converter", "vector conversion"]}
      howToSteps={[
        { name: "Upload File", text: "Upload an image file to convert" },
        { name: "Convert", text: "Click Convert to SVG" },
        { name: "Download", text: "Download your SVG file" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileCode className="h-5 w-5 text-[#0B9F47]" />
            Upload File
          </h2>
          <FileUploader
            accept="image/*"
            maxFiles={1}
            maxSize={50 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]}
          />
        </div>

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <Button
              onClick={handleConvertToSVG}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
              disabled={status === "processing"}
            >
              Convert to SVG
            </Button>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Converting to SVG..."
            successMessage="File converted to SVG!"
            errorMessage="Failed to convert. Please try again."
          />
        )}

        {processedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Result</h2>
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <img src={processedPreview} alt="SVG" className="max-w-full h-auto" />
            </div>
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download SVG File
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

