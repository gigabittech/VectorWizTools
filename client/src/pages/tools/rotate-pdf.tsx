import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { PDFDocument, degrees } from "pdf-lib";
import { RotateCw } from "lucide-react";

const rotationOptions = [
  { value: "90", label: "90° Clockwise" },
  { value: "180", label: "180°" },
  { value: "270", label: "270° Clockwise (90° Counter-clockwise)" },
];

export default function RotatePDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [rotation, setRotation] = useState("90");
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
  };

  const handleRotate = async () => {
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
      const pages = pdf.getPages();
      const rotationValue = Number(rotation);

      pages.forEach((page) => {
        page.setRotation(degrees(page.getRotation().angle + rotationValue));
      });

      const rotatedBytes = await pdf.save();
      const blob = new Blob([rotatedBytes as any], { type: 'application/pdf' });
      setProcessedBlob(blob);
      setStatus("success");
      toast({
        title: "Success!",
        description: "PDF rotated successfully",
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Rotation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_rotated.pdf`);
  };

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate one or more pages in a PDF file. Fix orientation issues and adjust page rotation."
      category="PDF Tools"
      keywords={["rotate pdf", "pdf rotation", "rotate pages", "fix pdf orientation", "pdf rotate"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file" },
        { name: "Select Rotation", text: "Choose rotation angle" },
        { name: "Rotate", text: "Click Rotate PDF" },
        { name: "Download", text: "Download your rotated PDF" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <RotateCw className="h-5 w-5 text-[#0B9F47]" />
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
            <h2 className="text-xl font-bold mb-4">Rotation Settings</h2>
            <div className="space-y-4">
              <div>
                <Label>Rotation Angle</Label>
                <Select value={rotation} onValueChange={setRotation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rotationOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleRotate}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Rotate PDF
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Rotating PDF..."
            successMessage="PDF rotated successfully!"
            errorMessage="Failed to rotate PDF. Please try again."
          />
        )}

        {processedBlob && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Rotated PDF
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

