import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Book, Download, Loader2 } from "lucide-react";
import { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import ProcessingIndicator from "@/components/tools/shared/ProcessingIndicator";
import jsPDF from "jspdf";

export default function MOBIToPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setConvertedBlob(null);
    setStatus("idle");
  };

  const convertToPDF = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    try {
      const file = files[0].file;

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/tools/api/tools/mobi-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Conversion failed");
      }

      const pdfBlob = await response.blob();
      setConvertedBlob(pdfBlob);
      setStatus("success");

      toast({
        title: "Success",
        description: "MOBI file converted to PDF successfully.",
      });
    } catch (error: any) {
      console.error("Conversion error:", error);
      setStatus("error");
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to convert MOBI to PDF.",
        variant: "destructive",
      });
    }
  };



  const handleDownload = () => {
    if (convertedBlob) {
      const url = URL.createObjectURL(convertedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${files[0].file.name.replace(".mobi", "")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <ToolLayout
      title="MOBI to PDF"
      description="Convert MOBI file to PDF file. Transform MOBI ebooks into PDF documents."
      category="PDF Tools"
      keywords={["mobi to pdf", "convert mobi", "ebook to pdf", "mobi converter", "kindle to pdf"]}
      howToSteps={[
        { name: "Upload MOBI", text: "Upload a MOBI file" },
        { name: "Convert", text: "Click Convert to PDF" },
        { name: "Download", text: "Download your PDF file" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Book className="h-5 w-5 text-[#0B9F47]" />
            Upload MOBI
          </h2>
          <FileUploader
            accept=".mobi"
            maxFiles={1}
            maxSize={100 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={[".mobi", "application/x-mobipocket-ebook"]}
          />

          {files.length > 0 && status === "idle" && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={convertToPDF}
                className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white px-8"
              >
                Convert to PDF
              </Button>
            </div>
          )}

          {status !== "idle" && (
            <ProcessingIndicator
              status={status}
              message="Converting your MOBI to PDF via CloudConvert..."
              successMessage="Conversion complete! Your PDF is ready."
              errorMessage="Failed to convert. Please check your MOBI file."
            />
          )}

          {convertedBlob && status === "success" && (
            <div className="mt-6 p-6 border-2 border-dashed border-[#0B9F47] rounded-xl bg-[#0B9F47]/5 flex flex-col items-center">
              <p className="text-[#0B9F47] font-semibold mb-4">Conversion Complete!</p>
              <Button
                onClick={handleDownload}
                className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Conversion is now powered by CloudConvert for high-quality results. Ensure the MOBI file is not DRM protected.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}


