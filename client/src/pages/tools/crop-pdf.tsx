import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { PDFDocument } from "pdf-lib";
import { Crop } from "lucide-react";

export default function CropPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [marginTop, setMarginTop] = useState(0);
  const [marginBottom, setMarginBottom] = useState(0);
  const [marginLeft, setMarginLeft] = useState(0);
  const [marginRight, setMarginRight] = useState(0);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
  };

  const handleCrop = async () => {
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
      const newPdf = await PDFDocument.create();

      for (let i = 0; i < pdf.getPageCount(); i++) {
        const [page] = await newPdf.copyPages(pdf, [i]);
        const { width, height } = page.getSize();
        
        // Set new page size with margins
        page.setSize(
          width - marginLeft - marginRight,
          height - marginTop - marginBottom
        );
        
        // Adjust content position
        page.translateContent(-marginLeft, -marginBottom);
        
        newPdf.addPage(page);
      }

      const newPdfBytes = await newPdf.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      setProcessedBlob(blob);
      setStatus("success");
      toast({
        title: "Success!",
        description: "PDF cropped successfully",
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Crop Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_cropped.pdf`);
  };

  return (
    <ToolLayout
      title="Crop PDF"
      description="Free PDF Cropper. Remove margins and crop your PDF pages to the desired size."
      category="PDF Tools"
      keywords={["crop pdf", "pdf cropper", "remove margins", "pdf crop", "trim pdf"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file" },
        { name: "Set Margins", text: "Enter margins to crop (in points)" },
        { name: "Crop", text: "Click Crop PDF" },
        { name: "Download", text: "Download your cropped PDF" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Crop className="h-5 w-5 text-[#0B9F47]" />
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
            <h2 className="text-xl font-bold mb-4">Crop Settings</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Top Margin (points)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={marginTop}
                    onChange={(e) => setMarginTop(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Bottom Margin (points)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={marginBottom}
                    onChange={(e) => setMarginBottom(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Left Margin (points)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={marginLeft}
                    onChange={(e) => setMarginLeft(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Right Margin (points)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={marginRight}
                    onChange={(e) => setMarginRight(Number(e.target.value))}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Enter margins in points (1 inch = 72 points). These will be cropped from each page.
              </p>
              <Button
                onClick={handleCrop}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Crop PDF
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Cropping PDF..."
            successMessage="PDF cropped successfully!"
            errorMessage="Failed to crop PDF. Please try again."
          />
        )}

        {processedBlob && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Cropped PDF
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

