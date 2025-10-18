import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { extractColors } from "@/lib/imageProcessing";
import { Palette, Check, Copy } from "lucide-react";

export default function ColorPaletteExtractor() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [colorCount, setColorCount] = useState([5]);
  const [colors, setColors] = useState<string[]>([]);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setColors([]);
  };

  const handleExtractColors = async () => {
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
      const extractedColors = await extractColors(files[0].file, colorCount[0]);
      setColors(extractedColors);
      setStatus("success");
      toast({
        title: "Success!",
        description: `Extracted ${extractedColors.length} colors`,
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

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    toast({
      title: "Copied!",
      description: `${color} copied to clipboard`,
    });
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const copyAllColors = () => {
    const colorList = colors.join(', ');
    navigator.clipboard.writeText(colorList);
    toast({
      title: "Copied!",
      description: "All colors copied to clipboard",
    });
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const getTextColor = (hex: string): string => {
    const rgb = hexToRgb(hex);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  return (
    <ToolLayout
      title="Color Palette Extractor"
      description="Extract dominant colors from images online for free. Get hex and RGB color codes from photos. Perfect for designers and developers."
      category="Image Tools"
      keywords={["extract colors", "color palette", "image colors", "dominant colors", "color picker"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image file" },
        { name: "Set Color Count", text: "Choose how many colors to extract (3-10)" },
        { name: "Extract", text: "Click Extract Colors to analyze the image" },
        { name: "Copy Colors", text: "Click on any color to copy its hex code" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#0B9F47]" />
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

        {/* Settings */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Extraction Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Count */}
              <div className="space-y-2">
                <Label data-testid="label-color-count">Number of Colors: {colorCount[0]}</Label>
                <Slider
                  value={colorCount}
                  onValueChange={setColorCount}
                  min={3}
                  max={10}
                  step={1}
                  className="w-full"
                  data-testid="slider-color-count"
                />
                <p className="text-xs text-gray-500">
                  Extract 3-10 dominant colors from your image
                </p>
              </div>

              {/* Extract Button */}
              <Button
                onClick={handleExtractColors}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
                data-testid="button-extract"
              >
                Extract Colors
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Extracting colors..."
            successMessage="Colors extracted successfully!"
            errorMessage="Failed to extract colors. Please try again."
          />
        )}

        {/* Color Palette Display */}
        {colors.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Color Palette</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAllColors}
                  data-testid="button-copy-all"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Preview */}
              {files[0].preview && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <img
                    src={files[0].preview}
                    alt="Source"
                    className="max-w-full h-auto mx-auto max-h-64 object-contain"
                    data-testid="preview-image"
                  />
                </div>
              )}

              {/* Color Swatches */}
              <div className="grid grid-cols-1 gap-3" data-testid="color-palette">
                {colors.map((color, index) => {
                  const rgb = hexToRgb(color);
                  const isCopied = copiedColor === color;

                  return (
                    <div
                      key={index}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => copyToClipboard(color)}
                      data-testid={`color-card-${index}`}
                    >
                      <div className="flex items-center">
                        <div
                          className="w-24 h-24 flex items-center justify-center"
                          style={{ backgroundColor: color }}
                        >
                          {isCopied && (
                            <Check className="h-6 w-6" style={{ color: getTextColor(color) }} />
                          )}
                        </div>
                        <div className="flex-1 p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">HEX</p>
                              <p className="font-mono font-semibold text-sm" data-testid={`hex-${index}`}>
                                {color.toUpperCase()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">RGB</p>
                              <p className="font-mono text-sm" data-testid={`rgb-${index}`}>
                                {rgb.r}, {rgb.g}, {rgb.b}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Click to copy</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Color Palette as Gradient */}
              <div className="mt-6">
                <Label className="mb-2 block" data-testid="label-palette-preview">Palette Preview</Label>
                <div className="h-16 rounded-lg overflow-hidden flex" data-testid="palette-preview">
                  {colors.map((color, index) => (
                    <div
                      key={index}
                      className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: color }}
                      onClick={() => copyToClipboard(color)}
                      title={`Click to copy ${color}`}
                      data-testid={`palette-swatch-${index}`}
                    />
                  ))}
                </div>
              </div>

              {/* Export Formats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="mb-2 block" data-testid="label-export-formats">Export Formats</Label>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">CSS Array</p>
                    <code className="bg-white p-2 rounded block text-xs overflow-x-auto" data-testid="export-css">
                      [{colors.map(c => `'${c}'`).join(', ')}]
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tailwind Colors</p>
                    <code className="bg-white p-2 rounded block text-xs overflow-x-auto" data-testid="export-tailwind">
                      {colors.map((c, i) => `'color${i + 1}': '${c}'`).join(', ')}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4">About Color Palette Extraction</h2>
          <div className="prose prose-sm max-w-none">
            <p>
              Extract dominant colors from any image to create beautiful color palettes. Perfect for:
            </p>
            <ul>
              <li><strong>Design Projects:</strong> Match colors from inspiration images</li>
              <li><strong>Web Development:</strong> Create consistent color schemes</li>
              <li><strong>Branding:</strong> Extract colors from logos and photos</li>
              <li><strong>Art & Photography:</strong> Analyze color composition</li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              <strong>Pro Tip:</strong> Use high-quality images with distinct colors for best results. The tool analyzes the most frequently occurring colors in your image.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
