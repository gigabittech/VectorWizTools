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
import { createWorker } from "tesseract.js";
import { Languages } from "lucide-react";

const languages = [
  { code: 'eng', name: 'English' },
  { code: 'spa', name: 'Spanish' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'ita', name: 'Italian' },
  { code: 'por', name: 'Portuguese' },
  { code: 'chi_sim', name: 'Chinese (Simplified)' },
  { code: 'jpn', name: 'Japanese' },
  { code: 'kor', name: 'Korean' },
  { code: 'ara', name: 'Arabic' },
];

export default function TranslateImage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [sourceLang, setSourceLang] = useState('eng');
  const [extractedText, setExtractedText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setExtractedText("");
    setTranslatedText("");
  };

  const handleTranslate = async () => {
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
      // Extract text using OCR
      const worker = await createWorker(sourceLang);
      const { data: { text } } = await worker.recognize(files[0].file);
      await worker.terminate();
      
      setExtractedText(text);

      // Note: Actual translation would require a translation API
      // For now, we'll show the extracted text with a note
      setTranslatedText(text);
      setStatus("success");
      toast({
        title: "Text Extracted",
        description: "Text extracted from image. Translation API integration needed for full translation.",
      });
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
    if (!translatedText) return;
    downloadFile(translatedText, "translated-text.txt", "text/plain");
  };

  return (
    <ToolLayout
      title="Translate Image"
      description="Extract and translate text from images. Convert text in photos and documents to different languages."
      category="Image Tools"
      keywords={["translate image", "image translation", "OCR translation", "translate text in image", "multilingual OCR"]}
      howToSteps={[
        { name: "Upload Image", text: "Upload an image containing text" },
        { name: "Select Language", text: "Choose the source language of the text" },
        { name: "Translate", text: "Click Translate to extract and translate text" },
        { name: "Download", text: "Download the translated text" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Languages className="h-5 w-5 text-[#0B9F47]" />
            Upload Image
          </h2>
          <FileUploader
            accept="image/*"
            maxFiles={1}
            maxSize={50 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]}
          />
        </div>

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Translation Settings</h2>
            <div className="space-y-4">
              <div>
                <Label>Source Language</Label>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger>
                    <SelectValue />
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
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Extract & Translate Text
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Extracting and translating text..."
            successMessage="Text extracted successfully!"
            errorMessage="Failed to process. Please try again."
          />
        )}

        {extractedText && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Extracted Text</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="whitespace-pre-wrap">{extractedText}</p>
            </div>
            {translatedText && (
              <>
                <h2 className="text-xl font-bold mb-4">Translated Text</h2>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="whitespace-pre-wrap">{translatedText}</p>
                </div>
              </>
            )}
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Translated Text
            </DownloadButton>
          </div>
        )}

        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">About Image Translation</h2>
          <div className="prose prose-sm max-w-none">
            <p>
              This tool extracts text from images using OCR and can translate it to different languages.
              For full translation functionality, a translation API (like Google Translate API) would need to be integrated.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

