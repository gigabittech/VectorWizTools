import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

export default function PowerpointToPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    toast({
      title: "Server Processing Required",
      description: "Powerpoint to PDF conversion requires server-side processing. This feature is coming soon.",
      variant: "default",
    });
  };

  return (
    <ToolLayout
      title="Powerpoint to PDF"
      description="Upload a PowerPoint presentation and Download as a PDF file. Convert PPT/PPTX files to PDF format."
      category="PDF Tools"
      keywords={["powerpoint to pdf", "ppt to pdf", "pptx to pdf", "convert powerpoint", "presentation to pdf"]}
      howToSteps={[
        { name: "Upload Powerpoint", text: "Upload a PowerPoint file (.ppt or .pptx)" },
        { name: "Convert", text: "Click Convert to PDF" },
        { name: "Download", text: "Download your PDF file" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0B9F47]" />
            Upload Powerpoint
          </h2>
          <FileUploader
            accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            maxFiles={1}
            maxSize={100 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]}
          />
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Powerpoint to PDF conversion requires server-side processing. This feature is coming soon.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

