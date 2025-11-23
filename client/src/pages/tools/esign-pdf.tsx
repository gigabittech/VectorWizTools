import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PenTool } from "lucide-react";

export default function ESignPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    toast({
      title: "Coming Soon",
      description: "E-signature features are coming soon. This will include drawing signatures and adding signature fields.",
      variant: "default",
    });
  };

  return (
    <ToolLayout
      title="eSign PDF"
      description="E-sign a PDF with a box or with your signature. Add electronic signatures to PDF documents."
      category="PDF Tools"
      keywords={["esign pdf", "pdf signature", "electronic signature", "sign pdf", "pdf sign"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file" },
        { name: "Sign", text: "Draw or upload your signature" },
        { name: "Place", text: "Place signature on the document" },
        { name: "Download", text: "Download your signed PDF" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <PenTool className="h-5 w-5 text-[#0B9F47]" />
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
              <strong>Note:</strong> E-signature features are coming soon. This will include drawing signatures and adding signature fields to PDFs.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

