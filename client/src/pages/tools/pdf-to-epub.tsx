import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Book } from "lucide-react";

export default function PDFToEPUB() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    toast({
      title: "Server Processing Required",
      description: "PDF to EPUB conversion requires server-side processing. This feature is coming soon.",
      variant: "default",
    });
  };

  return (
    <ToolLayout
      title="PDF to EPUB"
      description="Convert PDF file to EPUB file. Transform PDF documents into EPUB ebooks."
      category="PDF Tools"
      keywords={["pdf to epub", "convert pdf", "pdf to ebook", "pdf converter", "pdf to epub converter"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file" },
        { name: "Convert", text: "Click Convert to EPUB" },
        { name: "Download", text: "Download your EPUB file" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Book className="h-5 w-5 text-[#0B9F47]" />
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
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> PDF to EPUB conversion requires server-side processing. This feature is coming soon.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

