import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Book, FileText, Download, Loader2 } from "lucide-react";
import { convertPdfToEpub } from "@/lib/pdf-to-epub";

export default function PDFToEPUB() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsConverting(true);
    setProgress(0);

    try {
      const file = files[0].file;
      const epubBlob = await convertPdfToEpub(file, (percent) => {
        setProgress(Math.round(percent));
      });

      // Download the file
      const url = URL.createObjectURL(epubBlob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = file.name.replace(/\.[^/.]+$/, "") + ".epub";
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF converted to EPUB successfully!",
      });
    } catch (error) {
      console.error("Conversion error:", error);
      toast({
        title: "Error",
        description: "Failed to convert PDF to EPUB. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <ToolLayout
      title="PDF to EPUB"
      description="Convert PDF file to EPUB file. Transform PDF documents into EPUB ebooks."
      category="PDF Tools"
      keywords={["pdf to epub", "convert pdf", "pdf to ebook", "pdf converter", "pdf to epub converter"]}
      howToSteps={[
        { name: "Upload PDF", text: "Select a PDF file to convert" },
        { name: "Convert", text: "Click the Convert to EPUB button" },
        { name: "Download", text: "Download your newly created EPUB file" },
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
              {isConverting && (
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Converting...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#0B9F47] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleConvert}
                disabled={isConverting}
                className="w-full md:w-auto px-8 bg-[#0B9F47] hover:bg-[#098a3e] text-white"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Convert to EPUB
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="bg-[#0B9F47]/5 border border-[#0B9F47]/10 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-3">Why convert PDF to EPUB?</h3>
          <ul className="space-y-2 text-gray-600 list-disc list-inside">
            <li>Reflowable text makes reading easier on mobile devices and e-readers.</li>
            <li>Customize font size, style, and line spacing in your reader application.</li>
            <li>Better navigation with chapter support and table of contents.</li>
            <li>Smaller file sizes compared to complex PDFs.</li>
          </ul>
        </div>
      </div>
    </ToolLayout>
  );
}

