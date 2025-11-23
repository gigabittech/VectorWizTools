import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { PDFDocument, rgb } from "pdf-lib";
import { Droplet } from "lucide-react";

const positions = [
  { value: "center", label: "Center" },
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

export default function AddWatermarkPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [watermarkFile, setWatermarkFile] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [watermarkText, setWatermarkText] = useState("WATERMARK");
  const [position, setPosition] = useState("center");
  const [opacity, setOpacity] = useState([50]);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
  };

  const handleWatermarkFileSelected = (uploadedFiles: UploadedFile[]) => {
    setWatermarkFile(uploadedFiles);
  };

  const handleAddWatermark = async () => {
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
      const pageCount = pdf.getPageCount();

      for (let i = 0; i < pageCount; i++) {
        const page = pdf.getPage(i);
        const { width, height } = page.getSize();
        
        if (watermarkFile.length > 0) {
          // Image watermark
          try {
            const imageBytes = await watermarkFile[0].file.arrayBuffer();
            const image = await pdf.embedPng(new Uint8Array(imageBytes));
            const imageDims = image.scale(0.3);
            
            let x = 0;
            let y = 0;
            
            switch (position) {
              case "center":
                x = (width - imageDims.width) / 2;
                y = (height - imageDims.height) / 2;
                break;
              case "top-left":
                x = 50;
                y = height - imageDims.height - 50;
                break;
              case "top-right":
                x = width - imageDims.width - 50;
                y = height - imageDims.height - 50;
                break;
              case "bottom-left":
                x = 50;
                y = 50;
                break;
              case "bottom-right":
                x = width - imageDims.width - 50;
                y = 50;
                break;
            }
            
            page.drawImage(image, {
              x,
              y,
              width: imageDims.width,
              height: imageDims.height,
              opacity: opacity[0] / 100,
            });
          } catch (e) {
            // Fallback to text if image fails
            addTextWatermark(page, width, height);
          }
        } else {
          // Text watermark
          addTextWatermark(page, width, height);
        }
      }

      const newPdfBytes = await pdf.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      setProcessedBlob(blob);
      setStatus("success");
      toast({
        title: "Success!",
        description: "Watermark added successfully",
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const addTextWatermark = (page: any, width: number, height: number) => {
    let x = 0;
    let y = 0;
    
    switch (position) {
      case "center":
        x = width / 2;
        y = height / 2;
        break;
      case "top-left":
        x = 50;
        y = height - 50;
        break;
      case "top-right":
        x = width - 50;
        y = height - 50;
        break;
      case "bottom-left":
        x = 50;
        y = 50;
        break;
      case "bottom-right":
        x = width - 50;
        y = 50;
        break;
    }
    
    page.drawText(watermarkText, {
      x,
      y,
      size: 48,
      color: rgb(0.7, 0.7, 0.7),
      opacity: opacity[0] / 100,
      rotate: { angleRadians: -0.785 }, // 45 degrees
    });
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_watermarked.pdf`);
  };

  return (
    <ToolLayout
      title="Add Watermark"
      description="Stamp an image over your PDF. Add text or image watermarks to protect your PDF documents."
      category="PDF Tools"
      keywords={["add watermark", "pdf watermark", "watermark pdf", "protect pdf", "pdf stamp"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file" },
        { name: "Add Watermark", text: "Enter text or upload image watermark" },
        { name: "Set Options", text: "Choose position and opacity" },
        { name: "Apply", text: "Click Add Watermark" },
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
        </div>

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Watermark Settings</h2>
            <div className="space-y-4">
              <div>
                <Label>Watermark Text</Label>
                <Input
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Enter watermark text"
                />
              </div>
              <div>
                <Label>Or Upload Image Watermark (optional)</Label>
                <FileUploader
                  accept="image/*"
                  maxFiles={1}
                  maxSize={10 * 1024 * 1024}
                  onFilesSelected={handleWatermarkFileSelected}
                  multiple={false}
                  allowedTypes={["image/png", "image/jpeg"]}
                />
              </div>
              <div>
                <Label>Position</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(pos => (
                      <SelectItem key={pos.value} value={pos.value}>
                        {pos.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Opacity: {opacity[0]}%</Label>
                <Slider
                  value={opacity}
                  onValueChange={setOpacity}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
              <Button
                onClick={handleAddWatermark}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Add Watermark
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Adding watermark..."
            successMessage="Watermark added successfully!"
            errorMessage="Failed to add watermark. Please try again."
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

