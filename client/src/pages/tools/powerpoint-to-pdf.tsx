import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Download } from "lucide-react";
import { convertPptxToPdf } from "@/lib/pptx-to-pdf";
import { saveAs } from "file-saver";

export default function PowerpointToPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFile, setConvertedFile] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setConvertedFile(null);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsConverting(true);
    try {
      const resultBlob = await convertPptxToPdf(files[0].file);
      setConvertedFile(resultBlob);
      toast({
        title: "Conversion Successful",
        description: "Your PDF file is ready for download.",
      });
    } catch (error: any) {
      console.error("Conversion error:", error);
      toast({
        title: "Conversion Failed",
        description: error.message || "An error occurred during conversion.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedFile) return;
    const fileName = files[0].file.name.replace(/\.pptx$/i, "").replace(/\.ppt$/i, "") + ".pdf";
    saveAs(convertedFile, fileName);
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
            disabled={isConverting}
          />

          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleConvert}
              disabled={files.length === 0 || isConverting || !!convertedFile}
              className="flex-1 bg-[#0B9F47] hover:bg-[#098a3e] text-white"
            >
              {isConverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                "Convert to PDF"
              )}
            </Button>

            {convertedFile && (
              <Button
                onClick={handleDownload}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>

          {!convertedFile && !isConverting && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Conversion is performed entirely in your browser. Your files are never uploaded to our server.
              </p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}


