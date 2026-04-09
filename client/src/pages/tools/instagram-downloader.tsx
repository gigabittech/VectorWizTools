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
    // Increased timeout for better reliability on slow proxies
    const TIMEOUT = 15000; 
    
    const attempts = [
      // 1. Server-side proxy (Most reliable)
      prefixUrl(`/api/instagram-image-proxy?url=${encodeURIComponent(originalUrl)}`),
      // 2. Public high-performance proxies (Fast fallbacks)
      `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&default=404`,
      `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&default=404`,
      `https://ik.imagekit.io/kit/tr:di-404/` + encodeURIComponent(originalUrl),
    ];
    
    for (const proxyUrl of attempts) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        
        const res = await fetch(proxyUrl, { 
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
          }
        });
        
        clearTimeout(timeoutId);
        if (!res.ok) continue;
        
        const blob = await res.blob();
        if (blob.size < 500) continue; // Allow smaller but valid images
        
        if (!blob.type.startsWith("image/")) {
            console.warn("[Instagram] Skip non-image blob:", blob.type);
            continue;
        }
        
        return URL.createObjectURL(blob);
      } catch (error) {
        console.warn(`[Instagram Proxy Failed] ${proxyUrl.split('?')[0]}`);
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

    // Comprehensive regex for all Instagram post types
    const shortcodeMatch = url.match(/(?:\/p\/|\/reel\/|\/reels\/|\/tv\/)([A-Za-z0-9_-]+)/);

    if (!shortcodeMatch) {
      toast({ title: "Invalid URL", description: "Please enter a valid Instagram post, reel, or video URL", variant: "destructive" });
      return;
    }

    const sc = shortcodeMatch[1];
    setShortcode(sc);
    setStatus("processing");
    setImages([]);
    setProgressMsg("Analyzing post content...");

    try {
      const apiRes = await fetch(prefixUrl(`/api/instagram-images?shortcode=${encodeURIComponent(sc)}`));
      let data = await apiRes.json();

      if (!apiRes.ok || !data.images || data.images.length === 0) {
        // FRONTEND FALLBACK: Try public proxies if backend fails
        console.log("[Instagram] Backend failed, trying client-side fallback...");
        setProgressMsg("Backend busy, trying secondary route...");
        
        const proxyUrls = [
            `https://api.vkrfork.com/api/insta?url=${encodeURIComponent(url)}`,
            `https://api.kiryuu.id/api/instagram?url=${encodeURIComponent(url)}`,
            `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.instagram.com/p/${sc}/embed/captioned/`)}`
        ];

        let fallbackSuccess = false;
        for (const pUrl of proxyUrls) {
            try {
                const res = await fetch(pUrl);
                const pData = await res.json();
                let fImages: string[] = [];
                
                // Extract from various formats
                const content = pData.contents || JSON.stringify(pData);
                const imgMatches = content.match(/https:\/\/[^"'\s\\>]*cdninstagram\.com[^"'\s\\>]*(_[nb]\.jpg|1080x1080)/g) || [];
                fImages = [...new Set(imgMatches.map((u: string) => u.replace(/\\u0026/g, "&").replace(/&amp;/g, "&")))];

                if (fImages.length > 0) {
                    data = { images: fImages.slice(0, 20) };
                    fallbackSuccess = true;
                    break;
                }
            } catch (e) { continue; }
        }

        if (!fallbackSuccess) {
            throw new Error(data.error || "Extraction Failed");
        }
      }

      const imageUrls: string[] = data.images;
      const fetched: FetchedImage[] = [];

      for (let i = 0; i < imageUrls.length; i++) {
        setProgressMsg(`Loading HQ Preview ${i + 1}/${imageUrls.length}...`);
        const blobUrl = await loadAsBlob(imageUrls[i]);
        if (blobUrl) {
          fetched.push({ blobUrl, index: i + 1 });
          setImages([...fetched]);
        }
      }

      if (fetched.length === 0) throw new Error("Processing failed");

      setStatus("success");
      setProgressMsg("");
    } catch (err: any) {
      console.error("[Instagram Downloader Error]", err);
      toast({ 
        title: "Extraction Failed", 
        description: "Post is private, or server is temporarily blocked. Please try a different link or wait a minute.", 
        variant: "destructive" 
      });
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
          <div className="absolute -inset-1 bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative backdrop-blur-xl bg-white/80 border border-white/50 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-tr from-[#10b981] to-[#047857] rounded-xl shadow-lg shadow-emerald-100">
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
                  className="h-14 bg-gray-50/50 border-gray-200 focus:border-[#10b981] focus:ring-[#10b981]/20 pl-4 pr-12 text-lg rounded-xl transition-all"
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
                className="h-14 px-10 bg-[#10b981] hover:bg-[#059669] text-white text-lg font-bold rounded-xl shadow-xl shadow-emerald-100 transition-all duration-300 disabled:opacity-70 flex items-center gap-2"
              >
                {status === "processing" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{progressMsg || "Fetching..."}</span>
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    <span>Download</span>
                  </>
                )}
              </Button>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-gray-400">
              <div className="flex items-center gap-1.5 bg-gray-50 py-1.5 px-3 rounded-full">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>Single Posts</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 py-1.5 px-3 rounded-full">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>Carousels (Multiple)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 py-1.5 px-3 rounded-full">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
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
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1 w-full order-2 lg:order-1">
                    {/* Results Grid - Responsive Card Layout */}
                    <div className={`grid gap-6 ${images.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-xl mx-auto'}`}>
                        {images.map((img, i) => (
                        <motion.div
                            key={`${shortcode}-${i}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="group flex flex-col bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                        >
                            {/* Image Preview */}
                            <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                            <img 
                                src={img.blobUrl} 
                                alt={`Instagram content ${img.index}`} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Photo {img.index}
                            </div>
                            </div>

                            {/* Action Bar */}
                            <div className="p-4 bg-white">
                            <Button 
                                onClick={() => triggerDownload(img.blobUrl, img.index)}
                                className="w-full h-11 bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center gap-2 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
                            >
                                <Download className="h-4 w-4" />
                                Download
                            </Button>
                            </div>
                        </motion.div>
                        ))}
                    </div>
                </div>

                {/* Sidebar - Matching Toolzu Profile Style */}
                <div className="w-full lg:w-72 order-1 lg:order-2">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm sticky top-8"
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#10b981] via-[#059669] to-[#047857] p-1">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                                    <Instagram className="h-10 w-10 text-gray-200" />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Post Found</h4>
                                <p className="text-xs text-gray-500 font-medium">Available items</p>
                            </div>
                            
                            <div className="py-4">
                                <span className="text-4xl font-black text-[#10b981]">{images.length}</span>
                            </div>

                            <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
                                Content extracted successfully. Each image is available in high definition.
                            </p>

                            <div className="w-full pt-4">
                                <Button 
                                    variant="outline"
                                    onClick={() => {
                                        images.forEach((img, i) => {
                                          setTimeout(() => triggerDownload(img.blobUrl, img.index), i * 800);
                                        });
                                      }}
                                    className="w-full border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white font-bold rounded-xl"
                                >
                                    Download All
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
              </div>

              {status === "processing" && (
                <div className="flex flex-col items-center justify-center p-12 space-y-4">
                  <Loader2 className="h-10 w-10 text-[#10b981] animate-spin" />
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
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-[#10b981] mb-4">
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