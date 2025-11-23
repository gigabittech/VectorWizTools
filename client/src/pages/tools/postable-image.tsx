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
import { Share2 } from "lucide-react";

const socialSizes = [
  { name: "Instagram Post", width: 1080, height: 1080 },
  { name: "Instagram Story", width: 1080, height: 1920 },
  { name: "Facebook Post", width: 1200, height: 630 },
  { name: "Twitter/X Post", width: 1200, height: 675 },
  { name: "LinkedIn Post", width: 1200, height: 627 },
  { name: "Pinterest Pin", width: 1000, height: 1500 },
  { name: "YouTube Thumbnail", width: 1280, height: 720 },
];

export default function PostableImage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [selectedSize, setSelectedSize] = useState("Instagram Post");
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setProcessedPreview(null);
  };

  const handleCreatePostable = async () => {
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
      const size = socialSizes.find(s => s.name === selectedSize);
      if (!size) throw new Error('Invalid size selected');

      const img = await loadImage(files[0].file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = size.width;
      canvas.height = size.height;

      // Fill with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate scaling to fit while maintaining aspect ratio
      const imgAspect = img.width / img.height;
      const canvasAspect = size.width / size.height;

      let drawWidth = size.width;
      let drawHeight = size.height;
      let drawX = 0;
      let drawY = 0;

      if (imgAspect > canvasAspect) {
        // Image is wider - fit to width
        drawHeight = size.width / imgAspect;
        drawY = (size.height - drawHeight) / 2;
      } else {
        // Image is taller - fit to height
        drawWidth = size.height * imgAspect;
        drawX = (size.width - drawWidth) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          setProcessedBlob(blob);
          setProcessedPreview(URL.createObjectURL(blob));
          setStatus("success");
          toast({
            title: "Success!",
            description: "Social media image created successfully",
          });
        }
      }, 'image/jpeg', 0.92);
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
    downloadFile(processedBlob, `${baseName}_${selectedSize.replace(/\s+/g, '-').toLowerCase()}.jpg`);
  };

  return (
    <ToolLayout
      title="Postable Image"
      description="Create social media ready images. Resize and format images for Instagram, Facebook, Twitter, LinkedIn, and more."
      category="Image Tools"
      keywords={["social media image", "instagram size", "facebook post", "twitter image", "social media resize"]}
      howToSteps={[
        { name: "Upload Image", text: "Upload your image" },
        { name: "Select Platform", text: "Choose a social media platform" },
        { name: "Create", text: "Click Create Postable Image" },
        { name: "Download", text: "Download your formatted image" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#0B9F47]" />
            Upload Image
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
            <h2 className="text-xl font-bold mb-4">Social Media Settings</h2>
            <div className="space-y-4">
              <div>
                <Label>Platform / Size</Label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {socialSizes.map(size => (
                      <SelectItem key={size.name} value={size.name}>
                        {size.name} ({size.width}×{size.height})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreatePostable}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Create Postable Image
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Creating social media image..."
            successMessage="Image created successfully!"
            errorMessage="Failed to create image. Please try again."
          />
        )}

        {processedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Your Postable Image</h2>
            <img src={processedPreview} alt="Postable" className="max-w-full h-auto rounded-lg mb-4" />
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Image
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

