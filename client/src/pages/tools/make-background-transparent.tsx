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
import { loadImage } from "@/lib/imageProcessing";
import { Eraser } from "lucide-react";

export default function MakeBackgroundTransparent() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [tolerance, setTolerance] = useState([30]);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setProcessedPreview(null);
  };

  const handleMakeTransparent = async () => {
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
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const tol = tolerance[0];

      // Get corner colors to determine background
      const corners = [
        { x: 0, y: 0 },
        { x: canvas.width - 1, y: 0 },
        { x: 0, y: canvas.height - 1 },
        { x: canvas.width - 1, y: canvas.height - 1 },
      ];

      const cornerColors = corners.map(corner => {
        const idx = (corner.y * canvas.width + corner.x) * 4;
        return {
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
        };
      });

      // Average corner colors to get background color
      const bgColor = {
        r: Math.round(cornerColors.reduce((sum, c) => sum + c.r, 0) / cornerColors.length),
        g: Math.round(cornerColors.reduce((sum, c) => sum + c.g, 0) / cornerColors.length),
        b: Math.round(cornerColors.reduce((sum, c) => sum + c.b, 0) / cornerColors.length),
      };

      // Make background transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const distance = Math.sqrt(
          Math.pow(r - bgColor.r, 2) +
          Math.pow(g - bgColor.g, 2) +
          Math.pow(b - bgColor.b, 2)
        );

        if (distance <= tol) {
          data[i + 3] = 0; // Make transparent
        }
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          setProcessedBlob(blob);
          setProcessedPreview(URL.createObjectURL(blob));
          setStatus("success");
          toast({
            title: "Success!",
            description: "Background made transparent",
          });
        }
      }, 'image/png', 1.0);
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
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_transparent.png`);
  };

  return (
    <ToolLayout
      title="Make Background Transparent"
      description="Remove backgrounds from images and make them transparent. Perfect for logos, product photos, and graphics."
      category="Image Tools"
      keywords={["transparent background", "remove background", "png transparent", "background removal", "transparent image"]}
      howToSteps={[
        { name: "Upload Image", text: "Upload an image with a solid background" },
        { name: "Adjust Tolerance", text: "Adjust tolerance to fine-tune background removal" },
        { name: "Process", text: "Click Make Transparent to process" },
        { name: "Download", text: "Download your image with transparent background" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Eraser className="h-5 w-5 text-[#0B9F47]" />
            Upload Image
          </h2>
          <FileUploader
            accept="image/*"
            maxFiles={1}
            maxSize={50 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["image/jpeg", "image/png", "image/webp"]}
          />
        </div>

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Transparency Settings</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Tolerance: {tolerance[0]}</Label>
                </div>
                <Slider
                  value={tolerance}
                  onValueChange={setTolerance}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Lower values remove only exact background color. Higher values remove similar colors. Adjust if edges look jagged or too much is removed.
                </p>
              </div>

              <Button
                onClick={handleMakeTransparent}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Make Background Transparent
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Making background transparent..."
            successMessage="Background made transparent!"
            errorMessage="Failed to process. Please try again."
          />
        )}

        {processedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Result</h2>
            <div className="bg-gray-200 p-4 rounded-lg mb-4 inline-block">
              <img src={processedPreview} alt="Transparent" className="max-w-full h-auto" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Gray background shows transparency. Download as PNG to preserve transparency.
            </p>
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Transparent Image
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

