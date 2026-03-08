import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";

export default function PDFToWord() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
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

    try {
      setStatus("processing");

      const file = files[0].file;
      const arrayBuffer = await file.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const paragraphs: any[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        let lastY: number | null = null;
        let line = "";

        textContent.items.forEach((item: any) => {
          const str = item.str;
          const y = item.transform[5];

          if (lastY === null) {
            lastY = y;
          }

          // new line detect
          if (lastY !== null && Math.abs(lastY - y) > 5) {
            paragraphs.push(new Paragraph(line));
            line = str;
            lastY = y;
          } else {
            line += " " + str;
          }
        });

        if (line) {
          paragraphs.push(new Paragraph(line));
        }

        paragraphs.push(new Paragraph(""));
      }

      const doc = new Document({
        sections: [
          {
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);

      saveAs(blob, file.name.replace(".pdf", ".docx"));

      toast({
        title: "Success",
        description: "PDF converted to Word successfully",
      });

      setStatus("idle");
    } catch (error) {
      console.error(error);

      toast({
        title: "Conversion Failed",
        description: "Unable to convert PDF",
        variant: "destructive",
      });

      setStatus("idle");
    }
  };

  return (
    <ToolLayout
      title="PDF to Word"
      description="Convert PDF to Word Document. Transform PDF files into editable Word documents."
      category="PDF Tools"
      keywords={["pdf to word", "convert pdf", "pdf converter", "pdf to docx", "pdf to doc"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file" },
        { name: "Convert", text: "Click Convert to Word" },
        { name: "Download", text: "Download your Word document" },
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
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> PDF to Word conversion requires server-side processing. This feature is coming soon with full document conversion support.
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
              Convert to Word
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

