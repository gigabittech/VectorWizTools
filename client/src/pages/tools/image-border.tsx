import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addBorder } from "@/lib/imageProcessing";
import { downloadFile } from "@/lib/fileUtils";
import { Frame } from "lucide-react";

export default function ImageBorder() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [borderWidth, setBorderWidth] = useState([20]);
  const [borderColor, setBorderColor] = useState("#FFFFFF");
  const [padding, setPadding] = useState([0]);
  const [enableShadow, setEnableShadow] = useState(false);
  const [shadowBlur, setShadowBlur] = useState([10]);
  const [shadowColor, setShadowColor] = useState("#000000");
  const [borderedBlob, setBorderedBlob] = useState<Blob | null>(null);
  const [borderedPreview, setBorderedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setBorderedBlob(null);
    setBorderedPreview(null);
  };

  const handleApplyBorder = async () => {
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
      const blob = await addBorder(files[0].file, {
        width: borderWidth[0],
        color: borderColor,
        padding: padding[0],
        shadowBlur: enableShadow ? shadowBlur[0] : 0,
        shadowColor: shadowColor,
      });

      setBorderedBlob(blob);
      const previewUrl = URL.createObjectURL(blob);
      setBorderedPreview(previewUrl);

      setStatus("success");
      toast({
        title: "Success!",
        description: "Border added successfully",
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
    if (!borderedBlob || files.length === 0) return;

    const originalName = files[0].file.name;
    const extension = originalName.split('.').pop() || 'png';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const newFilename = `${baseName}_framed.${extension}`;

    downloadFile(borderedBlob, newFilename);
  };

  const colorPresets = [
    { name: "White", value: "#FFFFFF" },
    { name: "Black", value: "#000000" },
    { name: "Gray", value: "#CCCCCC" },
    { name: "Navy", value: "#06183C" },
    { name: "Green", value: "#0B9F47" },
    { name: "Gold", value: "#FFD700" },
  ];

  const quickPresets = [
    { name: "Classic White", width: 20, color: "#FFFFFF", padding: 10, shadow: false },
    { name: "Bold Black", width: 30, color: "#000000", padding: 15, shadow: true },
    { name: "Gallery Frame", width: 40, color: "#F5F5DC", padding: 20, shadow: true },
    { name: "Modern Minimal", width: 10, color: "#F8F8F8", padding: 5, shadow: false },
  ];

  const applyPreset = (preset: typeof quickPresets[0]) => {
    setBorderWidth([preset.width]);
    setBorderColor(preset.color);
    setPadding([preset.padding]);
    setEnableShadow(preset.shadow);
  };

  return (
    <ToolLayout
      title="Image Border & Frame Tool"
      description="Add borders and frames to images online for free. Create professional-looking framed photos with custom colors, padding, and shadow effects."
      category="Image Tools"
      keywords={["add border", "image frame", "photo border", "frame maker", "picture frame"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image file" },
        { name: "Customize Border", text: "Adjust width, color, and padding" },
        { name: "Add Effects", text: "Enable shadow effects for depth" },
        { name: "Apply", text: "Click Apply Border and download your framed image" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Frame className="h-5 w-5 text-[#0B9F47]" />
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

        {/* Border Settings */}
        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-4">Border Settings</h2>
            <div className="space-y-6">
              {/* Quick Presets */}
              <div>
                <Label className="mb-3 block" data-testid="label-quick-presets">Quick Presets</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {quickPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      data-testid={`preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Border Width */}
              <div className="space-y-2">
                <Label data-testid="label-border-width">Border Width: {borderWidth[0]}px</Label>
                <Slider
                  value={borderWidth}
                  onValueChange={setBorderWidth}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                  data-testid="slider-border-width"
                />
              </div>

              {/* Border Color */}
              <div className="space-y-2">
                <Label data-testid="label-border-color">Border Color</Label>
                <div className="grid grid-cols-6 gap-2 mb-2">
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
                    data-testid="input-color"
                  />
                  <Input
                    type="text"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    placeholder="#FFFFFF"
                    className="flex-1"
                    data-testid="input-color-hex"
                  />
                </div>
              </div>

              {/* Inner Padding */}
              <div className="space-y-2">
                <Label data-testid="label-padding">Inner Padding: {padding[0]}px</Label>
                <Slider
                  value={padding}
                  onValueChange={setPadding}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                  data-testid="slider-padding"
                />
                <p className="text-xs text-gray-500">
                  Space between the image and the border
                </p>
              </div>

              {/* Shadow Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-shadow" data-testid="label-enable-shadow">Enable Shadow</Label>
                  <p className="text-xs text-gray-500">Add depth with shadow effects</p>
                </div>
                <Switch
                  id="enable-shadow"
                  checked={enableShadow}
                  onCheckedChange={setEnableShadow}
                  data-testid="switch-shadow"
                />
              </div>

              {/* Shadow Settings */}
              {enableShadow && (
                <>
                  <div className="space-y-2">
                    <Label data-testid="label-shadow-blur">Shadow Blur: {shadowBlur[0]}px</Label>
                    <Slider
                      value={shadowBlur}
                      onValueChange={setShadowBlur}
                      min={0}
                      max={50}
                      step={1}
                      className="w-full"
                      data-testid="slider-shadow-blur"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label data-testid="label-shadow-color">Shadow Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={shadowColor}
                        onChange={(e) => setShadowColor(e.target.value)}
                        className="w-20 h-10"
                        data-testid="input-shadow-color"
                      />
                      <Input
                        type="text"
                        value={shadowColor}
                        onChange={(e) => setShadowColor(e.target.value)}
                        placeholder="#000000"
                        className="flex-1"
                        data-testid="input-shadow-color-hex"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Apply Button */}
              <Button
                onClick={handleApplyBorder}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
                data-testid="button-apply"
              >
                Apply Border
              </Button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Adding border..."
            successMessage="Border added successfully!"
            errorMessage="Failed to add border. Please try again."
          />
        )}

        {/* Preview and Download */}
        {borderedBlob && borderedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-4">Framed Image</h2>
            <div className="space-y-4">
              {/* Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-2" data-testid="label-preview">Preview</p>
                <img
                  src={borderedPreview}
                  alt="Bordered preview"
                  className="max-w-full h-auto mx-auto"
                  data-testid="preview-image"
                />
              </div>

              {/* File Size Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg" data-testid="stat-original">
                  <p className="text-sm text-blue-900 mb-1">Original</p>
                  <p className="text-xs text-blue-600" data-testid="text-original-size">
                    {(files[0].file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg" data-testid="stat-bordered">
                  <p className="text-sm text-green-900 mb-1">Framed</p>
                  <p className="text-xs text-green-600" data-testid="text-bordered-size">
                    {(borderedBlob.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {/* Download Button */}
              <DownloadButton
                onClick={handleDownload}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
              >
                Download Framed Image
              </DownloadButton>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4">About Image Borders & Frames</h2>
          <div className="prose prose-sm max-w-none">
            <p>
              Add professional borders and frames to your images online. Perfect for:
            </p>
            <ul>
              <li><strong>Social Media:</strong> Make your photos stand out with styled borders</li>
              <li><strong>Print Projects:</strong> Add classic white or black frames for printing</li>
              <li><strong>Photo Galleries:</strong> Create consistent framing for your collections</li>
              <li><strong>Presentations:</strong> Professional borders for business materials</li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              <strong>Pro Tip:</strong> Use light-colored borders with shadow effects for a gallery-style presentation.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
