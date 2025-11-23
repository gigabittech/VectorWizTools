import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { upscaleImage } from "@/lib/imageProcessing";
import { downloadFile, getImageDimensions } from "@/lib/fileUtils";
import { Maximize2, ArrowUp } from "lucide-react";

export default function ImageUpscale() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [upscaleFactor, setUpscaleFactor] = useState([2]); // 2x, 3x, 4x, etc.
  const [upscaledBlob, setUpscaledBlob] = useState<Blob | null>(null);
  const [upscaledPreview, setUpscaledPreview] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [newDimensions, setNewDimensions] = useState<{ width: number; height: number } | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = async (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setUpscaledBlob(null);
    setUpscaledPreview(null);
    setNewDimensions(null);

    if (uploadedFiles.length > 0) {
      try {
        const dimensions = await getImageDimensions(uploadedFiles[0].file);
        setOriginalDimensions(dimensions);
        updateNewDimensions(dimensions, upscaleFactor[0]);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to read image dimensions",
          variant: "destructive",
        });
      }
    }
  };

  const updateNewDimensions = (original: { width: number; height: number }, factor: number) => {
    setNewDimensions({
      width: Math.round(original.width * factor),
      height: Math.round(original.height * factor),
    });
  };

  const handleFactorChange = (value: number[]) => {
    setUpscaleFactor(value);
    if (originalDimensions) {
      updateNewDimensions(originalDimensions, value[0]);
    }
  };

  const handleUpscale = async () => {
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
      const blob = await upscaleImage(files[0].file, {
        factor: upscaleFactor[0],
        quality: 0.95,
      });

      setUpscaledBlob(blob);
      const previewUrl = URL.createObjectURL(blob);
      setUpscaledPreview(previewUrl);

      setStatus("success");
      toast({
        title: "Success!",
        description: `Image upscaled ${upscaleFactor[0]}x successfully`,
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Upscale Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!upscaledBlob || files.length === 0) return;

    const originalName = files[0].file.name;
    const extension = originalName.split('.').pop() || 'png';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const newFilename = `${baseName}_upscaled_${upscaleFactor[0]}x.${extension}`;

    downloadFile(upscaledBlob, newFilename);
  };

  return (
    <ToolLayout
      title="Upscale Image"
      description="Increase image resolution and quality with AI-powered upscaling. Enlarge images up to 4x while maintaining quality. Free online image upscaler tool."
      category="Image Tools"
      keywords={["image upscale", "upscale image", "increase resolution", "enlarge image", "image enhancer", "super resolution"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image file" },
        { name: "Select Scale", text: "Choose upscale factor (2x, 3x, or 4x)" },
        { name: "Upscale", text: "Click the upscale button to process your image" },
        { name: "Download", text: "Download your upscaled high-resolution image" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Maximize2 className="h-5 w-5 text-[#0B9F47]" />
            Upload Image
          </h2>
          <div>
            <FileUploader
              accept="image/*"
              maxFiles={1}
              maxSize={50 * 1024 * 1024}
              onFilesSelected={handleFilesSelected}
              multiple={false}
              allowedTypes={["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]}
            />
          </div>
        </div>

        {/* Upscale Controls */}
        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-4">Upscale Settings</h2>
            <div className="space-y-6">
              {/* Original Dimensions */}
              {originalDimensions && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm text-gray-600">Original Size</Label>
                  <p className="text-lg font-semibold">
                    {originalDimensions.width} × {originalDimensions.height} pixels
                  </p>
                </div>
              )}

              {/* Scale Factor */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Upscale Factor: <span className="text-[#0B9F47]">{upscaleFactor[0]}x</span>
                </Label>
                <Slider
                  value={upscaleFactor}
                  onValueChange={handleFactorChange}
                  min={2}
                  max={4}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>2x (Double)</span>
                  <span>3x (Triple)</span>
                  <span>4x (Quadruple)</span>
                </div>
              </div>

              {/* New Dimensions Preview */}
              {newDimensions && (
                <div className="p-4 bg-[#0B9F47]/10 rounded-lg border border-[#0B9F47]/20">
                  <Label className="text-sm text-gray-600">New Size</Label>
                  <p className="text-lg font-semibold text-[#0B9F47]">
                    {newDimensions.width} × {newDimensions.height} pixels
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((newDimensions.width * newDimensions.height) / ((originalDimensions?.width || 1) * (originalDimensions?.height || 1))).toFixed(1)}x more pixels
                  </p>
                </div>
              )}

              {/* Upscale Button */}
              <Button
                onClick={handleUpscale}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                <ArrowUp className="h-5 w-5 mr-2" />
                Upscale Image {upscaleFactor[0]}x
              </Button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Upscaling your image with high-quality interpolation..."
            successMessage="Image upscaled successfully!"
            errorMessage="Failed to upscale image. Please try again."
          />
        )}

        {/* Preview and Download */}
        {upscaledBlob && upscaledPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-4">Upscaled Image Preview</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50 overflow-auto max-h-[600px]">
                <img
                  src={upscaledPreview}
                  alt="Upscaled preview"
                  className="max-w-full h-auto mx-auto"
                />
              </div>

              {newDimensions && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-600">Original</Label>
                      <p className="font-semibold">
                        {originalDimensions?.width} × {originalDimensions?.height}px
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Upscaled</Label>
                      <p className="font-semibold text-[#0B9F47]">
                        {newDimensions.width} × {newDimensions.height}px
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <DownloadButton
                onClick={handleDownload}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
              >
                Download Upscaled Image
              </DownloadButton>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4">About Image Upscaling</h2>
          <div className="prose prose-sm max-w-none">
            <p>
              Our free online image upscaler uses high-quality interpolation algorithms to increase your image resolution while maintaining visual quality:
            </p>
            <ul>
              <li><strong>2x Upscale:</strong> Double the resolution (4x more pixels)</li>
              <li><strong>3x Upscale:</strong> Triple the resolution (9x more pixels)</li>
              <li><strong>4x Upscale:</strong> Quadruple the resolution (16x more pixels)</li>
            </ul>
            <p>
              Perfect for enlarging photos, artwork, or graphics for printing, presentations, or digital displays. 
              The tool uses advanced image smoothing techniques to ensure sharp, clear results.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              <strong>Note:</strong> Maximum output dimension is 8192px. Very large images may take longer to process.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

