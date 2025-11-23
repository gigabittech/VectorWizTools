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
import { FileText } from "lucide-react";

export default function RearrangePDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [pageOrder, setPageOrder] = useState("");
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = async (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setPageOrder("");
    if (uploadedFiles.length > 0) {
      try {
        const pdfBytes = await uploadedFiles[0].file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const count = pdf.getPageCount();
        setTotalPages(count);
        setPageOrder(Array.from({ length: count }, (_, i) => i + 1).join(','));
      } catch (error) {
        setTotalPages(null);
      }
    }
  };

  const parsePageOrder = (input: string): number[] => {
    return input.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
  };

  const handleRearrange = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (!pageOrder.trim()) {
      toast({
        title: "No Order Specified",
        description: "Please specify the page order",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const pdfBytes = await files[0].file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const pageCount = pdf.getPageCount();
      
      const order = parsePageOrder(pageOrder);
      const validOrder = order.filter(p => p >= 1 && p <= pageCount);
      
      if (validOrder.length !== pageCount) {
        throw new Error("Page order must include all pages");
      }

      const newPdf = await PDFDocument.create();
      const pageIndices = validOrder.map(p => p - 1);
      const copiedPages = await newPdf.copyPages(pdf, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const newPdfBytes = await newPdf.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      setProcessedBlob(blob);
      setStatus("success");
      toast({
        title: "Success!",
        description: "Pages rearranged successfully",
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Rearrangement Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_rearranged.pdf`);
  };

  return (
    <ToolLayout
      title="Rearrange PDF"
      description="Rearrange the pages of a PDF file. Reorder pages in any sequence you want."
      category="PDF Tools"
      keywords={["rearrange pdf", "reorder pages", "pdf organizer", "page order", "pdf sorter"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file" },
        { name: "Set Order", text: "Enter page order (e.g., 3,1,2,4)" },
        { name: "Rearrange", text: "Click Rearrange PDF" },
        { name: "Download", text: "Download your reordered PDF" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0B9F47]" />
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
          {totalPages && (
            <p className="text-sm text-gray-600 mt-2">
              Total pages: {totalPages}
            </p>
          )}
        </div>

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Page Order</h2>
            <div className="space-y-4">
              <div>
                <Label>Page Order (comma-separated)</Label>
                <Input
                  value={pageOrder}
                  onChange={(e) => setPageOrder(e.target.value)}
                  placeholder="e.g., 3,1,2,4"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter page numbers in the order you want them (must include all pages)
                </p>
              </div>
              <Button
                onClick={handleRearrange}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Rearrange PDF
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Rearranging pages..."
            successMessage="Pages rearranged successfully!"
            errorMessage="Failed to rearrange pages. Please try again."
          />
        )}

        {processedBlob && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Rearranged PDF
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

