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
import { loadImage, applyFilters } from "@/lib/imageProcessing";
import { Palette } from "lucide-react";

export default function ColorizePhoto() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [saturation, setSaturation] = useState([150]);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setProcessedPreview(null);
  };

  const handleColorize = async () => {
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
      // Convert to grayscale first, then add color
      const grayscaleBlob = await applyFilters(files[0].file, { grayscale: true });
      const grayscaleFile = new File([grayscaleBlob], files[0].file.name, { type: files[0].file.type });
      
      // Apply saturation to add color back
      const blob = await applyFilters(grayscaleFile, {
        saturation: saturation[0],
      });

      setProcessedBlob(blob);
      setProcessedPreview(URL.createObjectURL(blob));
      setStatus("success");
      toast({
        title: "Success!",
        description: "Photo colorized successfully",
      });
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
    const extension = originalName.split('.').pop() || 'png';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_colorized.${extension}`);
  };

  return (
    <ToolLayout
      title="Colorize Photo"
      description="Add color to black and white photos. Enhance vintage photos with realistic colorization."
      category="Image Tools"
      keywords={["colorize photo", "colorize black and white", "add color to photo", "photo colorization", "vintage photo color"]}
      howToSteps={[
        { name: "Upload Photo", text: "Upload a black and white or grayscale photo" },
        { name: "Adjust Saturation", text: "Use the slider to adjust color intensity" },
        { name: "Colorize", text: "Click Colorize Photo to process" },
        { name: "Download", text: "Download your colorized photo" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5 text-[#0B9F47]" />
            Upload Photo
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
            <h2 className="text-xl font-bold mb-4">Colorization Settings</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Saturation: {saturation[0]}%</Label>
                </div>
                <Slider
                  value={saturation}
                  onValueChange={setSaturation}
                  min={100}
                  max={300}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Higher values add more color. 100% = original, 150-200% = enhanced color, 200-300% = vibrant color.
                </p>
              </div>

              <Button
                onClick={handleColorize}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Colorize Photo
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Colorizing photo..."
            successMessage="Photo colorized successfully!"
            errorMessage="Failed to colorize photo. Please try again."
          />
        )}

        {processedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Result</h2>
            <img src={processedPreview} alt="Colorized" className="max-w-full h-auto rounded-lg mb-4" />
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Colorized Photo
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

