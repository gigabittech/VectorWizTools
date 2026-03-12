import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";

export default function PDFToWord() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    try {
      setStatus("processing");

      const formData = new FormData();
      formData.append("file", files[0].file);

      const res = await fetch("/tools/api/tools/pdf-to-word", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Conversion failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].file.name.replace(".pdf", ".docx");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF converted to Word successfully",
      });

      setStatus("idle");
    } catch (error: any) {
      console.error(error);

      toast({
        title: "Conversion Failed",
        description: error.message || "Unable to convert PDF. Please ensure LibreOffice is installed on the server.",
        variant: "destructive",
      });

      setStatus("idle");
    }
  };


  return (
    <ToolLayout
      title="PDF to Word"
      description="Convert PDF to Word Document. Transform PDF files into editable Word documents."
      category="PDF Tools"
      keywords={["pdf to word", "convert pdf", "pdf converter", "pdf to docx", "pdf to doc"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file" },
        { name: "Convert", text: "Click Convert to Word" },
        { name: "Download", text: "Download your Word document" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0B9F47]" />
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

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <Button
              onClick={handleConvert}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
              disabled={status === "processing"}
            >
              Convert to Word
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

