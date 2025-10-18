import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { convertImageFormat, SupportedImageFormat } from "@/lib/imageProcessing";
import { downloadFile } from "@/lib/fileUtils";
import { RefreshCw } from "lucide-react";

export default function FormatConverter() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [targetFormat, setTargetFormat] = useState<SupportedImageFormat>("image/png");
  const [quality, setQuality] = useState([92]);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedPreview, setConvertedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const formatOptions: { value: SupportedImageFormat; label: string; extension: string }[] = [
    { value: "image/png", label: "PNG", extension: "png" },
    { value: "image/jpeg", label: "JPEG", extension: "jpg" },
    { value: "image/webp", label: "WebP", extension: "webp" },
    { value: "image/bmp", label: "BMP", extension: "bmp" },
    { value: "image/gif", label: "GIF", extension: "gif" },
  ];

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setConvertedBlob(null);
    setConvertedPreview(null);
  };

  const handleConvert = async () => {
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
      const qualityValue = quality[0] / 100;
      const blob = await convertImageFormat(files[0].file, targetFormat, qualityValue);
      
      setConvertedBlob(blob);
      const previewUrl = URL.createObjectURL(blob);
      setConvertedPreview(previewUrl);
      
      setStatus("success");
      
      const formatName = formatOptions.find(f => f.value === targetFormat)?.label || "image";
      toast({
        title: "Success!",
        description: `Image converted to ${formatName}`,
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || files.length === 0) return;

    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const targetExt = formatOptions.find(f => f.value === targetFormat)?.extension || 'png';
    const newFilename = `${baseName}.${targetExt}`;

    downloadFile(convertedBlob, newFilename);
  };

  const quickConversions = [
    { from: "PNG", to: "image/jpeg", label: "PNG → JPG" },
    { from: "JPG", to: "image/png", label: "JPG → PNG" },
    { from: "Any", to: "image/webp", label: "Any → WebP" },
  ];

  const needsQuality = targetFormat === "image/jpeg" || targetFormat === "image/webp";

  return (
    <ToolLayout
      title="Image Format Converter"
      description="Convert images between formats online for free. Transform PNG, JPG, WebP, GIF, and BMP files instantly. Perfect for web optimization and compatibility."
      category="Image Tools"
      keywords={["convert image", "png to jpg", "jpg to png", "webp converter", "image format", "convert to webp"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image file" },
        { name: "Choose Format", text: "Select the target format you want to convert to" },
        { name: "Adjust Quality", text: "Set quality level for lossy formats (JPG, WebP)" },
        { name: "Convert", text: "Click Convert and download your new image" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-[#0B9F47]" />
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
              allowedTypes={["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff"]}
            />
          </CardContent>
        </Card>

        {/* Conversion Settings */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Conversion Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Source Format Display */}
              <div className="bg-blue-50 p-4 rounded-lg" data-testid="source-format">
                <p className="text-sm font-medium text-blue-900 mb-1">Source Format</p>
                <p className="text-lg font-bold text-blue-700">
                  {files[0].file.type.split('/')[1]?.toUpperCase() || "Unknown"}
                </p>
              </div>

              {/* Quick Conversion Buttons */}
              <div>
                <Label className="mb-3 block">Quick Conversions</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {quickConversions.map((conv) => (
                    <Button
                      key={conv.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setTargetFormat(conv.to as SupportedImageFormat)}
                      data-testid={`preset-${conv.label.toLowerCase().replace(/\s+/g, '-').replace(/→/g, 'to')}`}
                    >
                      {conv.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Target Format Selection */}
              <div className="space-y-2">
                <Label htmlFor="format">Convert To</Label>
                <Select value={targetFormat} onValueChange={(value) => setTargetFormat(value as SupportedImageFormat)}>
                  <SelectTrigger id="format" data-testid="select-format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} data-testid={`format-${option.label.toLowerCase()}`}>
                        {option.label} (.{option.extension})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quality Slider (for lossy formats) */}
              {needsQuality && (
                <div className="space-y-2">
                  <Label>Quality: {quality[0]}%</Label>
                  <Slider
                    value={quality}
                    onValueChange={setQuality}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                    data-testid="slider-quality"
                  />
                  <p className="text-xs text-gray-500">
                    Higher quality = better image but larger file size
                  </p>
                </div>
              )}

              {/* Format Information */}
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <p className="font-medium mb-2">Format Notes:</p>
                <ul className="space-y-1 text-gray-700">
                  {targetFormat === "image/png" && (
                    <li>• PNG: Lossless, supports transparency, larger file size</li>
                  )}
                  {targetFormat === "image/jpeg" && (
                    <li>• JPEG: Lossy compression, no transparency, smaller file size</li>
                  )}
                  {targetFormat === "image/webp" && (
                    <li>• WebP: Modern format, great compression, supports transparency</li>
                  )}
                  {targetFormat === "image/bmp" && (
                    <li>• BMP: Uncompressed, no transparency, very large file size</li>
                  )}
                  {targetFormat === "image/gif" && (
                    <li>• GIF: Limited colors (256), supports animation and transparency</li>
                  )}
                </ul>
              </div>

              {/* Convert Button */}
              <Button
                onClick={handleConvert}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
                data-testid="button-convert"
              >
                Convert Image
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Converting your image..."
            successMessage="Image converted successfully!"
            errorMessage="Failed to convert image. Please try again."
          />
        )}

        {/* Preview and Download */}
        {convertedBlob && convertedPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Converted Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Conversion Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 mb-1">Original</p>
                  <p className="font-semibold text-blue-700">
                    {files[0].file.type.split('/')[1]?.toUpperCase()}
                  </p>
                  <p className="text-xs text-blue-600">
                    {(files[0].file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-900 mb-1">Converted</p>
                  <p className="font-semibold text-green-700">
                    {formatOptions.find(f => f.value === targetFormat)?.label}
                  </p>
                  <p className="text-xs text-green-600">
                    {(convertedBlob.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-2">Preview</p>
                <img
                  src={convertedPreview}
                  alt="Converted preview"
                  className="max-w-full h-auto mx-auto"
                  data-testid="preview-image"
                />
              </div>

              {/* Download Button */}
              <DownloadButton
                onClick={handleDownload}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
              >
                Download Converted Image
              </DownloadButton>
            </CardContent>
          </Card>
        )}

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>About Image Format Conversion</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Our free online image format converter supports all major image formats:
            </p>
            <ul>
              <li><strong>PNG to JPG:</strong> Convert PNG to smaller JPG files (loses transparency)</li>
              <li><strong>JPG to PNG:</strong> Convert JPG to PNG for transparency support</li>
              <li><strong>WebP:</strong> Convert to modern WebP format for better compression</li>
              <li><strong>GIF:</strong> Convert to GIF for animations and limited color palettes</li>
              <li><strong>BMP:</strong> Convert to/from uncompressed BMP format</li>
            </ul>
            <p>
              Use this tool to optimize images for web, ensure compatibility, or prepare files for specific platforms.
            </p>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
