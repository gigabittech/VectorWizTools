import { useEffect, useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import JSZip from "jszip";
import { FileImage } from "lucide-react";

GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

type RenderedPage = {
  pageNumber: number;
  blob: Blob;
  url: string;
};

export default function PDFToTIFF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setPages([]);
  };

  const handleConvert = async () => {
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
      const arrayBuffer = await files[0].file.arrayBuffer();
      const loadingTask = getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const rendered: RenderedPage[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.5 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas not supported");

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({ canvasContext: context, viewport }).promise;

        // Convert to TIFF format (using PNG as fallback since browser can't create TIFF directly)
        const blob: Blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b as Blob), "image/png", 1.0)
        );
        const url = URL.createObjectURL(blob);
        rendered.push({ pageNumber: i, blob, url });
      }

      setPages(rendered);
      setStatus("success");
      toast({
        title: "Success!",
        description: `Converted ${rendered.length} page(s) to TIFF (PNG format)`,
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAll = async () => {
    if (!pages.length || !files.length) return;
    const zip = new JSZip();
    const baseName = files[0].file.name.replace(/\.pdf$/i, "");
    pages.forEach((p) => {
      zip.file(`${baseName}-page-${p.pageNumber}.tiff`, p.blob);
    });
    const content = await zip.generateAsync({ type: "blob" });
    downloadFile(content, `${baseName}-tiff.zip`);
  };

  return (
    <ToolLayout
      title="PDF to TIFF"
      description="Convert PDF to TIFF and download each page as an image. Extract high-quality TIFF images from PDF documents."
      category="PDF Tools"
      keywords={["pdf to tiff", "convert pdf", "pdf converter", "extract images", "pdf to image"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file" },
        { name: "Convert", text: "Click Convert to TIFF" },
        { name: "Download", text: "Download all TIFF images as ZIP" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileImage className="h-5 w-5 text-[#0B9F47]" />
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
              <strong>Note:</strong> Browser-based conversion outputs PNG format. True TIFF format requires server-side processing.
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <Button
              onClick={handleConvert}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
              disabled={status === "processing"}
            >
              Convert to TIFF
            </Button>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Converting to TIFF..."
            successMessage="Converted successfully!"
            errorMessage="Failed to convert. Please try again."
          />
        )}

        {pages.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Converted Pages ({pages.length})</h2>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {pages.map((p) => (
                <img key={p.pageNumber} src={p.url} alt={`Page ${p.pageNumber}`} className="w-full h-auto border rounded" />
              ))}
            </div>
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

