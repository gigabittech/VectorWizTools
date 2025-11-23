import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Edit } from "lucide-react";

export default function AnnotatePDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    toast({
      title: "Coming Soon",
      description: "PDF annotation features are coming soon. Use 'Add Text to PDF' for basic annotations.",
      variant: "default",
    });
  };

  return (
    <ToolLayout
      title="Annotate PDF"
      description="Free PDF Annotate. Add comments, highlights, and annotations to your PDF documents."
      category="PDF Tools"
      keywords={["annotate pdf", "pdf annotation", "comment pdf", "highlight pdf", "pdf markup"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file" },
        { name: "Annotate", text: "Add comments, highlights, and annotations" },
        { name: "Save", text: "Save your annotated PDF" },
        { name: "Download", text: "Download your annotated PDF" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Edit className="h-5 w-5 text-[#0B9F47]" />
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
              <strong>Note:</strong> Full PDF annotation features are coming soon. Use "Add Text to PDF" for basic text annotations.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

