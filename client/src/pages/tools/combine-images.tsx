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
import { Layers } from "lucide-react";

const layoutOptions = [
  { value: "horizontal", label: "Horizontal (Side by Side)" },
  { value: "vertical", label: "Vertical (Stacked)" },
  { value: "grid", label: "Grid" },
];

export default function CombineImages() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [layout, setLayout] = useState("horizontal");
  const [spacing, setSpacing] = useState(0);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setProcessedPreview(null);
  };

  const handleCombine = async () => {
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
      const images = await Promise.all(files.map(f => loadImage(f.file)));
      
      let canvas: HTMLCanvasElement;
      let ctx: CanvasRenderingContext2D;

      if (layout === "horizontal") {
        const totalWidth = images.reduce((sum, img) => sum + img.width, 0) + spacing * (images.length - 1);
        const maxHeight = Math.max(...images.map(img => img.height));
        
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d')!;
        canvas.width = totalWidth;
        canvas.height = maxHeight;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        let x = 0;
        images.forEach((img, idx) => {
          const y = (maxHeight - img.height) / 2;
          ctx.drawImage(img, x, y);
          x += img.width + spacing;
        });
      } else if (layout === "vertical") {
        const maxWidth = Math.max(...images.map(img => img.width));
        const totalHeight = images.reduce((sum, img) => sum + img.height, 0) + spacing * (images.length - 1);
        
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d')!;
        canvas.width = maxWidth;
        canvas.height = totalHeight;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        let y = 0;
        images.forEach((img, idx) => {
          const x = (maxWidth - img.width) / 2;
          ctx.drawImage(img, x, y);
          y += img.height + spacing;
        });
      } else { // grid
        const cols = Math.ceil(Math.sqrt(images.length));
        const rows = Math.ceil(images.length / cols);
        const maxWidth = Math.max(...images.map(img => img.width));
        const maxHeight = Math.max(...images.map(img => img.height));
        
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d')!;
        canvas.width = cols * maxWidth + spacing * (cols - 1);
        canvas.height = rows * maxHeight + spacing * (rows - 1);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        images.forEach((img, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const x = col * (maxWidth + spacing) + (maxWidth - img.width) / 2;
          const y = row * (maxHeight + spacing) + (maxHeight - img.height) / 2;
          ctx.drawImage(img, x, y);
        });
      }

      canvas.toBlob((blob) => {
        if (blob) {
          setProcessedBlob(blob);
          setProcessedPreview(URL.createObjectURL(blob));
          setStatus("success");
          toast({
            title: "Success!",
            description: "Images combined successfully",
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
    downloadFile(processedBlob, "combined-images.png");
  };

  return (
    <ToolLayout
      title="Combine Images"
      description="Merge multiple images together. Combine photos horizontally, vertically, or in a grid layout."
      category="Image Tools"
      keywords={["combine images", "merge images", "join images", "image collage", "combine photos"]}
      howToSteps={[
        { name: "Upload Images", text: "Upload 2 or more images to combine" },
        { name: "Choose Layout", text: "Select horizontal, vertical, or grid layout" },
        { name: "Combine", text: "Click Combine Images to merge" },
        { name: "Download", text: "Download your combined image" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#0B9F47]" />
            Upload Images
          </h2>
          <FileUploader
            accept="image/*"
            maxFiles={10}
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
            <h2 className="text-xl font-bold mb-4">Combine Settings</h2>
            <div className="space-y-4">
              <div>
                <Label>Layout</Label>
                <Select value={layout} onValueChange={setLayout}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {layoutOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
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
                onClick={handleCombine}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Combine Images
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Combining images..."
            successMessage="Images combined successfully!"
            errorMessage="Failed to combine images. Please try again."
          />
        )}

        {processedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Result</h2>
            <img src={processedPreview} alt="Combined" className="max-w-full h-auto rounded-lg mb-4" />
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Combined Image
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

