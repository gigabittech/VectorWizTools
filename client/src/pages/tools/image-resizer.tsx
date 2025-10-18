import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { resizeImage, calculateNewDimensions } from "@/lib/imageProcessing";
import { getImageDimensions, downloadFile, changeFileExtension } from "@/lib/fileUtils";
import { Maximize2, Lock, Unlock } from "lucide-react";

export default function ImageResizer() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [targetWidth, setTargetWidth] = useState<string>("");
  const [targetHeight, setTargetHeight] = useState<string>("");
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);
  const [resizedPreview, setResizedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = async (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setResizedBlob(null);
    setResizedPreview(null);
    setTargetWidth("");
    setTargetHeight("");

    if (uploadedFiles.length > 0) {
      try {
        const dimensions = await getImageDimensions(uploadedFiles[0].file);
        setOriginalDimensions(dimensions);
        setTargetWidth(dimensions.width.toString());
        setTargetHeight(dimensions.height.toString());
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to read image dimensions",
          variant: "destructive",
        });
      }
    }
  };

  const handleWidthChange = (value: string) => {
    const width = parseInt(value) || 0;
    setTargetWidth(value);

    if (maintainAspectRatio && originalDimensions && width > 0) {
      const newDimensions = calculateNewDimensions(
        originalDimensions.width,
        originalDimensions.height,
        width,
        undefined,
        true
      );
      setTargetHeight(newDimensions.height.toString());
    }
  };

  const handleHeightChange = (value: string) => {
    const height = parseInt(value) || 0;
    setTargetHeight(value);

    if (maintainAspectRatio && originalDimensions && height > 0) {
      const newDimensions = calculateNewDimensions(
        originalDimensions.width,
        originalDimensions.height,
        undefined,
        height,
        true
      );
      setTargetWidth(newDimensions.width.toString());
    }
  };

  const handleResize = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    const width = parseInt(targetWidth);
    const height = parseInt(targetHeight);

    if (!width || !height || width <= 0 || height <= 0) {
      toast({
        title: "Invalid Dimensions",
        description: "Please enter valid width and height values",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const blob = await resizeImage(files[0].file, {
        width,
        height,
        maintainAspectRatio,
        quality: 0.92,
      });

      setResizedBlob(blob);
      
      // Create preview
      const previewUrl = URL.createObjectURL(blob);
      setResizedPreview(previewUrl);
      
      setStatus("success");
      toast({
        title: "Success!",
        description: `Image resized to ${width}x${height}`,
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Resize Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!resizedBlob || files.length === 0) return;

    const width = parseInt(targetWidth);
    const height = parseInt(targetHeight);
    const originalName = files[0].file.name;
    const extension = originalName.split('.').pop() || 'png';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const newFilename = `${baseName}_${width}x${height}.${extension}`;

    downloadFile(resizedBlob, newFilename);
  };

  const presetSizes = [
    { name: "Instagram Square", width: 1080, height: 1080 },
    { name: "Instagram Portrait", width: 1080, height: 1350 },
    { name: "Facebook Cover", width: 820, height: 312 },
    { name: "Twitter Header", width: 1500, height: 500 },
    { name: "HD 1080p", width: 1920, height: 1080 },
    { name: "HD 720p", width: 1280, height: 720 },
  ];

  const applyPreset = (width: number, height: number) => {
    setTargetWidth(width.toString());
    setTargetHeight(height.toString());
    setMaintainAspectRatio(false);
  };

  return (
    <ToolLayout
      title="Image Resizer"
      description="Resize images online for free. Change image dimensions, width, and height while maintaining quality. Perfect for social media, websites, and more."
      category="Image Tools"
      keywords={["resize image", "change image size", "image dimensions", "scale image", "image width height"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image file" },
        { name: "Set Dimensions", text: "Enter the desired width and height, or choose a preset size" },
        { name: "Resize", text: "Click the Resize button to process your image" },
        { name: "Download", text: "Download your resized image" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Maximize2 className="h-5 w-5 text-[#0B9F47]" />
              Upload Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader
              accept="image/*"
              maxFiles={1}
              maxSize={50 * 1024 * 1024}
              onFilesSelected={handleFilesSelected}
              multiple={false}
              allowedTypes={["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]}
            />
          </CardContent>
        </Card>

        {/* Dimensions Input */}
        {originalDimensions && (
          <Card>
            <CardHeader>
              <CardTitle>Resize Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Original Dimensions Display */}
              <div className="bg-gray-50 p-4 rounded-lg" data-testid="display-original-dimensions">
                <p className="text-sm font-medium text-gray-700 mb-2">Original Size</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="text-original-size">
                  {originalDimensions.width} × {originalDimensions.height} px
                </p>
              </div>

              {/* Preset Sizes */}
              <div>
                <Label className="mb-3 block">Quick Presets</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {presetSizes.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset.width, preset.height)}
                      data-testid={`preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="text-left">
                        <div className="font-medium text-xs">{preset.name}</div>
                        <div className="text-xs text-gray-500">{preset.width}×{preset.height}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Dimension Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={targetWidth}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    placeholder="Width"
                    min="1"
                    data-testid="input-width"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={targetHeight}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    placeholder="Height"
                    min="1"
                    data-testid="input-height"
                  />
                </div>
              </div>

              {/* Aspect Ratio Lock */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {maintainAspectRatio ? (
                    <Lock className="h-5 w-5 text-[#0B9F47]" />
                  ) : (
                    <Unlock className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <Label htmlFor="aspect-ratio" className="cursor-pointer" data-testid="label-aspect-ratio">
                      Maintain Aspect Ratio
                    </Label>
                    <p className="text-xs text-gray-500">
                      Keep the original image proportions
                    </p>
                  </div>
                </div>
                <Switch
                  id="aspect-ratio"
                  checked={maintainAspectRatio}
                  onCheckedChange={setMaintainAspectRatio}
                  data-testid="switch-aspect-ratio"
                />
              </div>

              {/* Resize Button */}
              <Button
                onClick={handleResize}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
                data-testid="button-resize"
              >
                Resize Image
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Resizing your image..."
            successMessage="Image resized successfully!"
            errorMessage="Failed to resize image. Please try again."
          />
        )}

        {/* Preview and Download */}
        {resizedBlob && resizedPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Resized Image Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={resizedPreview}
                  alt="Resized preview"
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
                  <p className="text-xs text-gray-500" data-testid="text-original-filesize">
                    {(files[0].file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="bg-white p-3 rounded border" data-testid="stat-resized">
                  <p className="text-gray-600">Resized</p>
                  <p className="font-semibold" data-testid="text-resized-dimensions">
                    {targetWidth} × {targetHeight} px
                  </p>
                  <p className="text-xs text-gray-500" data-testid="text-resized-filesize">
                    {(resizedBlob.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <DownloadButton
                onClick={handleDownload}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
              >
                Download Resized Image
              </DownloadButton>
            </CardContent>
          </Card>
        )}

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>About Image Resizing</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Our free online image resizer allows you to quickly change the dimensions of your images
              while maintaining quality. Perfect for:
            </p>
            <ul>
              <li>Optimizing images for social media platforms</li>
              <li>Preparing images for websites and blogs</li>
              <li>Creating thumbnails and avatars</li>
              <li>Reducing file size for faster loading</li>
            </ul>
            <p>
              The aspect ratio lock feature helps maintain your image's proportions, preventing distortion.
              Turn it off if you need to fit specific dimensions exactly.
            </p>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
