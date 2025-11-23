import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { Scissors } from "lucide-react";

export default function SplitPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [splitMode, setSplitMode] = useState<"all" | "range">("all");
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [processedBlobs, setProcessedBlobs] = useState<Blob[]>([]);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlobs([]);
  };

  const handleSplit = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const pdfBytes = await files[0].file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const totalPages = pdf.getPageCount();
      const blobs: Blob[] = [];

      if (splitMode === "all") {
        // Split each page into separate PDF
        for (let i = 0; i < totalPages; i++) {
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(pdf, [i]);
          newPdf.addPage(page);
          const pdfBytes = await newPdf.save();
          blobs.push(new Blob([pdfBytes], { type: 'application/pdf' }));
        }
      } else {
        // Split by range
        const start = Math.max(1, startPage) - 1;
        const end = Math.min(totalPages, endPage);
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(pdf, Array.from({ length: end - start }, (_, i) => start + i));
        pages.forEach((page) => newPdf.addPage(page));
        const pdfBytes = await newPdf.save();
        blobs.push(new Blob([pdfBytes], { type: 'application/pdf' }));
      }

      setProcessedBlobs(blobs);
      setStatus("success");
      toast({
        title: "Success!",
        description: `PDF split into ${blobs.length} file(s)`,
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Split Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAll = async () => {
    if (processedBlobs.length === 0) return;
    const zip = new JSZip();
    processedBlobs.forEach((blob, index) => {
      zip.file(`page_${index + 1}.pdf`, blob);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, "split-pdfs.zip");
  };

  return (
    <ToolLayout
      title="Split PDF"
      description="Split PDF into one or multiple PDF files. Extract pages or divide your document into separate files."
      category="PDF Tools"
      keywords={["split pdf", "divide pdf", "extract pages", "pdf splitter", "separate pdf"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file to split" },
        { name: "Choose Mode", text: "Select split all pages or specify a range" },
        { name: "Split", text: "Click Split PDF" },
        { name: "Download", text: "Download all split files as ZIP" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Scissors className="h-5 w-5 text-[#0B9F47]" />
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
        </div>

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Split Settings</h2>
            <div className="space-y-4">
              <div>
                <Label>Split Mode</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="all"
                      checked={splitMode === "all"}
                      onChange={(e) => setSplitMode(e.target.value as "all" | "range")}
                      className="mr-2"
                    />
                    Split All Pages
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="range"
                      checked={splitMode === "range"}
                      onChange={(e) => setSplitMode(e.target.value as "all" | "range")}
                      className="mr-2"
                    />
                    Split Range
                  </label>
                </div>
              </div>

              {splitMode === "range" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Page</Label>
                    <Input
                      type="number"
                      min="1"
                      value={startPage}
                      onChange={(e) => setStartPage(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>End Page</Label>
                    <Input
                      type="number"
                      min="1"
                      value={endPage}
                      onChange={(e) => setEndPage(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleSplit}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Split PDF
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Splitting PDF..."
            successMessage="PDF split successfully!"
            errorMessage="Failed to split PDF. Please try again."
          />
        )}

        {processedBlobs.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Split Files ({processedBlobs.length})</h2>
            <DownloadButton
              onClick={handleDownloadAll}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download All as ZIP
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

