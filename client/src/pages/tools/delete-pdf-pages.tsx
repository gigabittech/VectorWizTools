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
import { Trash2 } from "lucide-react";

export default function DeletePDFPages() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [pagesToDelete, setPagesToDelete] = useState("");
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = async (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setPagesToDelete("");
    if (uploadedFiles.length > 0) {
      try {
        const pdfBytes = await uploadedFiles[0].file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        setTotalPages(pdf.getPageCount());
      } catch (error) {
        setTotalPages(null);
      }
    }
  };

  const parsePageNumbers = (input: string): number[] => {
    const pages = new Set<number>();
    const parts = input.split(',').map(p => p.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            pages.add(i);
          }
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num)) {
          pages.add(num);
        }
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleDelete = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (!pagesToDelete.trim()) {
      toast({
        title: "No Pages Specified",
        description: "Please specify which pages to delete",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const pdfBytes = await files[0].file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const pageCount = pdf.getPageCount();
      
      const pagesToRemove = parsePageNumbers(pagesToDelete);
      const validPages = pagesToRemove.filter(p => p >= 1 && p <= pageCount);
      
      if (validPages.length === 0) {
        throw new Error("No valid page numbers specified");
      }

      const pagesToKeep = Array.from({ length: pageCount }, (_, i) => i + 1)
        .filter(p => !validPages.includes(p))
        .map(p => p - 1);

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdf, pagesToKeep);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const newPdfBytes = await newPdf.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      setProcessedBlob(blob);
      setStatus("success");
      toast({
        title: "Success!",
        description: `Deleted ${validPages.length} page(s)`,
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_edited.pdf`);
  };

  return (
    <ToolLayout
      title="PDF Page Deleter"
      description="Delete page(s) from a PDF. Remove unwanted pages from your PDF documents."
      category="PDF Tools"
      keywords={["delete pdf pages", "remove pages", "pdf editor", "delete pages", "pdf page remover"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file" },
        { name: "Specify Pages", text: "Enter page numbers to delete (e.g., 1,3,5-7)" },
        { name: "Delete", text: "Click Delete Pages" },
        { name: "Download", text: "Download your edited PDF" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-[#0B9F47]" />
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
            <h2 className="text-xl font-bold mb-4">Delete Settings</h2>
            <div className="space-y-4">
              <div>
                <Label>Pages to Delete</Label>
                <Input
                  value={pagesToDelete}
                  onChange={(e) => setPagesToDelete(e.target.value)}
                  placeholder="e.g., 1,3,5-7 (comma-separated or ranges)"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter page numbers separated by commas, or use ranges like 5-7
                </p>
              </div>
              <Button
                onClick={handleDelete}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Delete Pages
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Deleting pages..."
            successMessage="Pages deleted successfully!"
            errorMessage="Failed to delete pages. Please try again."
          />
        )}

        {processedBlob && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Edited PDF
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

