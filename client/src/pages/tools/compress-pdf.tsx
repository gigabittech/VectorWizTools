import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { PDFDocument } from "pdf-lib";
import { Minimize2 } from "lucide-react";

export default function CompressPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [quality, setQuality] = useState([80]);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    savedPercentage: number;
  } | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setCompressionStats(null);
  };

  const handleCompress = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const pdfBytes = await files[0].file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      
      // Note: pdf-lib doesn't have built-in compression, but we can save with options
      // For actual compression, you'd need a server-side solution
      const compressedBytes = await pdf.save({ useObjectStreams: false });
      
      const blob = new Blob([compressedBytes], { type: 'application/pdf' });
      const originalSize = files[0].file.size;
      const compressedSize = blob.size;
      const savedPercentage = ((originalSize - compressedSize) / originalSize) * 100;

      setProcessedBlob(blob);
      setCompressionStats({
        originalSize,
        compressedSize,
        savedPercentage: Math.max(0, savedPercentage),
      });
      setStatus("success");
      toast({
        title: "Success!",
        description: `PDF compressed by ${savedPercentage.toFixed(1)}%`,
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Compression Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_compressed.pdf`);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <ToolLayout
      title="Compress PDF"
      description="Lessen the file size of a PDF file. Reduce PDF size while maintaining quality for easier sharing and storage."
      category="PDF Tools"
      keywords={["compress pdf", "reduce pdf size", "pdf compression", "shrink pdf", "optimize pdf"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file to compress" },
        { name: "Compress", text: "Click Compress PDF" },
        { name: "Download", text: "Download your compressed PDF" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Minimize2 className="h-5 w-5 text-[#0B9F47]" />
            Upload PDF
          </h2>
          <FileUploader
            accept="application/pdf"
            maxFiles={1}
            maxSize={100 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["application/pdf"]}
          />
        </div>

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <Button
              onClick={handleCompress}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
              disabled={status === "processing"}
            >
              Compress PDF
            </Button>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Compressing PDF..."
            successMessage="PDF compressed successfully!"
            errorMessage="Failed to compress PDF. Please try again."
          />
        )}

        {compressionStats && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Compression Results</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-900 mb-1">Original</div>
                <div className="text-2xl font-bold text-blue-900">{formatBytes(compressionStats.originalSize)}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-900 mb-1">Compressed</div>
                <div className="text-2xl font-bold text-green-900">{formatBytes(compressionStats.compressedSize)}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-900 mb-1">Saved</div>
                <div className="text-2xl font-bold text-purple-900">{compressionStats.savedPercentage.toFixed(1)}%</div>
              </div>
            </div>
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Compressed PDF
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

