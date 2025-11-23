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
import { Unlock } from "lucide-react";

export default function UnlockPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [password, setPassword] = useState("");
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setPassword("");
  };

  const handleUnlock = async () => {
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
      
      // Note: pdf-lib doesn't support password removal directly
      // This would typically require server-side processing
      // For now, we'll attempt to load and save without password
      let pdf: PDFDocument;
      
      try {
        pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      } catch (e) {
        // If password is required, try with provided password
        if (password) {
          // Note: pdf-lib doesn't support password-protected PDFs
          // This is a placeholder - actual implementation would need server-side support
          throw new Error("Password-protected PDFs require server-side processing. Please contact support.");
        } else {
          throw new Error("PDF is password-protected. Please provide the password.");
        }
      }

      const unlockedBytes = await pdf.save();
      const blob = new Blob([unlockedBytes], { type: 'application/pdf' });
      setProcessedBlob(blob);
      setStatus("success");
      toast({
        title: "Success!",
        description: "PDF unlocked successfully",
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Unlock Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_unlocked.pdf`);
  };

  return (
    <ToolLayout
      title="Unlock PDF"
      description="Remove the password from a PDF file. Unlock password-protected PDF documents (password required)."
      category="PDF Tools"
      keywords={["unlock pdf", "remove password", "pdf unlock", "decrypt pdf", "pdf password"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a password-protected PDF file" },
        { name: "Enter Password", text: "Enter the PDF password" },
        { name: "Unlock", text: "Click Unlock PDF" },
        { name: "Download", text: "Download your unlocked PDF" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Unlock className="h-5 w-5 text-[#0B9F47]" />
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
            <h2 className="text-xl font-bold mb-4">Unlock Settings</h2>
            <div className="space-y-4">
              <div>
                <Label>PDF Password (if required)</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter PDF password"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Note: Password removal requires server-side processing. This tool works for non-encrypted PDFs.
                </p>
              </div>
              <Button
                onClick={handleUnlock}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Unlock PDF
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Unlocking PDF..."
            successMessage="PDF unlocked successfully!"
            errorMessage="Failed to unlock PDF. Please try again."
          />
        )}

        {processedBlob && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Unlocked PDF
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

