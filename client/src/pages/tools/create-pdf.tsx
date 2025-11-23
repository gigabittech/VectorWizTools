import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { FilePlus } from "lucide-react";

const pageSizes = [
  { value: "letter", label: "Letter (8.5 x 11 in)" },
  { value: "a4", label: "A4 (8.27 x 11.69 in)" },
  { value: "legal", label: "Legal (8.5 x 14 in)" },
  { value: "tabloid", label: "Tabloid (11 x 17 in)" },
];

export default function CreatePDF() {
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("New Document");
  const [pageSize, setPageSize] = useState("a4");
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const getPageDimensions = (size: string) => {
    switch (size) {
      case "letter":
        return { width: 612, height: 792 };
      case "a4":
        return { width: 595, height: 842 };
      case "legal":
        return { width: 612, height: 1008 };
      case "tabloid":
        return { width: 792, height: 1224 };
      default:
        return { width: 595, height: 842 };
    }
  };

  const handleCreate = async () => {
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please enter some content",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const { width, height } = getPageDimensions(pageSize);
      
      const page = pdfDoc.addPage([width, height]);
      const fontSize = 12;
      const margin = 50;
      const maxWidth = width - (margin * 2);
      const maxHeight = height - (margin * 2);
      
      // Add title
      page.drawText(title, {
        x: margin,
        y: height - margin - 20,
        size: 18,
        font,
        color: rgb(0, 0, 0),
      });
      
      // Add content (simple text wrapping)
      const lines = content.split('\n');
      let yPos = height - margin - 50;
      
      for (const line of lines) {
        if (yPos < margin) {
          // Add new page if needed
          const newPage = pdfDoc.addPage([width, height]);
          yPos = height - margin;
        }
        
        // Simple word wrapping
        const words = line.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);
          
          if (textWidth > maxWidth && currentLine) {
            page.drawText(currentLine, {
              x: margin,
              y: yPos,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
            yPos -= fontSize + 5;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine) {
          page.drawText(currentLine, {
            x: margin,
            y: yPos,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
          yPos -= fontSize + 5;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setProcessedBlob(blob);
      setStatus("success");
      toast({
        title: "Success!",
        description: "PDF created successfully",
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob) return;
    downloadFile(processedBlob, `${title || "document"}.pdf`);
  };

  return (
    <ToolLayout
      title="Create PDF"
      description="Free PDF Creator. Create a new PDF document from text content."
      category="PDF Tools"
      keywords={["create pdf", "pdf creator", "make pdf", "generate pdf", "new pdf"]}
      howToSteps={[
        { name: "Enter Content", text: "Enter the text content for your PDF" },
        { name: "Set Options", text: "Choose title and page size" },
        { name: "Create", text: "Click Create PDF" },
        { name: "Download", text: "Download your new PDF" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FilePlus className="h-5 w-5 text-[#0B9F47]" />
            PDF Settings
          </h2>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
              />
            </div>
            <div>
              <Label>Page Size</Label>
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizes.map(size => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your content here..."
                rows={10}
              />
            </div>
            <Button
              onClick={handleCreate}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
              disabled={status === "processing"}
            >
              Create PDF
            </Button>
          </div>
        </div>

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Creating PDF..."
            successMessage="PDF created successfully!"
            errorMessage="Failed to create PDF. Please try again."
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

