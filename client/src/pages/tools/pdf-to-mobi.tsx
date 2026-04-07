import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { prefixUrl } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Book, Download, Loader2, Info } from "lucide-react";

export default function PDFToMOBI() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [epubBlob, setEpubBlob] = useState<Blob | null>(null);
  const [outputFilename, setOutputFilename] = useState("converted.epub");
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setEpubBlob(null);
  };

  const handleConvert = async () => {
    if (!files.length) return;
    setIsConverting(true);

    try {
      const formData = new FormData();
      formData.append("file", files[0].file);

      const response = await fetch(prefixUrl("/api/tools/pdf-to-mobi"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Conversion failed");
      }

      const blob = await response.blob();

      // Pick filename from Content-Disposition header
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename[^;=\n]*=["']?([^"'\n;]+)/i);
      const filename = match?.[1]
        ? decodeURIComponent(match[1])
        : files[0].file.name.replace(/\.pdf$/i, ".epub");

      setOutputFilename(filename);
      setEpubBlob(blob);
      toast({ title: "Done!", description: "Your EPUB is ready to download." });

    } catch (error: any) {
      toast({
        title: "Conversion Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!epubBlob) return;
    const url = URL.createObjectURL(epubBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = outputFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFiles([]);
    setEpubBlob(null);
  };

  return (
    <ToolLayout
      title="PDF to MOBI"
      description="Convert PDF to EPUB — compatible with Kindle, Kobo, Apple Books, and all ebook readers."
      category="PDF Tools"
      keywords={["pdf to mobi", "pdf to epub", "convert pdf", "pdf to ebook", "pdf to kindle"]}
      howToSteps={[
        { name: "Upload PDF", text: "Select the PDF file you want to convert." },
        { name: "Convert", text: "Click Convert — text is extracted and structured into chapters." },
        { name: "Download", text: "Download the EPUB and send it to your Kindle or ebook reader." },
      ]}
    >
      <div className="space-y-6">

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
          <span>
            Converts to <strong>EPUB</strong> — the standard ebook format supported
            natively by Kindle (2022+), Kobo, Apple Books, and Google Play Books.
            Older Kindles can use <strong>Send to Kindle</strong> to auto-convert.
          </span>
        </div>

        {/* Uploader */}
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

          {files.length > 0 && !epubBlob && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleConvert}
                disabled={isConverting}
                className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white px-8"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting…
                  </>
                ) : "Convert to EPUB"}
              </Button>
            </div>
          )}

          {/* Download area */}
          {epubBlob && (
            <div className="mt-6 p-6 border-2 border-dashed border-[#0B9F47] rounded-xl bg-[#0B9F47]/5 flex flex-col items-center gap-3">
              <p className="text-[#0B9F47] font-semibold text-lg">Conversion Complete!</p>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">{outputFilename}</span>
              </p>
              <Button
                onClick={handleDownload}
                className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download EPUB
              </Button>
              <button
                onClick={handleReset}
                className="text-xs text-gray-400 hover:text-gray-600 underline mt-1"
              >
                Convert another file
              </button>
            </div>
          )}
        </div>

        {/* Kindle instructions */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-5">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">
            How to open on Kindle
          </h3>
          <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
            <li>
              <strong>Email:</strong> Send the EPUB to your Kindle address
              (e.g. <span className="font-mono text-xs bg-gray-100 px-1 rounded">yourname@kindle.com</span>)
            </li>
            <li>
              <strong>USB:</strong> Connect Kindle and copy the file to the{" "}
              <span className="font-mono text-xs bg-gray-100 px-1 rounded">documents</span> folder
            </li>
            <li>
              <strong>Send to Kindle app:</strong> Drag and drop into the desktop app
            </li>
          </ol>
        </div>

      </div>
    </ToolLayout>
  );
}
