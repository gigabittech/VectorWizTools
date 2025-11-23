import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

export default function WordToPDF() {
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
        description: "Please upload a Word document",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");
    toast({
      title: "Server Processing Required",
      description: "Word to PDF conversion requires server-side processing. This feature will be available soon.",
      variant: "default",
    });
    setStatus("idle");
  };

  return (
    <ToolLayout
      title="Word to PDF"
      description="Convert a Word Document to PDF. Transform Word documents into PDF format."
      category="PDF Tools"
      keywords={["word to pdf", "docx to pdf", "doc to pdf", "convert word", "word converter"]}
      howToSteps={[
        { name: "Upload Word", text: "Upload a Word document (.doc or .docx)" },
        { name: "Convert", text: "Click Convert to PDF" },
        { name: "Download", text: "Download your PDF file" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0B9F47]" />
            Upload Word Document
          </h2>
          <FileUploader
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            maxFiles={1}
            maxSize={100 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]}
          />
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Word to PDF conversion requires server-side processing. This feature is coming soon with full document conversion support.
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <Button
              onClick={handleConvert}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
              disabled={status === "processing"}
            >
              Convert to PDF
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

