import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addTextWatermark, addImageWatermark, WatermarkOptions, ImageWatermarkOptions } from "@/lib/imageProcessing";
import { downloadFile } from "@/lib/fileUtils";
import { Type, Image as ImageIcon } from "lucide-react";

type WatermarkType = "text" | "image";

export default function ImageWatermark() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [watermarkType, setWatermarkType] = useState<WatermarkType>("text");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  
  // Text watermark state
  const [watermarkText, setWatermarkText] = useState("Copyright © 2025");
  const [fontSize, setFontSize] = useState([36]);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [color, setColor] = useState("#FFFFFF");
  const [rotation, setRotation] = useState([0]);
  
  // Image watermark state
  const [watermarkImageFiles, setWatermarkImageFiles] = useState<UploadedFile[]>([]);
  const [imageScale, setImageScale] = useState([20]);
  
  // Shared state
  const [position, setPosition] = useState<WatermarkOptions['position']>("bottom-right");
  const [opacity, setOpacity] = useState([50]);
  const [watermarkedBlob, setWatermarkedBlob] = useState<Blob | null>(null);
  const [watermarkedPreview, setWatermarkedPreview] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setWatermarkedBlob(null);
    setWatermarkedPreview(null);
  };

  const handleWatermarkImageSelected = (uploadedFiles: UploadedFile[]) => {
    setWatermarkImageFiles(uploadedFiles);
  };

  const handleApplyWatermark = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    if (watermarkType === "text" && !watermarkText.trim()) {
      toast({
        title: "No Text",
        description: "Please enter watermark text",
        variant: "destructive",
      });
      return;
    }

    if (watermarkType === "image" && watermarkImageFiles.length === 0) {
      toast({
        title: "No Watermark Image",
        description: "Please upload a watermark image",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      let blob: Blob;

      if (watermarkType === "text") {
        blob = await addTextWatermark(files[0].file, {
          text: watermarkText,
          position,
          fontSize: fontSize[0],
          fontFamily,
          color,
          opacity: opacity[0] / 100,
          rotation: rotation[0],
        });
      } else {
        blob = await addImageWatermark(
          files[0].file,
          watermarkImageFiles[0].file,
          {
            position,
            opacity: opacity[0] / 100,
            scale: imageScale[0] / 100,
          }
        );
      }

      setWatermarkedBlob(blob);
      const previewUrl = URL.createObjectURL(blob);
      setWatermarkedPreview(previewUrl);

      setStatus("success");
      toast({
        title: "Success!",
        description: "Watermark added successfully",
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
    if (!watermarkedBlob || files.length === 0) return;

    const originalName = files[0].file.name;
    const extension = originalName.split('.').pop() || 'png';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const newFilename = `${baseName}_watermarked.${extension}`;

    downloadFile(watermarkedBlob, newFilename);
  };

  const positionPresets = [
    { value: "top-left" as const, label: "Top Left" },
    { value: "top-right" as const, label: "Top Right" },
    { value: "center" as const, label: "Center" },
    { value: "bottom-left" as const, label: "Bottom Left" },
    { value: "bottom-right" as const, label: "Bottom Right" },
  ];

  const fontPresets = [
    "Arial",
    "Georgia",
    "Times New Roman",
    "Courier New",
    "Verdana",
    "Impact",
  ];

  const colorPresets = [
    { name: "White", value: "#FFFFFF" },
    { name: "Black", value: "#000000" },
    { name: "Gray", value: "#808080" },
    { name: "Red", value: "#FF0000" },
    { name: "Blue", value: "#0000FF" },
  ];

  const quickPresets = [
    {
      name: "Copyright",
      text: "Copyright © 2025",
      position: "bottom-right" as const,
      fontSize: 36,
      color: "#FFFFFF",
      opacity: 50,
    },
    {
      name: "Watermark",
      text: "WATERMARK",
      position: "center" as const,
      fontSize: 72,
      color: "#FFFFFF",
      opacity: 30,
      rotation: -45,
    },
    {
      name: "Draft",
      text: "DRAFT",
      position: "center" as const,
      fontSize: 96,
      color: "#FF0000",
      opacity: 40,
      rotation: -30,
    },
  ];

  const applyPreset = (preset: typeof quickPresets[0]) => {
    setWatermarkType("text");
    setWatermarkText(preset.text);
    setPosition(preset.position);
    setFontSize([preset.fontSize]);
    setColor(preset.color);
    setOpacity([preset.opacity]);
    setRotation([preset.rotation || 0]);
  };

  return (
    <ToolLayout
      title="Image Watermark Tool"
      description="Add text or image watermarks to photos online for free. Protect your images with customizable text and logo watermarks. Control position, size, opacity, and more."
      category="Image Tools"
      keywords={["add watermark", "image watermark", "logo watermark", "text watermark", "copyright protection", "photo protection"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your main image file" },
        { name: "Choose Type", text: "Select text or image watermark" },
        { name: "Customize", text: "Adjust position, opacity, size, and other settings" },
        { name: "Apply", text: "Click Apply Watermark and download your protected image" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-[#0B9F47]" />
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
              allowedTypes={["image/jpeg", "image/png", "image/webp"]}
              data-testid="file-uploader"
            />
          </CardContent>
        </Card>

        {/* Watermark Settings */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Watermark Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Watermark Type Selection */}
              <div className="space-y-2">
                <Label data-testid="label-watermark-type">Watermark Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={watermarkType === "text" ? "default" : "outline"}
                    onClick={() => setWatermarkType("text")}
                    className={watermarkType === "text" ? "bg-[#0B9F47] hover:bg-[#0B9F47]/90" : ""}
                    data-testid="button-type-text"
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                  <Button
                    variant={watermarkType === "image" ? "default" : "outline"}
                    onClick={() => setWatermarkType("image")}
                    className={watermarkType === "image" ? "bg-[#0B9F47] hover:bg-[#0B9F47]/90" : ""}
                    data-testid="button-type-image"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Image/Logo
                  </Button>
                </div>
              </div>

              {/* Text Watermark Settings */}
              {watermarkType === "text" && (
                <>
                  {/* Quick Presets */}
                  <div>
                    <Label className="mb-3 block" data-testid="label-quick-presets">Quick Presets</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {quickPresets.map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          onClick={() => applyPreset(preset)}
                          data-testid={`preset-${preset.name.toLowerCase()}`}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Watermark Text */}
                  <div className="space-y-2">
                    <Label htmlFor="watermark-text" data-testid="label-text">Watermark Text</Label>
                    <Input
                      id="watermark-text"
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Enter watermark text"
                      data-testid="input-text"
                    />
                  </div>

                  {/* Font Size */}
                  <div className="space-y-2">
                    <Label data-testid="label-font-size">Font Size: {fontSize[0]}px</Label>
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      min={12}
                      max={200}
                      step={2}
                      className="w-full"
                      data-testid="slider-font-size"
                    />
                  </div>

                  {/* Font Family */}
                  <div className="space-y-2">
                    <Label htmlFor="font-family" data-testid="label-font-family">Font Family</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger id="font-family" data-testid="select-font-family">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontPresets.map((font) => (
                          <SelectItem key={font} value={font} data-testid={`font-${font.toLowerCase().replace(/\s+/g, '-')}`}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Color */}
                  <div className="space-y-2">
                    <Label data-testid="label-color">Color</Label>
                    <div className="grid grid-cols-5 gap-2 mb-2">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setColor(preset.value)}
                          className={`h-10 rounded border-2 ${color === preset.value ? 'border-[#0B9F47]' : 'border-gray-300'}`}
                          style={{ backgroundColor: preset.value }}
                          title={preset.name}
                          data-testid={`color-preset-${preset.name.toLowerCase()}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-20 h-10"
                        data-testid="input-color"
                      />
                      <Input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="#FFFFFF"
                        className="flex-1"
                        data-testid="input-color-hex"
                      />
                    </div>
                  </div>

                  {/* Rotation */}
                  <div className="space-y-2">
                    <Label data-testid="label-rotation">Rotation: {rotation[0]}°</Label>
                    <Slider
                      value={rotation}
                      onValueChange={setRotation}
                      min={-90}
                      max={90}
                      step={5}
                      className="w-full"
                      data-testid="slider-rotation"
                    />
                  </div>
                </>
              )}

              {/* Image Watermark Settings */}
              {watermarkType === "image" && (
                <>
                  {/* Watermark Image Upload */}
                  <div className="space-y-2">
                    <Label data-testid="label-watermark-image">Watermark Image/Logo</Label>
                    <FileUploader
                      accept="image/*"
                      maxFiles={1}
                      maxSize={10 * 1024 * 1024}
                      onFilesSelected={handleWatermarkImageSelected}
                      multiple={false}
                      allowedTypes={["image/png", "image/svg+xml", "image/webp"]}
                      data-testid="watermark-image-uploader"
                    />
                    <p className="text-xs text-gray-500">
                      Upload your logo or watermark image (PNG or SVG recommended for transparency)
                    </p>
                  </div>

                  {/* Image Scale */}
                  <div className="space-y-2">
                    <Label data-testid="label-image-scale">Size: {imageScale[0]}% of main image</Label>
                    <Slider
                      value={imageScale}
                      onValueChange={setImageScale}
                      min={5}
                      max={50}
                      step={1}
                      className="w-full"
                      data-testid="slider-image-scale"
                    />
                  </div>
                </>
              )}

              {/* Shared Settings */}
              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position" data-testid="label-position">Position</Label>
                <Select value={position} onValueChange={(value) => setPosition(value as WatermarkOptions['position'])}>
                  <SelectTrigger id="position" data-testid="select-position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionPresets.map((pos) => (
                      <SelectItem key={pos.value} value={pos.value} data-testid={`position-${pos.value}`}>
                        {pos.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Opacity */}
              <div className="space-y-2">
                <Label data-testid="label-opacity">Opacity: {opacity[0]}%</Label>
                <Slider
                  value={opacity}
                  onValueChange={setOpacity}
                  min={10}
                  max={100}
                  step={5}
                  className="w-full"
                  data-testid="slider-opacity"
                />
              </div>

              {/* Apply Button */}
              <Button
                onClick={handleApplyWatermark}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
                data-testid="button-apply"
              >
                Apply Watermark
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Adding watermark..."
            successMessage="Watermark added successfully!"
            errorMessage="Failed to add watermark. Please try again."
          />
        )}

        {/* Preview and Download */}
        {watermarkedBlob && watermarkedPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Watermarked Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-2" data-testid="label-preview">Preview</p>
                <img
                  src={watermarkedPreview}
                  alt="Watermarked preview"
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
                <div className="bg-green-50 p-4 rounded-lg" data-testid="stat-watermarked">
                  <p className="text-sm text-green-900 mb-1">Watermarked</p>
                  <p className="text-xs text-green-600" data-testid="text-watermarked-size">
                    {(watermarkedBlob.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {/* Download Button */}
              <DownloadButton
                onClick={handleDownload}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
              >
                Download Watermarked Image
              </DownloadButton>
            </CardContent>
          </Card>
        )}

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>About Image Watermarks</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Protect your images with professional text or image watermarks. Our free online watermark tool supports both:
            </p>
            <ul>
              <li><strong>Text Watermarks:</strong> Add copyright text, dates, or custom messages with full control over font, color, and rotation</li>
              <li><strong>Image Watermarks:</strong> Overlay your logo or signature image with adjustable size and opacity</li>
              <li><strong>Position control:</strong> Place watermarks anywhere on your image (corners or center)</li>
              <li><strong>Opacity adjustment:</strong> Make watermarks subtle or prominent</li>
              <li><strong>Quick presets:</strong> Common watermark styles ready to use</li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              <strong>Pro Tips:</strong>
              <br />• Use semi-transparent watermarks (30-60% opacity) for subtle protection
              <br />• For logos, use PNG or SVG files with transparent backgrounds
              <br />• Center placement with rotation works well for "Draft" or "Confidential" watermarks
            </p>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
