import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Instagram,
  Download,
  Loader2,
  Images,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react";
import { prefixUrl } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

interface FetchedImage {
  blobUrl: string;
  index: number;
}

export default function InstagramDownloader() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const [images, setImages] = useState<FetchedImage[]>([]);
  const [shortcode, setShortcode] = useState("");
  const [progressMsg, setProgressMsg] = useState("");
  const { toast } = useToast();

  const loadAsBlob = async (originalUrl: string): Promise<string | null> => {
    const attempts = [
      // 1. Server-side proxy (Most reliable)
      prefixUrl(`/api/instagram-image-proxy?url=${encodeURIComponent(originalUrl)}`),
      // 2. Public proxies
      `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}`,
      `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}`,
      `https://proxy.duckduckgo.com/iu/?u=${encodeURIComponent(originalUrl)}`,
    ];
    
    for (const proxyUrl of attempts) {
      try {
        const res = await fetch(proxyUrl, { 
          signal: AbortSignal.timeout(20000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
          }
        });
        
        if (!res.ok) continue;
        
        const blob = await res.blob();
        if (blob.size < 500) continue;
        
        // Final check: is it an image?
        if (!blob.type.startsWith("image/")) {
           console.warn("[Instagram] Blob is not an image:", blob.type);
           continue;
        }
        
        return URL.createObjectURL(blob);
      } catch (error) {
        continue;
      }
    }
    return null;
  };

  const handleFetchImage = async () => {
    if (!url.trim()) {
      toast({ title: "No URL", description: "Please enter an Instagram post URL", variant: "destructive" });
      return;
    }

    const cleanUrl = url.split("?")[0].replace(/\/$/, "");
    const shortcodeMatch = cleanUrl.match(/(?:p|reel|reels|tv)\/([^\/?#&]+)/);

    if (!shortcodeMatch) {
      toast({ title: "Invalid URL", description: "Please enter a valid Instagram post or reel URL", variant: "destructive" });
      return;
    }

    const sc = shortcodeMatch[1];
    setShortcode(sc);
    setStatus("processing");
    setImages([]);
    setProgressMsg("Connecting to Instagram...");

    try {
      const apiRes = await fetch(prefixUrl(`/api/instagram-images?shortcode=${encodeURIComponent(sc)}`));
      const data = await apiRes.json();

      if (!apiRes.ok || !data.images || data.images.length === 0) {
        toast({
          title: "Fetch Failed",
          description: data.error || "Make sure the account is public and the post exists.",
          variant: "destructive",
        });
        setStatus("idle");
        return;
      }

      const imageUrls: string[] = data.images;
      const fetched: FetchedImage[] = [];

      for (let i = 0; i < imageUrls.length; i++) {
        setProgressMsg(`Preparing image ${i + 1} of ${imageUrls.length}...`);
        const blobUrl = await loadAsBlob(imageUrls[i]);
        if (blobUrl) {
          fetched.push({ blobUrl, index: i + 1 });
          if (imageUrls.length > 1) {
            setImages([...fetched]);
          }
        }
      }

      if (fetched.length === 0) {
        toast({
          title: "Download Failed",
          description: "Images were found but could not be processed. Please try again or use a different post.",
          variant: "destructive",
        });
        setStatus("idle");
        return;
      }

      setImages(fetched);
      setStatus("success");
      setProgressMsg("");

      toast({
        title: fetched.length > 1 ? "Carousel Loaded!" : "Image Ready!",
        description: `Found ${fetched.length} image(s).`,
      });
    } catch (err: any) {
      toast({ title: "Error", description: "Connection error. Please try again.", variant: "destructive" });
      setStatus("idle");
    }
  };

  const triggerDownload = (blobUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `instagram-img-${shortcode}-${index}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Download Started", description: `Saving image ${index}...` });
  };

  return (
    <ToolLayout
      title="Instagram Image Downloader"
      description="Save high-quality images from Instagram posts, reels, and carousels instantly."
      category="Social Media Tools"
      keywords={["instagram downloader", "download instagram carousel", "save instagram photo", "instagram reel downloader"]}
      howToSteps={[
        { name: "Copy Link", text: "Copy the Instagram post URL from your browser or app." },
        { name: "Paste URL", text: "Paste the link into the input field and click Get Content." },
        { name: "Save Images", text: "Click the Download button for any image you want to save." },
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Search Bar Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative backdrop-blur-xl bg-white/80 border border-white/50 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-tr from-[#833ab4] to-[#fd1d1d] rounded-xl shadow-lg shadow-pink-100">
                <Instagram className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Paste Post URL</h2>
                <p className="text-sm text-gray-500 font-medium">Supports single images and multi-image posts</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="https://www.instagram.com/p/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && status !== "processing" && handleFetchImage()}
                  className="h-14 bg-gray-50/50 border-gray-200 focus:border-[#fd1d1d] focus:ring-[#fd1d1d]/20 pl-4 pr-12 text-lg rounded-xl transition-all"
                />
                {url && (
                  <button 
                    onClick={() => setUrl("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
              <Button
                onClick={handleFetchImage}
                disabled={status === "processing"}
                className="h-14 px-10 bg-gradient-to-r from-[#833ab4] to-[#fd1d1d] hover:from-[#722a9d] hover:to-[#e61919] text-white text-lg font-bold rounded-xl shadow-xl shadow-red-100 transition-all duration-300 disabled:opacity-70 flex items-center gap-2"
              >
                {status === "processing" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{progressMsg || "Fetching..."}</span>
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    <span>Get Content</span>
                  </>
                )}
              </Button>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-gray-400">
              <div className="flex items-center gap-1.5 bg-gray-50 py-1.5 px-3 rounded-full">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>Single Posts</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 py-1.5 px-3 rounded-full">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>Carousels (Multiple)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 py-1.5 px-3 rounded-full">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>Reels & TV</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {(status === "success" || (status === "processing" && images.length > 0)) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <Images className="h-5 w-5 text-[#fd1d1d]" />
                  <h3 className="text-xl font-bold text-gray-800">
                    {images.length > 1 ? `Found ${images.length} Images` : "Image Found"}
                  </h3>
                </div>
                {images.length > 1 && status === "success" && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      images.forEach((img, i) => {
                        setTimeout(() => triggerDownload(img.blobUrl, img.index), i * 600);
                      });
                    }}
                    className="border-[#fd1d1d] text-[#fd1d1d] hover:bg-[#fd1d1d] hover:text-white font-bold rounded-lg"
                  >
                    Download All
                  </Button>
                )}
              </div>

              {/* Serial Display - Vertically Stacked List */}
              <div className="space-y-8">
                {images.map((img, i) => (
                  <motion.div
                    key={`${shortcode}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative backdrop-blur-md bg-white/90 border border-gray-100 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row">
                      {/* Image Preview Container */}
                      <div className="relative lg:w-[60%] bg-gray-50 flex items-center justify-center p-4 border-b lg:border-b-0 lg:border-r border-gray-100">
                        <img 
                          src={img.blobUrl} 
                          alt={`Instagram content ${img.index}`} 
                          className="max-w-full h-auto rounded-lg shadow-sm group-hover:scale-[1.02] transition-transform duration-500 object-contain max-h-[600px]"
                        />
                        <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold">
                          Image {img.index}
                        </div>
                      </div>

                      {/* Info & Action Panel */}
                      <div className="lg:w-[40%] p-8 flex flex-col justify-between bg-white/50">
                        <div className="space-y-4">
                          <div className="h-1 w-12 bg-gradient-to-r from-[#833ab4] to-[#fd1d1d] rounded-full"></div>
                          <h4 className="text-xl font-black text-gray-900 tracking-tight">Ready for Download</h4>
                          <p className="text-sm text-gray-500 leading-relaxed font-medium">
                            This high-quality image has been extracted and is ready to be saved to your device.
                          </p>
                          
                          <div className="flex flex-col gap-3 pt-4">
                            <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="font-semibold">Original Quality</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="font-semibold">No Watermark</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-8 space-y-3">
                          <Button 
                            onClick={() => triggerDownload(img.blobUrl, img.index)}
                            className="w-full h-14 bg-[#0B9F47] hover:bg-[#09833b] text-white flex items-center justify-center gap-3 rounded-xl font-black text-lg shadow-lg shadow-green-100 transition-all hover:scale-[1.02] active:scale-95"
                          >
                            <Download className="h-5 w-5" />
                            Download Image {img.index}
                          </Button>
                          <Button 
                            variant="ghost"
                            className="w-full h-12 text-gray-400 hover:text-gray-600 font-bold"
                            onClick={() => window.open(img.blobUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in New Tab
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {status === "processing" && (
                <div className="flex flex-col items-center justify-center p-12 space-y-4">
                  <Loader2 className="h-10 w-10 text-[#fd1d1d] animate-spin" />
                  <p className="text-gray-500 font-bold animate-pulse">{progressMsg}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State / Tips */}
        {status === "idle" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12"
          >
            {[
              { icon: <Instagram className="h-5 w-5" />, title: "Open Instagram", text: "Find the post you want to download and copy its link." },
              { icon: <Copy className="h-5 w-5" />, title: "Paste URL", text: "Paste the copied URL into the input field above." },
              { icon: <Download className="h-5 w-5" />, title: "Download", text: "Wait a few seconds and download your high-quality images." }
            ].map((tip, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-[#fd1d1d] mb-4">
                  {tip.icon}
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{tip.title}</h4>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </ToolLayout>
  );
}