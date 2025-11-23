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
import { loadImage } from "@/lib/imageProcessing";
import JSZip from "jszip";
import { Scissors } from "lucide-react";

export default function ImageSplitter() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [processedBlobs, setProcessedBlobs] = useState<Blob[]>([]);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlobs([]);
  };

  const handleSplit = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const img = await loadImage(files[0].file);
      const cellWidth = Math.floor(img.width / cols);
      const cellHeight = Math.floor(img.height / rows);
      const blobs: Blob[] = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) throw new Error('Could not get canvas context');

          canvas.width = cellWidth;
          canvas.height = cellHeight;

          const sourceX = col * cellWidth;
          const sourceY = row * cellHeight;

          ctx.drawImage(
            img,
            sourceX, sourceY, cellWidth, cellHeight,
            0, 0, cellWidth, cellHeight
          );

          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b) => {
              if (b) resolve(b);
              else reject(new Error('Failed to create blob'));
            }, files[0].file.type, 0.95);
          });

          blobs.push(blob);
        }
      }

      setProcessedBlobs(blobs);
      setStatus("success");
      toast({
        title: "Success!",
        description: `Image split into ${blobs.length} pieces`,
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAll = async () => {
    if (processedBlobs.length === 0) return;

    const zip = new JSZip();
    processedBlobs.forEach((blob, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      zip.file(`piece_${row + 1}_${col + 1}.png`, blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, "split-images.zip");
  };

  return (
    <ToolLayout
      title="Image Splitter"
      description="Split images into multiple pieces. Divide photos into grid sections for easy sharing or processing."
      category="Image Tools"
      keywords={["image splitter", "split image", "divide image", "image grid", "cut image"]}
      howToSteps={[
        { name: "Upload Image", text: "Upload an image to split" },
        { name: "Set Grid", text: "Choose number of rows and columns" },
        { name: "Split", text: "Click Split Image" },
        { name: "Download", text: "Download all pieces as a ZIP file" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Scissors className="h-5 w-5 text-[#0B9F47]" />
            Upload Image
          </h2>
          <FileUploader
            accept="image/*"
            maxFiles={1}
            maxSize={50 * 1024 * 1024}
            onFilesSelected={handleFilesSelected}
            multiple={false}
            allowedTypes={["image/jpeg", "image/png", "image/webp"]}
          />
        </div>

        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Split Settings</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rows</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={rows}
                    onChange={(e) => setRows(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Columns</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={cols}
                    onChange={(e) => setCols(Number(e.target.value))}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Image will be split into {rows * cols} pieces ({rows} rows × {cols} columns)
              </p>
              <Button
                onClick={handleSplit}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
              >
                Split Image
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Splitting image..."
            successMessage="Image split successfully!"
            errorMessage="Failed to split image. Please try again."
          />
        )}

        {processedBlobs.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Split Pieces ({processedBlobs.length})</h2>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {processedBlobs.map((blob, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(blob)}
                  alt={`Piece ${index + 1}`}
                  className="w-full h-auto border rounded"
                />
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

