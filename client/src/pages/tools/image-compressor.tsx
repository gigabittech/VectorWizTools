import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/imageProcessing";
import { downloadFile } from "@/lib/fileUtils";
import { Minimize2, TrendingDown, CheckCircle2 } from "lucide-react";

export default function ImageCompressor() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [quality, setQuality] = useState([80]);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    savedPercentage: number;
  } | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setCompressedBlob(null);
    setCompressedPreview(null);
    setCompressionStats(null);
  };

  const handleCompress = async () => {
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
      const blob = await compressImage(files[0].file, qualityValue);

      setCompressedBlob(blob);
      
      // Create preview
      const previewUrl = URL.createObjectURL(blob);
      setCompressedPreview(previewUrl);
      
      // Calculate compression stats
      const originalSize = files[0].file.size;
      const compressedSize = blob.size;
      const savedPercentage = ((originalSize - compressedSize) / originalSize) * 100;

      setCompressionStats({
        originalSize,
        compressedSize,
        savedPercentage: Math.max(0, savedPercentage),
      });
      
      setStatus("success");
      toast({
        title: "Success!",
        description: `Image compressed by ${savedPercentage.toFixed(1)}%`,
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Compression Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!compressedBlob || files.length === 0) return;

    const originalName = files[0].file.name;
    const extension = originalName.split('.').pop() || 'jpg';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const newFilename = `${baseName}_compressed.${extension}`;

    downloadFile(compressedBlob, newFilename);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const qualityPresets = [
    { name: "Maximum", value: 95, description: "Highest quality" },
    { name: "High", value: 85, description: "Best balance" },
    { name: "Medium", value: 70, description: "Good compression" },
    { name: "Low", value: 50, description: "Smaller file size" },
  ];

  return (
    <ToolLayout
      title="Image Compressor"
      description="Compress images online for free. Reduce image file size without losing quality. Perfect for web optimization, email attachments, and faster loading times."
      category="Image Tools"
      keywords={["compress image", "reduce file size", "optimize image", "image compression", "shrink image"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image file" },
        { name: "Choose Quality", text: "Select compression quality using the slider or quick presets" },
        { name: "Compress", text: "Click the Compress button to reduce file size" },
        { name: "Download", text: "Download your compressed image" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Minimize2 className="h-5 w-5 text-[#0B9F47]" />
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
            />
          </div>
        </div>

        {/* Compression Settings */}
        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-4">Compression Settings</h2>
            <div className="space-y-6">
              {/* Quality Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label data-testid="label-quality">Quality: {quality[0]}%</Label>
                  <span className="text-sm text-gray-600" data-testid="text-quality-level">
                    {quality[0] >= 90 ? "Maximum" : quality[0] >= 75 ? "High" : quality[0] >= 60 ? "Medium" : "Low"}
                  </span>
                </div>
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
                  Lower quality = smaller file size. Higher quality = better image but larger file.
                </p>
              </div>

              {/* Quick Presets */}
              <div>
                <Label className="mb-3 block">Quick Presets</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {qualityPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant={quality[0] === preset.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQuality([preset.value])}
                      className={quality[0] === preset.value ? "bg-[#0B9F47] hover:bg-[#0B9F47]/90" : ""}
                      data-testid={`preset-${preset.name.toLowerCase()}`}
                    >
                      <div className="text-center">
                        <div className="font-medium text-xs">{preset.name}</div>
                        <div className="text-xs opacity-70">{preset.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Compress Button */}
              <Button
                onClick={handleCompress}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
                data-testid="button-compress"
              >
                Compress Image
              </Button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Compressing your image..."
            successMessage="Image compressed successfully!"
            errorMessage="Failed to compress image. Please try again."
          />
        )}

        {/* Results and Download */}
        {compressedBlob && compressedPreview && compressionStats && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-4">Compression Results</h2>
            <div className="space-y-4">
              {/* Compression Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg" data-testid="stat-original-size">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingDown className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-blue-900">Original</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900" data-testid="text-original-size">
                    {formatBytes(compressionStats.originalSize)}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg" data-testid="stat-compressed-size">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Minimize2 className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-green-900">Compressed</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900" data-testid="text-compressed-size">
                    {formatBytes(compressionStats.compressedSize)}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg" data-testid="stat-saved-percentage">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-purple-900">Saved</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900" data-testid="text-saved-percentage">
                    {compressionStats.savedPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-2">Preview</p>
                <img
                  src={compressedPreview}
                  alt="Compressed preview"
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
                Download Compressed Image
              </DownloadButton>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4">About Image Compression</h2>
          <div className="prose prose-sm max-w-none">
            <p>
              Our free online image compressor helps you reduce file sizes while maintaining visual quality.
              Benefits include:
            </p>
            <ul>
              <li>Faster website loading times</li>
              <li>Reduced bandwidth usage</li>
              <li>Easier email attachments</li>
              <li>Better SEO performance</li>
              <li>Save storage space</li>
            </ul>
            <p>
              The quality slider lets you balance between file size and image quality. We recommend starting
              with 80-85% quality for the best results. You can always adjust and re-compress if needed.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
