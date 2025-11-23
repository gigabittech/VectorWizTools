import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Book } from "lucide-react";

export default function EPUBToPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    toast({
      title: "Server Processing Required",
      description: "EPUB to PDF conversion requires server-side processing. This feature is coming soon.",
      variant: "default",
    });
  };

  return (
    <ToolLayout
      title="EPUB to PDF"
      description="Convert EPUB to PDF file. Transform EPUB ebooks into PDF documents."
      category="PDF Tools"
      keywords={["epub to pdf", "convert epub", "ebook to pdf", "epub converter", "ebook converter"]}
      howToSteps={[
        { name: "Upload EPUB", text: "Upload an EPUB file" },
        { name: "Convert", text: "Click Convert to PDF" },
        { name: "Download", text: "Download your PDF file" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Book className="h-5 w-5 text-[#0B9F47]" />
            Upload EPUB
          </h2>
          <FileUploader
            accept=".epub,application/epub+zip"
            maxFiles={1}
            maxSize={100 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["application/epub+zip"]}
          />
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> EPUB to PDF conversion requires server-side processing. This feature is coming soon.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

