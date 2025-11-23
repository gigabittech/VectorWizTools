import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { createWorker } from "tesseract.js";
import { FileText, Download, Copy } from "lucide-react";

export default function ImageToText() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [extractedText, setExtractedText] = useState<string>("");
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setExtractedText("");
  };

  const handleExtractText = async () => {
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
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(files[0].file);
      await worker.terminate();
      
      setExtractedText(text);
      setStatus("success");
      toast({
        title: "Success!",
        description: "Text extracted successfully",
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const handleDownload = () => {
    downloadFile(extractedText, "extracted-text.txt", "text/plain");
  };

  return (
    <ToolLayout
      title="Image To Text (OCR)"
      description="Extract text from images using OCR technology. Convert scanned documents, screenshots, and photos to editable text."
      category="Image Tools"
      keywords={["OCR", "text extraction", "image to text", "scan to text", "optical character recognition"]}
      howToSteps={[
        { name: "Upload Image", text: "Upload an image containing text" },
        { name: "Extract Text", text: "Click Extract Text to process the image" },
        { name: "Review Text", text: "Review and edit the extracted text" },
        { name: "Copy or Download", text: "Copy to clipboard or download as text file" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0B9F47]" />
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
            <Button
              onClick={handleExtractText}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
              disabled={status === "processing"}
            >
              Extract Text
            </Button>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Extracting text from image..."
            successMessage="Text extracted successfully!"
            errorMessage="Failed to extract text. Please try again."
          />
        )}

        {extractedText && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Extracted Text</h2>
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <Textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              className="min-h-[300px] font-mono"
              placeholder="Extracted text will appear here..."
            />
          </div>
        )}

        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">About OCR</h2>
          <div className="prose prose-sm max-w-none">
            <p>
              Optical Character Recognition (OCR) technology extracts text from images. This tool works best with:
            </p>
            <ul>
              <li>Clear, high-resolution images</li>
              <li>Text in English</li>
              <li>Well-lit documents with good contrast</li>
              <li>Straight, horizontal text</li>
            </ul>
            <p>
              For best results, ensure your image is clear and the text is readable. Handwritten text may not be recognized accurately.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

