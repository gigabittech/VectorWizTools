import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { applyFilters, FilterOptions } from "@/lib/imageProcessing";
import { downloadFile } from "@/lib/fileUtils";
import { Wand2, RotateCcw } from "lucide-react";

export default function ImageFilter() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [filteredBlob, setFilteredBlob] = useState<Blob | null>(null);
  const [filteredPreview, setFilteredPreview] = useState<string | null>(null);
  
  // Filter states
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);
  const [blur, setBlur] = useState([0]);
  const [grayscale, setGrayscale] = useState(false);
  const [sepia, setSepia] = useState(false);
  const [invert, setInvert] = useState(false);
  
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setFilteredBlob(null);
    setFilteredPreview(null);
    resetFilters();
  };

  const resetFilters = () => {
    setBrightness([100]);
    setContrast([100]);
    setSaturation([100]);
    setBlur([0]);
    setGrayscale(false);
    setSepia(false);
    setInvert(false);
  };

  const handleApplyFilters = async () => {
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
      const filterOptions: FilterOptions = {
        brightness: brightness[0],
        contrast: contrast[0],
        saturation: saturation[0],
        blur: blur[0],
        grayscale,
        sepia,
        invert,
      };

      const blob = await applyFilters(files[0].file, filterOptions);
      
      setFilteredBlob(blob);
      const previewUrl = URL.createObjectURL(blob);
      setFilteredPreview(previewUrl);
      
      setStatus("success");
      toast({
        title: "Success!",
        description: "Filters applied successfully",
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Filter Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!filteredBlob || files.length === 0) return;

    const originalName = files[0].file.name;
    const extension = originalName.split('.').pop() || 'png';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const newFilename = `${baseName}_filtered.${extension}`;

    downloadFile(filteredBlob, newFilename);
  };

  const filterPresets = [
    {
      name: "Vintage",
      action: () => {
        setSepia(true);
        setContrast([110]);
        setSaturation([80]);
        setBrightness([95]);
      },
    },
    {
      name: "Black & White",
      action: () => {
        setGrayscale(true);
        setContrast([115]);
        setBrightness([100]);
      },
    },
    {
      name: "High Contrast",
      action: () => {
        setContrast([140]);
        setBrightness([105]);
        setSaturation([110]);
      },
    },
    {
      name: "Soft Blur",
      action: () => {
        setBlur([3]);
        setBrightness([105]);
      },
    },
  ];

  return (
    <ToolLayout
      title="Image Filter & Effects"
      description="Apply filters and effects to images online for free. Add grayscale, sepia, blur, brightness, contrast, and saturation adjustments. Create stunning photo effects instantly."
      category="Image Tools"
      keywords={["image filter", "photo effects", "grayscale image", "sepia filter", "blur image", "adjust brightness", "adjust contrast"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image file" },
        { name: "Adjust Filters", text: "Use sliders and toggles to apply filters and adjustments" },
        { name: "Preview", text: "See the filtered result in real-time" },
        { name: "Download", text: "Download your filtered image" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-[#0B9F47]" />
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

        {/* Filter Controls */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Filter Controls</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  data-testid="button-reset"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filter Presets */}
              <div>
                <Label className="mb-3 block">Quick Presets</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {filterPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={preset.action}
                      data-testid={`preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Brightness */}
              <div className="space-y-2">
                <Label data-testid="label-brightness">Brightness: {brightness[0]}%</Label>
                <Slider
                  value={brightness}
                  onValueChange={setBrightness}
                  min={0}
                  max={200}
                  step={5}
                  className="w-full"
                  data-testid="slider-brightness"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-2">
                <Label data-testid="label-contrast">Contrast: {contrast[0]}%</Label>
                <Slider
                  value={contrast}
                  onValueChange={setContrast}
                  min={0}
                  max={200}
                  step={5}
                  className="w-full"
                  data-testid="slider-contrast"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-2">
                <Label data-testid="label-saturation">Saturation: {saturation[0]}%</Label>
                <Slider
                  value={saturation}
                  onValueChange={setSaturation}
                  min={0}
                  max={200}
                  step={5}
                  className="w-full"
                  data-testid="slider-saturation"
                />
              </div>

              {/* Blur */}
              <div className="space-y-2">
                <Label data-testid="label-blur">Blur: {blur[0]}px</Label>
                <Slider
                  value={blur}
                  onValueChange={setBlur}
                  min={0}
                  max={20}
                  step={1}
                  className="w-full"
                  data-testid="slider-blur"
                />
              </div>

              {/* Effect Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Label htmlFor="grayscale" className="cursor-pointer">Grayscale</Label>
                  <Switch
                    id="grayscale"
                    checked={grayscale}
                    onCheckedChange={setGrayscale}
                    data-testid="switch-grayscale"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Label htmlFor="sepia" className="cursor-pointer">Sepia</Label>
                  <Switch
                    id="sepia"
                    checked={sepia}
                    onCheckedChange={setSepia}
                    data-testid="switch-sepia"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Label htmlFor="invert" className="cursor-pointer">Invert</Label>
                  <Switch
                    id="invert"
                    checked={invert}
                    onCheckedChange={setInvert}
                    data-testid="switch-invert"
                  />
                </div>
              </div>

              {/* Apply Button */}
              <Button
                onClick={handleApplyFilters}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
                data-testid="button-apply"
              >
                Apply Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Applying filters to your image..."
            successMessage="Filters applied successfully!"
            errorMessage="Failed to apply filters. Please try again."
          />
        )}

        {/* Preview and Download */}
        {filteredBlob && filteredPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Filtered Image Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={filteredPreview}
                  alt="Filtered preview"
                  className="max-w-full h-auto mx-auto"
                  data-testid="preview-image"
                />
              </div>

              <DownloadButton
                onClick={handleDownload}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
              >
                Download Filtered Image
              </DownloadButton>
            </CardContent>
          </Card>
        )}

        {/* Information */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4">About Image Filters</h2>
          <div className="prose prose-sm max-w-none">
            <p>
              Our free online image filter tool lets you enhance and transform your photos with professional effects:
            </p>
            <ul>
              <li><strong>Brightness:</strong> Make images lighter or darker</li>
              <li><strong>Contrast:</strong> Adjust the difference between light and dark areas</li>
              <li><strong>Saturation:</strong> Control color intensity</li>
              <li><strong>Blur:</strong> Add soft focus or motion effects</li>
              <li><strong>Grayscale:</strong> Convert to black and white</li>
              <li><strong>Sepia:</strong> Create vintage, warm-toned photos</li>
              <li><strong>Invert:</strong> Reverse all colors for negative effects</li>
            </ul>
            <p>
              Use the presets for quick effects, or fine-tune individual settings for complete control.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
