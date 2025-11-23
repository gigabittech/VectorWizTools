import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { PDFDocument } from "pdf-lib";
import { loadImage } from "@/lib/imageProcessing";
import { FileImage } from "lucide-react";

export default function GIFToPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: "No Files",
        description: "Please upload GIF images",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const img = await loadImage(file.file);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageBytes = await new Promise<Uint8Array>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              blob.arrayBuffer().then(buffer => resolve(new Uint8Array(buffer)));
            }
          }, 'image/png');
        });

        const pdfImage = await pdfDoc.embedPng(imageBytes);
        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: img.width,
          height: img.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setProcessedBlob(blob);
      setStatus("success");
      toast({
        title: "Success!",
        description: "GIF images converted to PDF",
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
    if (!processedBlob) return;
    downloadFile(processedBlob, "images.pdf");
  };

  return (
    <ToolLayout
      title="GIF to PDF"
      description="Upload GIF images and receive as a PDF file. Convert GIF images to PDF format."
      category="PDF Tools"
      keywords={["gif to pdf", "convert gif", "gif converter", "images to pdf"]}
      howToSteps={[
        { name: "Upload Images", text: "Upload one or more GIF images" },
        { name: "Convert", text: "Click Convert to PDF" },
        { name: "Download", text: "Download your PDF file" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileImage className="h-5 w-5 text-[#0B9F47]" />
            Upload GIF Images
          </h2>
          <FileUploader
            accept="image/gif"
            maxFiles={50}
            maxSize={50 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={true}
            allowedTypes={["image/gif"]}
          />
          {files.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {files.length} image{files.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <Button
              onClick={handleConvert}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
              disabled={status === "processing"}
            >
              Convert to PDF
            </Button>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Converting to PDF..."
            successMessage="Converted successfully!"
            errorMessage="Failed to convert. Please try again."
          />
        )}

        {processedBlob && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download PDF
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

