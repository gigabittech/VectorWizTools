import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Book, FileText, Download, Loader2 } from "lucide-react";
import { convertEpubToPdf } from "@/lib/epub-to-pdf";

export default function EPUBToPDF() {
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
      const pdfBlob = await convertEpubToPdf(file, (percent) => {
        setProgress(Math.round(percent));
      });

      // Download the file
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "EPUB converted to PDF successfully!",
      });
    } catch (error) {
      console.error("Conversion error:", error);
      toast({
        title: "Error",
        description: "Failed to convert EPUB to PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <ToolLayout
      title="EPUB to PDF"
      description="Convert EPUB to PDF file. Transform EPUB ebooks into PDF documents."
      category="PDF Tools"
      keywords={["epub to pdf", "convert epub", "ebook to pdf", "epub converter", "ebook converter"]}
      howToSteps={[
        { name: "Upload EPUB", text: "Select an EPUB file to convert" },
        { name: "Convert", text: "Click the Convert to PDF button" },
        { name: "Download", text: "Download your newly created PDF file" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Book className="h-5 w-5 text-[#0070f3]" />
            Upload EPUB
          </h2>
          <FileUploader
            accept=".epub,application/epub+zip"
            maxFiles={1}
            maxSize={100 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["application/epub+zip"]}
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
                      className="bg-[#0070f3] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleConvert}
                disabled={isConverting}
                className="w-full md:w-auto px-8 bg-[#0070f3] hover:bg-[#0060d0] text-white"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Convert to PDF
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="bg-[#0070f3]/5 border border-[#0070f3]/10 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-3">Why convert EPUB to PDF?</h3>
          <ul className="space-y-2 text-gray-600 list-disc list-inside">
            <li>PDFs are universally compatible and preserve exact formatting across all devices.</li>
            <li>Perfect for printing ebooks with consistent page layouts.</li>
            <li>Easy to annotate and share with colleagues or friends.</li>
            <li>Standard format for official documents and professional publishing.</li>
          </ul>
        </div>
      </div>
    </ToolLayout>
  );
}

