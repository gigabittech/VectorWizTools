import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { prefixUrl } from "@/lib/queryClient";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight } from "lucide-react";

export default function MSOutlookToPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setDownloadUrl(null);
    setStatus("idle");
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload an Outlook file (.msg or .eml) first",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");
    const formData = new FormData();
    formData.append("file", files[0].file);

    try {
      const response = await fetch(prefixUrl("/api/tools/outlook-to-pdf"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to convert file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const originalName = files[0].file.name;
      const targetName = originalName.replace(/\.[^/.]+$/, "") + ".pdf";

      setDownloadUrl(url);
      setFileName(targetName);
      setStatus("success");

      toast({
        title: "Success!",
        description: "Your Outlook file has been converted to PDF.",
      });
    } catch (error: any) {
      console.error("Conversion error:", error);
      setStatus("error");
      toast({
        title: "Conversion Failed",
        description: error.message || "An error occurred during conversion.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ToolLayout
      title="MS Outlook to PDF"
      description="Upload an Outlook file and Download as a PDF. Convert Outlook emails and messages to PDF format."
      category="PDF Tools"
      keywords={["outlook to pdf", "email to pdf", "msg to pdf", "convert outlook", "outlook converter"]}
      howToSteps={[
        { name: "Upload Outlook File", text: "Upload an Outlook file (.msg or .eml)" },
        { name: "Convert", text: "Click Convert to PDF" },
        { name: "Download", text: "Download your PDF file" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#0B9F47]" />
            Upload Outlook File
          </h2>
          <FileUploader
            accept=".msg,.eml,application/vnd.ms-outlook,message/rfc822"
            maxFiles={1}
            maxSize={100 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["application/vnd.ms-outlook", "message/rfc822", "application/octet-stream"]}
          />

          {files.length > 0 && status === "idle" && (
            <div className="mt-6">
              <Button
                onClick={handleConvert}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
              >
                Convert to PDF
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Converting your Outlook file to PDF..."
            successMessage="Conversion complete!"
            errorMessage="Failed to convert. Please try again."
          />
        )}

        {status === "success" && downloadUrl && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Ready for Download</h2>
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
            >
              Download PDF
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

