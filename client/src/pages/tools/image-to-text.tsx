import { useState, useEffect, useRef } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { createWorker } from "tesseract.js";
import {
  FileText,
  Download,
  Copy,
  RotateCcw,
  ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Zap,
  Settings2,
  Columns,
  Cpu,
  Globe
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ImageToText() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState<string>("");
  const [processingLog, setProcessingLog] = useState<string>("Initializing...");
  const [preprocessedPreview, setPreprocessedPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<"ai" | "matrix">("ai");
  const [visionRemaining, setVisionRemaining] = useState<number>(5);

  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize or reset Vision AI usage count based on date
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem("vision_ai_date");
    const storedCount = localStorage.getItem("vision_ai_count");

    if (storedDate !== today) {
      localStorage.setItem("vision_ai_date", today);
      localStorage.setItem("vision_ai_count", "0");
      setVisionRemaining(5);
    } else {
      const count = parseInt(storedCount || "0");
      setVisionRemaining(Math.max(0, 5 - count));
    }
  }, []);

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setExtractedText("");
    setStatus("idle");
    setProgress(0);
    setPreprocessedPreview(null);
  };

  /**
   * High-Performance Sharpening & Contrast Preprocessing
   */
  const preprocessImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        let scale = 1.5;
        if (img.width < 1000) scale = 2.5;

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 1. Grayscale + Level Correction
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = data[i + 1] = data[i + 2] = gray;
        }

        // 2. Simple High-Pass Filter (Sharpening)
        // Instead of complex convolution, we'll boost local contrast
        for (let i = 0; i < data.length; i += 4) {
          const v = data[i];
          // Boost contrast around the midtones
          const contrast = 1.4;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const newVal = factor * (v - 128) + 128;
          data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, newVal));
        }

        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        setPreprocessedPreview(dataUrl);
        resolve(dataUrl);
      };
      img.onerror = () => reject("Failed to load image");
    });
  };

  const handleExtractText = async () => {
    if (files.length === 0) {
      toast({ title: "No File", description: "Please upload an image first", variant: "destructive" });
      return;
    }

    setStatus("processing");
    setProgress(5);
    setProcessingLog("Preparing image matrix...");

    try {
      if (mode === "ai") {
        // --- VISION AI ENGINE (Backend Gemini Call) ---
        // Check daily limit for Vision AI
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem("vision_ai_date");
        let count = parseInt(localStorage.getItem("vision_ai_count") || "0");

        if (storedDate !== today) {
          count = 0;
          localStorage.setItem("vision_ai_date", today);
          localStorage.setItem("vision_ai_count", "0");
        }

        if (count >= 5) {
          toast({
            title: "Daily Limit Reached",
            description: "You've used your 5 free Vision AI scans for today. Please use Matrix mode or come back tomorrow.",
            variant: "destructive"
          });
          setStatus("idle");
          setProgress(0);
          return;
        }

        setProcessingLog("Connecting to Ultra Vision AI Cloud...");
        setProgress(15);

        const formData = new FormData();
        formData.append("file", files[0].file);

        const response = await fetch("/api/tools/image-to-text", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          let errorMessage = "Extraction failed";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.text) {
          throw new Error("No text was found in this image.");
        }

        // Increment usage count on success
        const newCount = parseInt(localStorage.getItem("vision_ai_count") || "0") + 1;
        localStorage.setItem("vision_ai_count", newCount.toString());
        setVisionRemaining(Math.max(0, 5 - newCount));

        setProgress(100);
        setExtractedText(data.text);
        setStatus("success");

      } else {
        // --- MATRIX OFFLINE ENGINE (Tesseract) ---
        const processedImageUrl = await preprocessImage(files[0].file);
        setProgress(20);
        setProcessingLog("Initializing Local Matrix Worker...");

        const worker = await createWorker('eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(20 + Math.round(m.progress * 80));
              setProcessingLog(`Scanning matrix... ${Math.round(m.progress * 100)}%`);
            }
          }
        });

        await worker.setParameters({
          tessedit_pageseg_mode: '3',
          preserve_interword_spaces: '1',
        } as any);

        const { data: { text } } = await worker.recognize(processedImageUrl);
        await worker.terminate();

        setExtractedText(text.trim());
        setStatus("success");
      }

      toast({
        title: "Extraction Complete",
        description: `Successfully extracted text using ${mode.toUpperCase()} engine`,
      });
    } catch (error) {
      console.error("Extraction Error:", error);
      setStatus("error");
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Matrix processing failed",
        variant: "destructive",
      });
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    toast({ title: "Copied!", description: "Text copied to clipboard" });
  };

  const handleDownload = () => {
    if (!extractedText) return;
    const fileName = files[0]?.file.name.split('.')[0] || "extracted-text";
    downloadFile(extractedText, `${fileName}.txt`, "text/plain");
  };

  return (
    <ToolLayout
      title="Pro Image OCR"
      description="Advanced text extraction for complex documents and handwriting."
      category="Image Tools"
      keywords={["OCR", "text extraction", "handwriting to text", "advanced ocr"]}
      howToSteps={[
        { name: "Upload", text: "Upload any scan, screenshot or photo." },
        { name: "Select Engine", text: "Choose Vision AI for complex text or Matrix for fast offline use." },
        { name: "Result", text: "Exactly extracted text ready for use." },
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-8 pb-20">

        {/* Engine Switcher */}
        <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl border border-gray-100 shadow-xl flex gap-2 max-w-fit mx-auto">
          <Button
            onClick={() => setMode("ai")}
            className={cn(
              "h-12 px-8 rounded-2xl font-black gap-2 transition-all",
              mode === "ai" ? "bg-[#0B9F47] text-white shadow-lg shadow-green-200" : "bg-transparent text-gray-500 hover:bg-gray-100"
            )}
          >
            <Cpu className="h-4 w-4" /> Vision AI (Ultra Precision)
          </Button>
            <Button
            onClick={() => setMode("matrix")}
            className={cn(
              "h-12 px-8 rounded-2xl font-black gap-2 transition-all",
              mode === "matrix" ? "bg-[#0B9F47] text-white shadow-lg shadow-green-200" : "bg-transparent text-gray-500 hover:bg-gray-100"
            )}
          >
            <Settings2 className="h-4 w-4" /> Matrix (Offline Unlimited)
          </Button>
        </div>

        {/* Main Interface Card */}
        <div className="relative overflow-hidden bg-white border border-gray-100 rounded-[2.5rem] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] transition-all">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0B9F47] via-emerald-400 to-green-300" />

          <div className="p-8 md:p-12">

            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3 px-5 py-2.5 bg-green-50 rounded-2xl border border-green-100">
                <Globe className={cn("h-5 w-5 text-[#0B9F47]", mode === "ai" && "animate-spin-slow")} />
                <span className="text-sm font-black text-gray-800 tracking-tight">
                  {mode === "ai" ? `Gemini Ultra AI (${visionRemaining} scans left today)` : "Tesseract Matrix Engine (Unlimited)"}
                </span>
              </div>
              <div className="hidden md:flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                {mode === "ai" ? "Cloud Enhanced • Accuracy 99%" : "Device Local • Private"}
              </div>
            </div>

            {/* Uploader Section */}
            {status === "idle" && files.length === 0 && (
              <div className="animate-in fade-in duration-500">
                <FileUploader
                  accept="image/*"
                  maxFiles={1}
                  onFilesSelected={handleFilesSelected}
                  multiple={false}
                  className="border-2 border-dashed border-gray-100 hover:border-green-200 transition-colors rounded-[2.5rem] bg-gray-50/30 p-16"
                />
              </div>
            )}

            {/* Selected File & Action */}
            {files.length > 0 && status === "idle" && (
              <div className="space-y-8 animate-in zoom-in-95 duration-300">
                <div className="group relative flex items-center gap-8 p-10 bg-gradient-to-br from-gray-50/50 to-white rounded-[2rem] border border-gray-100 shadow-inner">
                  <div className="h-40 w-40 bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500 shrink-0">
                    <img src={files[0].preview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-3xl truncate text-gray-900 mb-2">{files[0].file.name}</p>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-gray-500 font-bold flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        {(files[0].file.size / 1024).toFixed(1)} KB
                      </p>
                      <div className="h-1 w-1 rounded-full bg-gray-300" />
                      <p className="text-sm text-[#0B9F47] font-black uppercase tracking-wider">Ready for {mode === "ai" ? "AI Scan" : "Unlimited Scan"}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles([])}
                    className="absolute top-6 right-6 h-12 w-12 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all shadow-none"
                  >
                    <RotateCcw className="h-6 w-6" />
                  </Button>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={handleExtractText}
                    className="w-full max-w-md bg-[#0B9F47] hover:bg-emerald-600 text-white h-16 text-xl font-black rounded-2xl shadow-xl shadow-green-200/40 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 group"
                  >
                    <Wand2 className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                    {mode === "ai" ? "Start Ultra AI Scan" : "Extract Offline Text"}
                  </Button>
                </div>
              </div>
            )}

            {/* Processing State */}
            {status === "processing" && (
              <div className="py-24 flex flex-col items-center text-center space-y-10 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-[60px] animate-pulse" />
                  <div className="relative h-28 w-28 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-green-50/50">
                    <Loader2 className="h-14 w-14 text-[#0B9F47] animate-spin" />
                  </div>
                </div>
                <div className="space-y-4 max-w-sm">
                  <h3 className="text-4xl font-black text-gray-900 tracking-tight">{progress}%</h3>
                  <p className="text-xl font-black text-gray-800">{processingLog}</p>
                  <p className="text-sm text-gray-400 font-bold leading-relaxed px-4">
                    {mode === "ai" ? "Deep Learning models are identifying character vectors and semantics..." : "Reconstructing bitmap data into text matrix locally."}
                  </p>
                </div>
                <div className="w-full max-w-md">
                  <Progress value={progress} className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100 shadow-inner" indicatorClassName="bg-gradient-to-r from-green-400 via-[#0B9F47] to-emerald-600" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {status === "success" && extractedText && (
          <div className="animate-in slide-in-from-bottom-12 duration-700 ease-out space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6">
              <h2 className="text-4xl font-black text-gray-900 flex items-center gap-5">
                <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                  <CheckCircle2 className="h-10 w-10 text-[#0B9F47]" />
                </div>
                Extracted Text
              </h2>
              <div className="flex items-center gap-4">
                <Button onClick={handleCopy} variant="outline" className="h-16 px-10 rounded-[1.8rem] hover:bg-green-50 hover:text-[#0B9F47] border-gray-200 font-black gap-4 transition-all shadow-xl shadow-gray-100">
                  <Copy className="h-6 w-6" />
                  Copy
                </Button>
                <Button onClick={handleDownload} className="h-16 px-10 rounded-[1.8rem] bg-gray-900 text-white border-none font-black gap-4 transition-all hover:bg-black shadow-2xl">
                  <Download className="h-6 w-6" />
                  Download
                </Button>
                <Button onClick={() => setFiles([])} variant="ghost" className="h-16 w-16 rounded-[1.8rem] hover:bg-gray-100 text-gray-400">
                  <RotateCcw className="h-7 w-7" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-6 bg-gradient-to-bl from-gray-100 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mb-8 flex items-center gap-3">
                    <Zap className="h-3 w-3 fill-current text-yellow-400" /> Processed Scan
                  </h4>
                  <div className="aspect-[3/4] rounded-[2rem] border border-gray-50 overflow-hidden bg-gray-50 flex flex-col shadow-inner">
                    <div className="flex-1 overflow-auto p-6 scrollbar-hide">
                      <img
                        src={preprocessedPreview || files[0]?.preview}
                        alt="Scan"
                        className="w-full h-auto object-contain shadow-2xl rounded-2xl grayscale-0 hover:grayscale-0 transition-all duration-700"
                      />
                    </div>
                    <div className="bg-gray-100/50 p-6 border-t border-gray-200 flex items-center justify-between text-[11px] font-black uppercase text-gray-500">
                      <span>{mode === "ai" ? "Vision View" : "Matrix View"}</span>
                      <span className="flex items-center gap-2">
                        Full Resolution <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col h-full min-h-[600px] transition-all group hover:shadow-[0_40px_80px_-40px_rgba(11,159,71,0.15)]">
                  <div className="bg-gray-50/80 px-10 py-6 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-3">
                      <Columns className="h-4 w-4" /> Final Extraction
                    </span>
                    <div className="flex gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-200" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-200" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-200" />
                    </div>
                  </div>
                  <div className="flex-1 p-12">
                    <Textarea
                      ref={textareaRef}
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      className="w-full h-full min-h-[500px] text-xl font-normal leading-relaxed text-gray-800 border-none focus-visible:ring-0 p-0 resize-none selection:bg-green-100 scrollbar-hide bg-transparent placeholder:text-gray-200"
                      placeholder="AI text will appear here..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="p-20 bg-red-50/50 border border-red-100 rounded-[4rem] text-center space-y-8 animate-in zoom-in-95 duration-500 shadow-2xl shadow-red-100/20">
            <div className="h-28 w-28 bg-red-100/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-14 w-14 text-red-600" />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-black text-red-900 tracking-tight">System Interruption</h3>
              <p className="text-red-700/60 font-bold max-w-sm mx-auto leading-relaxed text-lg">
                The {mode === "ai" ? "Vision AI" : "Matrix Worker"} encountered an issue. Please check your image or environment.
              </p>
            </div>
            <Button onClick={() => setStatus("idle")} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 rounded-[1.8rem] px-12 h-16 text-lg font-black transition-all">
              Reset System
            </Button>
          </div>
        )}


      </div>
    </ToolLayout>
  );
}

