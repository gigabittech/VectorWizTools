import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Book, FileText, Download, Loader2 } from "lucide-react";
import { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import ProcessingIndicator from "@/components/tools/shared/ProcessingIndicator";

export default function PDFToAZW3() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus("processing");

    try {
      const file = files[0].file;
      
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/tools/pdf-to-azw3", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Conversion failed");
      }

      const azw3Blob = await response.blob();

      // Download the file
      const url = URL.createObjectURL(azw3Blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = file.name.replace(/\.[^/.]+$/, "") + ".azw3";
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus("success");
      toast({
        title: "Success",
        description: "PDF converted to AZW3 successfully!",
      });
    } catch (error: any) {
      console.error("Conversion error:", error);
      setStatus("error");
      toast({
        title: "Error",
        description: error.message || "Failed to convert PDF to AZW3. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <ToolLayout
      title="PDF to AZW3"
      description="Convert PDF file to AZW3 file. Transform PDF documents into AZW3 ebooks."
      category="PDF Tools"
      keywords={["pdf to azw3", "convert pdf", "pdf to ebook", "pdf converter", "pdf to kindle"]}
      howToSteps={[
        { name: "Upload PDF", text: "Select a PDF file to convert" },
        { name: "Convert", text: "Click the Convert to AZW3 button" },
        { name: "Download", text: "Download your newly created AZW3 ebook" },
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

          {files.length > 0 && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <Button
                onClick={handleConvert}
                disabled={status === "processing"}
                className="w-full md:w-auto px-8 bg-[#0B9F47] hover:bg-[#098a3e] text-white"
              >
                {status === "processing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Convert to AZW3
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Converting your PDF to AZW3 via CloudConvert..."
            successMessage="Conversion complete! Your AZW3 ebook is downloading."
            errorMessage="Failed to convert. Please check your PDF file."
          />
        )}

        <div className="bg-[#0B9F47]/5 border border-[#0B9F47]/10 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-3">Why convert PDF to AZW3?</h3>
          <ul className="space-y-2 text-gray-600 list-disc list-inside">
            <li>AZW3 (Kindle Format 8) supports modern ebook features like improved typography and layout.</li>
            <li>Better reading experience on Amazon Kindle devices compared to standard PDFs.</li>
            <li>Allows you to adjust font sizes and styles on your e-reader.</li>
            <li>Preserves document structure while making it compatible with Kindle eco-system.</li>
          </ul>
        </div>
      </div>
    </ToolLayout>
  );
}
