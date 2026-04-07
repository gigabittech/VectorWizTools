import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { prefixUrl } from "@/lib/queryClient";
import { Instagram, Download, Loader2 } from "lucide-react";

export default function InstagramDownloader() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!url) {
      toast({
        title: "No URL",
        description: "Please enter an Instagram post URL",
        variant: "destructive",
      });
      return;
    }

    // Clean and validate URL
    const cleanUrl = url.split("?")[0].replace(/\/$/, "");
    const shortcodeMatch = cleanUrl.match(/(?:p|reel|tv)\/([^\/?#&]+)/);
    
    if (!shortcodeMatch) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Instagram post or reel URL",
        variant: "destructive",
      });
      return;
    }

    const shortcode = shortcodeMatch[1];

    try {
      setStatus("processing");
      setImageUrl(null);

      // We'll use a direct URL and a CORS-proxy to allow downloading the blob
      const directImageUrl = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(directImageUrl)}`;

      // Fetch the image data through the proxy to bypass CORS
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Failed to fetch image data");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      setImageUrl(blobUrl);
      setStatus("success");

      // Auto-trigger the download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `instagram-image-${shortcode}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Your image is downloading!",
      });

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: "Unable to download this image. Please ensure the URL is correct and public.",
        variant: "destructive",
      });
      setStatus("idle");
    }
  };

  const triggerDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `instagram-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ToolLayout
      title="Instagram Image Downloader"
      description="Download high-quality images from Instagram posts easily. Just paste the link and download."
      category="Social Media Tools"
      keywords={["instagram downloader", "download instagram image", "instagram to jpg", "save instagram photo"]}
      howToSteps={[
        { name: "Copy URL", text: "Copy the link of the Instagram post" },
        { name: "Paste & Fetch", text: "Paste the link and click Download" },
        { name: "Save Image", text: "The image will be downloaded to your device" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Instagram className="h-5 w-5 text-[#E4405F]" />
            Enter Instagram URL
          </h2>
          <div className="flex gap-2">
            <Input
              placeholder="https://www.instagram.com/p/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-white/50 border-gray-200 focus:border-[#E4405F] focus:ring-[#E4405F]"
            />
            <Button
              onClick={handleDownload}
              className="bg-[#E4405F] hover:bg-[#D33955] text-white transition-colors"
              disabled={status === "processing"}
            >
              {status === "processing" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching
                </>
              ) : (
                "Get Image"
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Supports Posts, Reels, and IGTV image previews.
          </p>
        </div>

        {imageUrl && status === "success" && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group rounded-lg overflow-hidden border border-gray-100 max-h-[400px]">
                <img 
                  src={imageUrl} 
                  alt="Instagram content" 
                  className="max-w-full h-auto object-contain"
                />
              </div>
              <Button 
                onClick={triggerDownload}
                size="lg"
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Original Image
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
