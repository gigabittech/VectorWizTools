import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { loadImage, resizeImage } from "@/lib/imageProcessing";
import { User } from "lucide-react";

const profileSizes = [
  { name: "LinkedIn", width: 400, height: 400 },
  { name: "Facebook", width: 400, height: 400 },
  { name: "Twitter/X", width: 400, height: 400 },
  { name: "Instagram", width: 400, height: 400 },
  { name: "GitHub", width: 420, height: 420 },
  { name: "Custom", width: 0, height: 0 },
];

export default function ProfilePhotoMaker() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [selectedSize, setSelectedSize] = useState("LinkedIn");
  const [customWidth, setCustomWidth] = useState(400);
  const [customHeight, setCustomHeight] = useState(400);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setProcessedPreview(null);
  };

  const handleCreateProfile = async () => {
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
      const size = profileSizes.find(s => s.name === selectedSize);
      const width = size?.name === "Custom" ? customWidth : size?.width || 400;
      const height = size?.name === "Custom" ? customHeight : size?.height || 400;

      const img = await loadImage(files[0].file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      // Create square canvas
      const sizeValue = Math.max(width, height);
      canvas.width = sizeValue;
      canvas.height = sizeValue;

      // Fill with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate crop to make it square (center crop)
      const minDimension = Math.min(img.width, img.height);
      const sourceX = (img.width - minDimension) / 2;
      const sourceY = (img.height - minDimension) / 2;

      // Draw image centered and cropped to square
      ctx.drawImage(
        img,
        sourceX, sourceY, minDimension, minDimension,
        0, 0, sizeValue, sizeValue
      );

      canvas.toBlob((blob) => {
        if (blob) {
          setProcessedBlob(blob);
          setProcessedPreview(URL.createObjectURL(blob));
          setStatus("success");
          toast({
            title: "Success!",
            description: "Profile photo created successfully",
          });
        }
      }, 'image/png', 0.95);
    } catch (error) {
      setStatus("error");
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_profile.png`);
  };

  return (
    <ToolLayout
      title="Profile Photo Maker"
      description="Create professional profile photos for social media. Crop and resize images to perfect square dimensions for LinkedIn, Facebook, Twitter, and more."
      category="Image Tools"
      keywords={["profile photo", "avatar maker", "social media photo", "profile picture", "square crop"]}
      howToSteps={[
        { name: "Upload Photo", text: "Upload your photo" },
        { name: "Select Size", text: "Choose a platform or custom size" },
        { name: "Create", text: "Click Create Profile Photo" },
        { name: "Download", text: "Download your professional profile photo" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-[#0B9F47]" />
            Upload Photo
          </h2>
          <FileUploader
            accept="image/*"
            maxFiles={1}
            maxSize={50 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["image/jpeg", "image/png", "image/webp"]}
          />
        </div>

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Profile Photo Settings</h2>
            <div className="space-y-4">
              <div>
                <Label>Platform / Size</Label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {profileSizes.map(size => (
                      <SelectItem key={size.name} value={size.name}>
                        {size.name} {size.width > 0 && `(${size.width}×${size.height})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSize === "Custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Width (px)</Label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md"
                      min="100"
                      max="2000"
                    />
                  </div>
                  <div>
                    <Label>Height (px)</Label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md"
                      min="100"
                      max="2000"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreateProfile}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Create Profile Photo
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Creating profile photo..."
            successMessage="Profile photo created successfully!"
            errorMessage="Failed to create profile photo. Please try again."
          />
        )}

        {processedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Your Profile Photo</h2>
            <div className="flex justify-center mb-4">
              <img
                src={processedPreview}
                alt="Profile photo"
                className="rounded-full w-64 h-64 object-cover border-4 border-gray-200"
              />
            </div>
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Profile Photo
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

