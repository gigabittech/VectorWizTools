import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { PDFDocument } from "pdf-lib";
import { Droplet } from "lucide-react";

export default function PDFWatermarkRemover() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
  };

  const handleRemove = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");
    toast({
      title: "Advanced Processing Required",
      description: "Watermark removal requires advanced image processing. This feature is coming soon.",
      variant: "default",
    });
    setStatus("idle");
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_no-watermark.pdf`);
  };

  return (
    <ToolLayout
      title="PDF Watermark Remover"
      description="Remove Watermark from PDF. Remove text and image watermarks from your PDF documents."
      category="PDF Tools"
      keywords={["remove watermark", "pdf watermark", "watermark remover", "remove stamp", "pdf cleaner"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file with watermarks" },
        { name: "Remove", text: "Click Remove Watermark" },
        { name: "Download", text: "Download your cleaned PDF" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Droplet className="h-5 w-5 text-[#0B9F47]" />
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
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Advanced watermark removal requires server-side image processing. This feature is coming soon.
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <Button
              onClick={handleRemove}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
              disabled={status === "processing"}
            >
              Remove Watermark
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

