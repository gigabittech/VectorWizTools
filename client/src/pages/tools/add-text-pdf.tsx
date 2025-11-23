import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { PDFDocument, rgb } from "pdf-lib";
import { Type } from "lucide-react";

export default function AddTextPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [text, setText] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [fontSize, setFontSize] = useState(12);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
  };

  const handleAddText = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (!text.trim()) {
      toast({
        title: "No Text",
        description: "Please enter text to add",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const pdfBytes = await files[0].file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const pageCount = pdf.getPageCount();
      
      if (pageNumber < 1 || pageNumber > pageCount) {
        throw new Error(`Page number must be between 1 and ${pageCount}`);
      }

      const page = pdf.getPage(pageNumber - 1);
      const { width, height } = page.getSize();
      
      page.drawText(text, {
        x: (width * x) / 100,
        y: height - (height * y) / 100,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      const newPdfBytes = await pdf.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      setProcessedBlob(blob);
      setStatus("success");
      toast({
        title: "Success!",
        description: "Text added successfully",
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_with-text.pdf`);
  };

  return (
    <ToolLayout
      title="Add Text"
      description="Add Text to PDF. Insert text annotations and labels into your PDF documents."
      category="PDF Tools"
      keywords={["add text to pdf", "pdf text", "pdf annotate", "insert text", "pdf editor"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file" },
        { name: "Enter Text", text: "Enter the text you want to add" },
        { name: "Set Position", text: "Choose page and position" },
        { name: "Add", text: "Click Add Text" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Type className="h-5 w-5 text-[#0B9F47]" />
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
            <h2 className="text-xl font-bold mb-4">Text Settings</h2>
            <div className="space-y-4">
              <div>
                <Label>Text to Add</Label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text here..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Page Number</Label>
                  <Input
                    type="number"
                    min="1"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Font Size</Label>
                  <Input
                    type="number"
                    min="8"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>X Position (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={x}
                    onChange={(e) => setX(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Y Position (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={y}
                    onChange={(e) => setY(Number(e.target.value))}
                  />
                </div>
              </div>
              <Button
                onClick={handleAddText}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Add Text
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Adding text..."
            successMessage="Text added successfully!"
            errorMessage="Failed to add text. Please try again."
          />
        )}

        {processedBlob && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download PDF
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

