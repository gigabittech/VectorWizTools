import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { loadImage } from "@/lib/imageProcessing";
import { downloadFile } from "@/lib/fileUtils";
import { Circle } from "lucide-react";

export default function MakeRoundImage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [size, setSize] = useState([800]);
  const [addBorder, setAddBorder] = useState(false);
  const [borderWidth, setBorderWidth] = useState([10]);
  const [borderColor, setBorderColor] = useState("#FFFFFF");
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setProcessedPreview(null);
  };

  const handleMakeRound = async () => {
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
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      const outputSize = size[0];
      const border = addBorder ? borderWidth[0] : 0;
      canvas.width = outputSize + border * 2;
      canvas.height = outputSize + border * 2;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw border circle if enabled
      if (addBorder) {
        ctx.fillStyle = borderColor;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, outputSize / 2 + border, 0, Math.PI * 2);
        ctx.fill();
      }

      // Create circular clip path
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Calculate dimensions to fill the circle (cover mode)
      const minDimension = Math.min(img.width, img.height);
      const scale = outputSize / minDimension;
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Center the image
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      // Draw image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      ctx.restore();

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/png', // Always use PNG for transparency
          0.92
        );
      });

      setProcessedBlob(blob);
      const previewUrl = URL.createObjectURL(blob);
      setProcessedPreview(previewUrl);

      setStatus("success");
      toast({
        title: "Success!",
        description: "Image converted to circular shape",
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

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const newFilename = `${baseName}_round.png`;
    downloadFile(processedBlob, newFilename);
  };

  const sizePresets = [
    { name: "Small (400px)", value: 400 },
    { name: "Medium (800px)", value: 800 },
    { name: "Large (1200px)", value: 1200 },
  ];

  const colorPresets = [
    { name: "White", value: "#FFFFFF" },
    { name: "Black", value: "#000000" },
    { name: "Gray", value: "#808080" },
    { name: "Blue", value: "#0B9F47" },
  ];

  return (
    <ToolLayout
      title="Make Round Image Online - Circular Profile Picture Maker"
      description="Create circular images for free. Perfect for profile pictures, avatars, and social media. Add optional borders and customize size."
      category="Image Tools"
      keywords={["round image", "circular image", "circle crop", "profile picture", "avatar maker", "circular crop"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image file" },
        { name: "Set Size", text: "Choose the output size for your circular image" },
        { name: "Add Border (Optional)", text: "Enable and customize border if desired" },
        { name: "Download", text: "Click Make Round and download your circular image" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Circle className="h-5 w-5 text-[#0B9F47]" />
            Upload Image
          </h2>
          <div>
            <FileUploader
              accept="image/*"
              maxFiles={1}
              maxSize={50 * 1024 * 1024}
              onFilesSelected={handleFilesSelected}
              multiple={false}
              allowedTypes={["image/jpeg", "image/png", "image/webp"]}
              data-testid="file-uploader"
            />
          </div>
        </div>

        {/* Settings */}
        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-4">Circle Settings</h2>
            <div className="space-y-6">
              {/* Size Presets */}
              <div>
                <Label className="mb-3 block" data-testid="label-size-presets">Size Presets</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {sizePresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => setSize([preset.value])}
                      data-testid={`preset-${preset.value}`}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Output Size */}
              <div className="space-y-2">
                <Label data-testid="label-size">Output Size: {size[0]}px</Label>
                <Slider
                  value={size}
                  onValueChange={setSize}
                  min={100}
                  max={2000}
                  step={50}
                  data-testid="slider-size"
                />
              </div>

              {/* Add Border Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="add-border"
                  checked={addBorder}
                  onCheckedChange={setAddBorder}
                  data-testid="switch-add-border"
                />
                <Label htmlFor="add-border" data-testid="label-add-border">Add Border</Label>
              </div>

              {/* Border Settings */}
              {addBorder && (
                <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                  <div className="space-y-2">
                    <Label data-testid="label-border-width">Border Width: {borderWidth[0]}px</Label>
                    <Slider
                      value={borderWidth}
                      onValueChange={setBorderWidth}
                      min={1}
                      max={50}
                      step={1}
                      data-testid="slider-border-width"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label data-testid="label-border-color">Border Color</Label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setBorderColor(preset.value)}
                          className={`h-10 rounded border-2 ${borderColor === preset.value ? 'border-[#0B9F47]' : 'border-gray-300'}`}
                          style={{ backgroundColor: preset.value }}
                          title={preset.name}
                          data-testid={`color-preset-${preset.name.toLowerCase()}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="w-20 h-10"
                        data-testid="input-border-color"
                      />
                      <Input
                        type="text"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        placeholder="#FFFFFF"
                        className="flex-1"
                        data-testid="input-border-color-hex"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <Button
                onClick={handleMakeRound}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
                data-testid="button-apply"
              >
                Make Round
              </Button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Creating circular image..."
            successMessage="Circular image created successfully!"
            errorMessage="Failed to create circular image. Please try again."
          />
        )}

        {/* Preview and Download */}
        {processedBlob && processedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-4">Circular Image</h2>
            <div className="space-y-4">
              {/* Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-2" data-testid="label-preview">Preview</p>
                <div className="flex justify-center">
                  <img
                    src={processedPreview}
                    alt="Round image preview"
                    className="max-w-full h-auto"
                    style={{ maxWidth: '400px' }}
                    data-testid="preview-image"
                  />
                </div>
              </div>

              {/* File Size Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg" data-testid="stat-original">
                  <p className="text-sm text-blue-900 mb-1">Original</p>
                  <p className="text-xs text-blue-600" data-testid="text-original-size">
                    {(files[0].file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg" data-testid="stat-processed">
                  <p className="text-sm text-green-900 mb-1">Round Image</p>
                  <p className="text-xs text-green-600" data-testid="text-processed-size">
                    {(processedBlob.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {/* Download Button */}
              <DownloadButton
                onClick={handleDownload}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
              >
                Download Circular Image
              </DownloadButton>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4">About Circular Images</h2>
          <div className="prose prose-sm max-w-none">
            <p>
              Create perfect circular images online for free. Our tool is ideal for:
            </p>
            <ul>
              <li><strong>Profile Pictures:</strong> Social media avatars for Facebook, Twitter, LinkedIn, Instagram</li>
              <li><strong>Contact Photos:</strong> Round profile photos for phone contacts</li>
              <li><strong>Team Pages:</strong> Professional circular headshots for company websites</li>
              <li><strong>Icons & Logos:</strong> Circular brand marks and app icons</li>
              <li><strong>Badges:</strong> Achievement badges and certification seals</li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              <strong>Pro Tips:</strong>
              <br />• Center the subject in your photo before uploading for best results
              <br />• Use square images for perfect circular crops
              <br />• Add a border to make your circular image stand out
              <br />• The tool automatically crops to fill the circle (no empty spaces)
              <br />• Output is always PNG format with transparent background
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
