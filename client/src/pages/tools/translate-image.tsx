import { useState, useEffect, useRef } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
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
  Globe,
  Languages,
  ArrowRightLeft
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const targetLanguages = [
  { name: "English", code: "English" },
  { name: "Bengali", code: "Bengali" },
  { name: "Spanish", code: "Spanish" },
  { name: "French", code: "French" },
  { name: "German", code: "German" },
  { name: "Hindi", code: "Hindi" },
  { name: "Arabic", code: "Arabic" },
  { name: "Chinese", code: "Chinese" },
  { name: "Japanese", code: "Japanese" },
  { name: "Korean", code: "Korean" },
  { name: "Portuguese", code: "Portuguese" },
  { name: "Russian", code: "Russian" },
  { name: "Italian", code: "Italian" },
  { name: "Turkish", code: "Turkish" },
  { name: "Vietnamese", code: "Vietnamese" },
];

export default function TranslateImage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [targetLang, setTargetLang] = useState("English");
  const [translateRemaining, setTranslateRemaining] = useState<number>(5);
  const [processingLog, setProcessingLog] = useState<string>("Initializing...");

  const { toast } = useToast();

  useEffect(() => {
    // Initialize or reset Translation usage count based on date
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem("translate_ia_date");
    const storedCount = localStorage.getItem("translate_ia_count");

    if (storedDate !== today) {
      localStorage.setItem("translate_ia_date", today);
      localStorage.setItem("translate_ia_count", "0");
      setTranslateRemaining(5);
    } else {
      const count = parseInt(storedCount || "0");
      setTranslateRemaining(Math.max(0, 5 - count));
    }
  }, []);

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setExtractedText("");
    setTranslatedText("");
    setStatus("idle");
    setProgress(0);
  };

  const handleTranslate = async () => {
    if (files.length === 0) {
      toast({ title: "No File", description: "Please upload an image first", variant: "destructive" });
      return;
    }

    setStatus("processing");
    setProgress(5);
    setProcessingLog("Analyzing image content...");

    try {
      // Check daily limit for Translation
      const today = new Date().toDateString();
      const storedDate = localStorage.getItem("translate_ia_date");
      let count = parseInt(localStorage.getItem("translate_ia_count") || "0");

      if (storedDate !== today) {
        count = 0;
        localStorage.setItem("translate_ia_date", today);
        localStorage.setItem("translate_ia_count", "0");
      }

      if (count >= 5) {
        toast({
          title: "Daily Limit Reached",
          description: "You've used your 5 free Image Translations for today. Please come back tomorrow.",
          variant: "destructive"
        });
        setStatus("idle");
        setProgress(0);
        return;
      }

      const formData = new FormData();
      formData.append("file", files[0].file);
      formData.append("targetLanguage", targetLang);

      setProcessingLog(`Scanning text for ${targetLang} translation...`);
      setProgress(30);

      const response = await fetch("/api/tools/translate-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Translation failed");
        } else {
          throw new Error(`Server Error: ${response.status}. Please ensure the server is restarted.`);
        }
      }

      const data = await response.json();
      
      // Increment usage count on success
      const newCount = parseInt(localStorage.getItem("translate_ia_count") || "0") + 1;
      localStorage.setItem("translate_ia_count", newCount.toString());
      setTranslateRemaining(Math.max(0, 5 - newCount));

      setProgress(100);
      setExtractedText(data.text);
      setTranslatedText(data.translatedText);
      setStatus("success");

      toast({
        title: "Translation Complete",
        description: `Successfully translated text to ${targetLang}`,
      });
    } catch (error) {
      console.error("Translation Error:", error);
      setStatus("error");
      toast({
        title: "Translation Failed",
        description: error instanceof Error ? error.message : "Matrix processing failed",
        variant: "destructive",
      });
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Text copied to clipboard" });
  };

  const handleDownload = () => {
    if (!translatedText) return;
    const fileName = files[0]?.file.name.split('.')[0] || "translated-text";
    downloadFile(translatedText, `${fileName}-translated.txt`, "text/plain");
  };

  return (
    <ToolLayout
      title="Smart Image Translator"
      description="Professional OCR & Translation engine for documents, signage, and handwriting."
      category="Image Tools"
      keywords={["image translator", "OCR translate", "visual translation", "translate from photo"]}
      howToSteps={[
        { name: "Upload", text: "Upload any image or screenshot." },
        { name: "Select Language", text: "Choose your desired target language." },
        { name: "Translate", text: "AI extracts and translates instantly." },
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-8 pb-20">

        {/* Target Language Selection */}
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-gray-100 shadow-xl flex flex-col md:flex-row items-center gap-4 max-w-fit mx-auto">
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
             <Globe className="h-4 w-4 text-blue-500" />
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detect Language</span>
          </div>
          <ArrowRightLeft className="h-4 w-4 text-gray-300" />
          <div className="flex items-center gap-3">
             <Label className="text-sm font-black text-gray-700 whitespace-nowrap">Translate to:</Label>
             <Select value={targetLang} onValueChange={setTargetLang}>
               <SelectTrigger className="w-[180px] h-10 rounded-xl border-gray-200 bg-white">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent className="rounded-2xl">
                 {targetLanguages.map((lang) => (
                   <SelectItem key={lang.code} value={lang.code} className="rounded-xl">
                     {lang.name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>
        </div>

        {/* Main Interface Card */}
        <div className="relative overflow-hidden bg-white border border-gray-100 rounded-[2.5rem] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] transition-all">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-[#0B9F47] to-emerald-400" />

          <div className="p-8 md:p-12">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 rounded-2xl border border-blue-100">
                <Languages className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-black text-gray-800 tracking-tight">
                  Gemini Translator ({translateRemaining} scans left today)
                </span>
              </div>
              <div className="hidden md:flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Neural AI Enhanced • 100+ Languages
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
                  className="border-2 border-dashed border-gray-100 hover:border-blue-200 transition-colors rounded-[2.5rem] bg-gray-50/30 p-16"
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
                      <p className="text-sm text-blue-600 font-black uppercase tracking-wider">Ready for Visual Translation</p>
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
                    onClick={handleTranslate}
                    className="w-full max-w-md bg-[#0B9F47] hover:bg-emerald-600 text-white h-16 text-xl font-black rounded-2xl shadow-xl shadow-green-200/40 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 group"
                  >
                    <Wand2 className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                    Translate Image to {targetLang}
                  </Button>
                </div>
              </div>
            )}

            {/* Processing State */}
            {status === "processing" && (
              <div className="py-24 flex flex-col items-center text-center space-y-10 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[60px] animate-pulse" />
                  <div className="relative h-28 w-28 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-blue-50/50">
                    <Loader2 className="h-14 w-14 text-blue-600 animate-spin" />
                  </div>
                </div>
                <div className="space-y-4 max-w-sm">
                  <h3 className="text-4xl font-black text-gray-900 tracking-tight">{progress}%</h3>
                  <p className="text-xl font-black text-gray-800">{processingLog}</p>
                  <p className="text-sm text-gray-400 font-bold leading-relaxed px-4">
                    Our AI models are performing semantic analysis and context-aware translation.
                  </p>
                </div>
                <div className="w-full max-w-md">
                  <Progress value={progress} className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100 shadow-inner" indicatorClassName="bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-600" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {status === "success" && (
          <div className="animate-in slide-in-from-bottom-12 duration-700 ease-out space-y-10">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Original Text */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-4">
                     <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-400" /> Raw Extraction
                     </h3>
                     <Button variant="ghost" size="sm" onClick={() => handleCopy(extractedText)} className="text-xs font-bold text-gray-400">
                        <Copy className="h-3 w-3 mr-2" /> Copy
                     </Button>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl min-h-[300px]">
                     <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{extractedText}</p>
                  </div>
               </div>

               {/* Translated Text */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-4">
                     <h3 className="font-black text-blue-900 text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-500" /> Translated ({targetLang})
                     </h3>
                     <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(translatedText)} className="text-xs font-bold text-blue-600">
                           <Copy className="h-3 w-3 mr-2" /> Copy
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleDownload} className="text-xs font-bold text-emerald-600">
                           <Download className="h-3 w-3 mr-2" /> Save
                        </Button>
                     </div>
                  </div>
                  <div className="bg-blue-50/30 p-8 rounded-[2rem] border border-blue-100 shadow-xl min-h-[300px] relative">
                     <div className="absolute top-0 right-0 p-6">
                        <Zap className="h-5 w-5 text-blue-200 fill-current" />
                     </div>
                     <p className="text-gray-900 font-bold text-xl whitespace-pre-wrap leading-relaxed">{translatedText}</p>
                  </div>
               </div>
            </div>

            <Button onClick={() => setFiles([])} variant="outline" className="w-full h-16 rounded-2xl border-dashed border-2 border-gray-200 text-gray-400 font-black hover:bg-gray-50 uppercase tracking-widest text-xs">
               <RotateCcw className="h-4 w-4 mr-3" /> Start New Translation
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="p-20 bg-red-50/50 border border-red-100 rounded-[4rem] text-center space-y-8 animate-in zoom-in-95 duration-500 shadow-2xl shadow-red-100/20">
            <div className="h-28 w-28 bg-red-100/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-14 w-14 text-red-600" />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-black text-red-900 tracking-tight">Translation Interruption</h3>
              <p className="text-red-700/60 font-bold max-w-sm mx-auto leading-relaxed text-lg">
                The AI Translator encountered an issue. Please check your network or try a different image.
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
