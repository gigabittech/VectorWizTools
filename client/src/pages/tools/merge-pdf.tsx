import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { PDFDocument } from "pdf-lib";
import { Link } from "lucide-react";

export default function MergePDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: "Not Enough Files",
        description: "Please upload at least 2 PDF files",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const pdfBytes = await file.file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setProcessedBlob(blob);
      setStatus("success");
      toast({
        title: "Success!",
        description: "PDFs merged successfully",
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Merge Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob) return;
    downloadFile(processedBlob, "merged.pdf");
  };

  return (
    <ToolLayout
      title="Merge PDF"
      description="Merge 2 or more PDF files into a single PDF file. Combine multiple documents quickly and easily."
      category="PDF Tools"
      keywords={["merge pdf", "combine pdf", "join pdf", "pdf merger", "merge documents"]}
      howToSteps={[
        { name: "Upload PDFs", text: "Upload 2 or more PDF files" },
        { name: "Merge", text: "Click Merge PDF to combine files" },
        { name: "Download", text: "Download your merged PDF" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Link className="h-5 w-5 text-[#0B9F47]" />
            Upload PDF Files
          </h2>
          <FileUploader
            accept="application/pdf"
            maxFiles={20}
            maxSize={100 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={true}
            allowedTypes={["application/pdf"]}
          />
          {files.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {files.length} PDF{files.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {files.length >= 2 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <Button
              onClick={handleMerge}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
              disabled={status === "processing"}
            >
              Merge PDF
            </Button>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Merging PDFs..."
            successMessage="PDFs merged successfully!"
            errorMessage="Failed to merge PDFs. Please try again."
          />
        )}

        {processedBlob && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <DownloadButton
            onClick={handleDownload}
            className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
          >
            Download Merged PDF
          </DownloadButton>
        </div>
        )}
      </div>
    </ToolLayout>
  );
}

