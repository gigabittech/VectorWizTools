import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { loadImage } from "@/lib/imageProcessing";
import { Grid3x3 } from "lucide-react";

const layouts = [
  { name: "2 Images - Horizontal", cols: 2, rows: 1 },
  { name: "2 Images - Vertical", cols: 1, rows: 2 },
  { name: "3 Images - Grid", cols: 2, rows: 2 },
  { name: "4 Images - Grid", cols: 2, rows: 2 },
  { name: "6 Images - Grid", cols: 3, rows: 2 },
  { name: "9 Images - Grid", cols: 3, rows: 3 },
];

export default function CollageMaker() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [selectedLayout, setSelectedLayout] = useState("4 Images - Grid");
  const [spacing, setSpacing] = useState(10);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setProcessedPreview(null);
  };

  const handleCreateCollage = async () => {
    if (files.length < 2) {
      toast({
        title: "Not Enough Images",
        description: "Please upload at least 2 images",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const layout = layouts.find(l => l.name === selectedLayout);
      if (!layout) throw new Error('Invalid layout');

      const images = await Promise.all(files.slice(0, layout.cols * layout.rows).map(f => loadImage(f.file)));
      
      const cellWidth = 400;
      const cellHeight = 400;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = layout.cols * cellWidth + spacing * (layout.cols + 1);
      canvas.height = layout.rows * cellHeight + spacing * (layout.rows + 1);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      images.forEach((img, idx) => {
        const col = idx % layout.cols;
        const row = Math.floor(idx / layout.cols);
        const x = spacing + col * (cellWidth + spacing);
        const y = spacing + row * (cellHeight + spacing);
        
        // Calculate scaling to fit cell
        const scale = Math.min(cellWidth / img.width, cellHeight / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const drawX = x + (cellWidth - drawWidth) / 2;
        const drawY = y + (cellHeight - drawHeight) / 2;
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      });

      canvas.toBlob((blob) => {
        if (blob) {
          setProcessedBlob(blob);
          setProcessedPreview(URL.createObjectURL(blob));
          setStatus("success");
          toast({
            title: "Success!",
            description: "Collage created successfully",
          });
        }
      }, 'image/png', 0.95);
    } catch (error) {
      setStatus("error");
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob) return;
    downloadFile(processedBlob, "collage.png");
  };

  return (
    <ToolLayout
      title="Collage Maker"
      description="Create beautiful photo collages online. Combine multiple images into stunning grid layouts."
      category="Image Tools"
      keywords={["collage maker", "photo collage", "image collage", "photo grid", "collage creator"]}
      howToSteps={[
        { name: "Upload Images", text: "Upload 2 or more images" },
        { name: "Choose Layout", text: "Select a collage layout" },
        { name: "Create", text: "Click Create Collage" },
        { name: "Download", text: "Download your collage" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Grid3x3 className="h-5 w-5 text-[#0B9F47]" />
            Upload Images
          </h2>
          <FileUploader
            accept="image/*"
            maxFiles={9}
            maxSize={50 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={true}
            allowedTypes={["image/jpeg", "image/png", "image/webp"]}
          />
          {files.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {files.length} image{files.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {files.length >= 2 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Collage Settings</h2>
            <div className="space-y-4">
              <div>
                <Label>Layout</Label>
                <Select value={selectedLayout} onValueChange={setSelectedLayout}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {layouts.map(layout => (
                      <SelectItem key={layout.name} value={layout.name}>
                        {layout.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Spacing: {spacing}px</Label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={spacing}
                  onChange={(e) => setSpacing(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleCreateCollage}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Create Collage
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Creating collage..."
            successMessage="Collage created successfully!"
            errorMessage="Failed to create collage. Please try again."
          />
        )}

        {processedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Your Collage</h2>
            <img src={processedPreview} alt="Collage" className="max-w-full h-auto rounded-lg mb-4" />
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Collage
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

