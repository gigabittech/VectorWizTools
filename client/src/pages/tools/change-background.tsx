import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Palette } from "lucide-react";

export default function ChangeBackground() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    toast({
      title: "Image Tool",
      description: "This tool is for images. Use 'Make Background Transparent' or 'Blur Background' for image background editing.",
      variant: "default",
    });
  };

  return (
    <ToolLayout
      title="Change Background"
      description="Change Background of an image. Replace or modify image backgrounds."
      category="PDF Tools"
      keywords={["change background", "replace background", "image background", "background editor"]}
      howToSteps={[
        { name: "Upload Image", text: "Upload an image file" },
        { name: "Change Background", text: "Select new background or edit existing" },
        { name: "Download", text: "Download your edited image" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5 text-[#0B9F47]" />
            Upload Image
          </h2>
          <FileUploader
            accept="image/*"
            maxFiles={1}
            maxSize={50 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["image/jpeg", "image/png", "image/webp"]}
          />
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> For image background editing, use our image tools:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-blue-800">
              <li>Make Background Transparent</li>
              <li>Blur Background Tool</li>
              <li>Remove Background</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

