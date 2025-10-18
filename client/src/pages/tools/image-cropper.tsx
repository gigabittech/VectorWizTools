import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cropImage } from "@/lib/imageProcessing";
import { getImageDimensions, downloadFile } from "@/lib/fileUtils";
import { Crop } from "lucide-react";

export default function ImageCropper() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [cropX, setCropX] = useState("0");
  const [cropY, setCropY] = useState("0");
  const [cropWidth, setCropWidth] = useState("");
  const [cropHeight, setCropHeight] = useState("");
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = async (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setCroppedBlob(null);
    setCroppedPreview(null);
    setCropX("0");
    setCropY("0");
    setCropWidth("");
    setCropHeight("");

    if (uploadedFiles.length > 0) {
      try {
        const dimensions = await getImageDimensions(uploadedFiles[0].file);
        setOriginalDimensions(dimensions);
        setCropWidth(dimensions.width.toString());
        setCropHeight(dimensions.height.toString());
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to read image dimensions",
          variant: "destructive",
        });
      }
    }
  };

  const handleCrop = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    const x = parseInt(cropX);
    const y = parseInt(cropY);
    const width = parseInt(cropWidth);
    const height = parseInt(cropHeight);

    if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
      toast({
        title: "Invalid Values",
        description: "Please enter valid crop dimensions",
        variant: "destructive",
      });
      return;
    }

    if (originalDimensions && (x + width > originalDimensions.width || y + height > originalDimensions.height)) {
      toast({
        title: "Invalid Crop",
        description: "Crop area exceeds image boundaries",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const blob = await cropImage(files[0].file, { x, y, width, height });

      setCroppedBlob(blob);
      
      const previewUrl = URL.createObjectURL(blob);
      setCroppedPreview(previewUrl);
      
      setStatus("success");
      toast({
        title: "Success!",
        description: `Image cropped to ${width}x${height}`,
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
    if (!croppedBlob || files.length === 0) return;

    const originalName = files[0].file.name;
    const extension = originalName.split('.').pop() || 'png';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const newFilename = `${baseName}_cropped.${extension}`;

    downloadFile(croppedBlob, newFilename);
  };

  const cropPresets = [
    { name: "Square 1:1", ratio: 1 / 1 },
    { name: "Portrait 4:5", ratio: 4 / 5 },
    { name: "Landscape 16:9", ratio: 16 / 9 },
    { name: "Landscape 4:3", ratio: 4 / 3 },
  ];

  const applyRatioPreset = (ratio: number) => {
    if (!originalDimensions) return;

    let width = originalDimensions.width;
    let height = Math.round(width / ratio);

    if (height > originalDimensions.height) {
      height = originalDimensions.height;
      width = Math.round(height * ratio);
    }

    setCropWidth(width.toString());
    setCropHeight(height.toString());
    setCropX("0");
    setCropY("0");
  };

  return (
    <ToolLayout
      title="Image Cropper"
      description="Crop images online for free. Trim and cut images to any size or aspect ratio. Perfect for profile pictures, thumbnails, and custom dimensions."
      category="Image Tools"
      keywords={["crop image", "trim image", "cut image", "image cropper", "aspect ratio crop"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image file" },
        { name: "Set Crop Area", text: "Enter crop position (X, Y) and dimensions (width, height)" },
        { name: "Crop", text: "Click the Crop button to process your image" },
        { name: "Download", text: "Download your cropped image" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Crop className="h-5 w-5 text-[#0B9F47]" />
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

        {/* Crop Settings */}
        {originalDimensions && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-4">Crop Settings</h2>
            <div className="space-y-6">
              {/* Original Dimensions Display */}
              <div className="bg-gray-50 p-4 rounded-lg" data-testid="display-original-dimensions">
                <p className="text-sm font-medium text-gray-700 mb-2">Original Size</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="text-original-size">
                  {originalDimensions.width} × {originalDimensions.height} px
                </p>
              </div>

              {/* Aspect Ratio Presets */}
              <div>
                <Label className="mb-3 block">Aspect Ratio Presets</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {cropPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyRatioPreset(preset.ratio)}
                      data-testid={`preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Crop Position */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cropX">X Position (px)</Label>
                  <Input
                    id="cropX"
                    type="number"
                    value={cropX}
                    onChange={(e) => setCropX(e.target.value)}
                    min="0"
                    max={originalDimensions.width}
                    data-testid="input-x"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cropY">Y Position (px)</Label>
                  <Input
                    id="cropY"
                    type="number"
                    value={cropY}
                    onChange={(e) => setCropY(e.target.value)}
                    min="0"
                    max={originalDimensions.height}
                    data-testid="input-y"
                  />
                </div>
              </div>

              {/* Crop Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cropWidth">Width (px)</Label>
                  <Input
                    id="cropWidth"
                    type="number"
                    value={cropWidth}
                    onChange={(e) => setCropWidth(e.target.value)}
                    min="1"
                    max={originalDimensions.width}
                    data-testid="input-width"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cropHeight">Height (px)</Label>
                  <Input
                    id="cropHeight"
                    type="number"
                    value={cropHeight}
                    onChange={(e) => setCropHeight(e.target.value)}
                    min="1"
                    max={originalDimensions.height}
                    data-testid="input-height"
                  />
                </div>
              </div>

              {/* Crop Button */}
              <Button
                onClick={handleCrop}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
                data-testid="button-crop"
              >
                Crop Image
              </Button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Cropping your image..."
            successMessage="Image cropped successfully!"
            errorMessage="Failed to crop image. Please try again."
          />
        )}

        {/* Preview and Download */}
        {croppedBlob && croppedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-4">Cropped Image Preview</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={croppedPreview}
                  alt="Cropped preview"
                  className="max-w-full h-auto mx-auto"
                  data-testid="preview-image"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded border" data-testid="stat-original">
                  <p className="text-gray-600">Original</p>
                  <p className="font-semibold" data-testid="text-original-dimensions">
                    {originalDimensions?.width} × {originalDimensions?.height} px
                  </p>
                </div>
                <div className="bg-white p-3 rounded border" data-testid="stat-cropped">
                  <p className="text-gray-600">Cropped</p>
                  <p className="font-semibold" data-testid="text-cropped-dimensions">
                    {cropWidth} × {cropHeight} px
                  </p>
                </div>
              </div>

              <DownloadButton
                onClick={handleDownload}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
              >
                Download Cropped Image
              </DownloadButton>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4">About Image Cropping</h2>
          <div className="prose prose-sm max-w-none">
            <p>
              Our free online image cropper lets you trim and cut images to any size. Perfect for:
            </p>
            <ul>
              <li>Creating profile pictures and avatars</li>
              <li>Removing unwanted edges or backgrounds</li>
              <li>Fitting images to specific aspect ratios</li>
              <li>Preparing images for social media</li>
              <li>Creating thumbnails</li>
            </ul>
            <p>
              Use the aspect ratio presets for common sizes, or enter custom dimensions for precise control.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
