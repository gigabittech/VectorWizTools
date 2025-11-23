import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Edit } from "lucide-react";

export default function EditPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    toast({
      title: "Coming Soon",
      description: "Full PDF editing features are coming soon. Use our other PDF tools for specific editing tasks.",
      variant: "default",
    });
  };

  return (
    <ToolLayout
      title="Edit PDF"
      description="Free PDF Editor. Edit text, images, and pages in your PDF documents."
      category="PDF Tools"
      keywords={["edit pdf", "pdf editor", "modify pdf", "pdf editing", "edit document"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file to edit" },
        { name: "Edit", text: "Use the editing tools to modify your PDF" },
        { name: "Save", text: "Save your edited PDF" },
        { name: "Download", text: "Download your edited PDF" },
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
              <strong>Note:</strong> Full PDF editing features are coming soon. In the meantime, you can use our other PDF tools:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-blue-800">
              <li>Add Text to PDF</li>
              <li>Add Watermark</li>
              <li>Delete Pages</li>
              <li>Rotate PDF</li>
              <li>Crop PDF</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

