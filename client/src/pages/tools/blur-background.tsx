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
import { applyFilters } from "@/lib/imageProcessing";
import { Sparkles } from "lucide-react";

export default function BlurBackground() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [blurAmount, setBlurAmount] = useState([10]);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setProcessedPreview(null);
  };

  const handleBlurBackground = async () => {
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
      const blob = await applyFilters(files[0].file, {
        blur: blurAmount[0],
      });

      setProcessedBlob(blob);
      setProcessedPreview(URL.createObjectURL(blob));
      setStatus("success");
      toast({
        title: "Success!",
        description: "Background blurred successfully",
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
    downloadFile(processedBlob, `${baseName}_blurred.${extension}`);
  };

  return (
    <ToolLayout
      title="Blur Background Tool"
      description="Blur image backgrounds to create depth-of-field effects. Perfect for portrait photos and product images."
      category="Image Tools"
      keywords={["blur background", "depth of field", "bokeh effect", "background blur", "portrait blur"]}
      howToSteps={[
        { name: "Upload Image", text: "Upload an image with a background to blur" },
        { name: "Adjust Blur", text: "Use the slider to adjust blur intensity" },
        { name: "Apply Blur", text: "Click Blur Background to process" },
        { name: "Download", text: "Download your blurred image" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#0B9F47]" />
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
            <h2 className="text-xl font-bold mb-4">Blur Settings</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Blur Amount: {blurAmount[0]}px</Label>
                </div>
                <Slider
                  value={blurAmount}
                  onValueChange={setBlurAmount}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Higher values create more blur. Recommended: 5-20px for subtle effects, 20-50px for strong blur.
                </p>
              </div>

              <Button
                onClick={handleBlurBackground}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Blur Background
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Blurring background..."
            successMessage="Background blurred successfully!"
            errorMessage="Failed to blur background. Please try again."
          />
        )}

        {processedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Result</h2>
            <img src={processedPreview} alt="Blurred" className="max-w-full h-auto rounded-lg mb-4" />
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Blurred Image
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

