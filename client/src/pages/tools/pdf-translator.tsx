import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Languages, FileDown, Loader2 } from "lucide-react";
import { translatePDF, TranslationProgress } from "@/lib/pdf-translation-engine";
import { downloadFile } from "@/lib/fileUtils";

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
];

export default function PDFTranslator() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [targetLang, setTargetLang] = useState('es');
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const [translatedPdfBytes, setTranslatedPdfBytes] = useState<Uint8Array | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setTranslatedPdfBytes(null);
    setStatus("idle");
    setProgress(null);
  };

  const handleTranslate = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    try {
      const bytes = await translatePDF(
        files[0].file,
        targetLang,
        (p) => {
          setProgress(p);
        }
      );
      setTranslatedPdfBytes(bytes);
      setStatus("success");
      toast({
        title: "Translation Complete",
        description: "Your PDF has been translated successfully.",
      });
    } catch (error) {
      console.error(error);
      setStatus("error");
      toast({
        title: "Translation Failed",
        description: error instanceof Error ? error.message : "An error occurred during translation",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!translatedPdfBytes) return;
    const originalName = files[0].file.name.replace(/\.[^/.]+$/, "");
    const blob = new Blob([translatedPdfBytes as any], { type: "application/pdf" });
    downloadFile(
      blob,
      `${originalName}_${targetLang}.pdf`,
      "application/pdf"
    );
  };

  return (
    <ToolLayout
      title="PDF Translator"
      description="Translate your PDF documents while preserving the original layout and formatting."
      category="PDF Tools"
      keywords={["translate pdf", "pdf translation", "multilingual pdf", "pdf translator", "translate document"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload the PDF file you want to translate" },
        { name: "Select Language", text: "Choose the target language for translation" },
        { name: "Translate", text: "Wait for the process to complete" },
        { name: "Download", text: "Download your newly translated PDF" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Languages className="h-5 w-5 text-[#0B9F47]" />
            Upload PDF
          </h2>
          <FileUploader
            accept="application/pdf"
            maxFiles={1}
            maxSize={100 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["application/pdf"]}
          />
        </div>

        {files.length > 0 && status !== "success" && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <div className="mb-6">
              <Label className="text-base mb-2 block">Target Language</Label>
              <Select value={targetLang} onValueChange={setTargetLang} disabled={status === "processing"}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleTranslate}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white h-12 text-lg"
              disabled={status === "processing"}
            >
              {status === "processing" ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Translating...
                </>
              ) : (
                "Translate PDF"
              )}
            </Button>
          </div>
        )}

        {status === "processing" && progress && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <ProcessingIndicator
              status="processing"
              message={progress.message || "Translating PDF..."}
              progress={progress.currentPage && progress.totalPages ? (progress.currentPage / progress.totalPages) * 100 : undefined}
            />
          </div>
        )}

        {status === "success" && translatedPdfBytes && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 text-center">
            <div className="mb-6 py-8 flex flex-col items-center justify-center border-2 border-dashed border-green-200 rounded-lg bg-green-50/50">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <FileDown className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-1">Translation Ready!</h3>
              <p className="text-green-700">Your translated PDF is ready for download.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={() => setStatus("idle")}
                className="flex-1 h-12"
              >
                Translate Another
              </Button>
              <DownloadButton
                onClick={handleDownload}
                className="flex-1 h-12 bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              >
                Download Translated PDF
              </DownloadButton>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 text-center">
            <div className="mb-6 py-8 flex flex-col items-center justify-center border-2 border-dashed border-red-200 rounded-lg bg-red-50/50">
              <h3 className="text-xl font-bold text-red-900 mb-1">Translation Failed</h3>
              <p className="text-red-700">{progress?.message || "An error occurred."}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setStatus("idle")}
              className="w-full h-12"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

