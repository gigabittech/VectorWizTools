import { useState, useRef } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { loadImage } from "@/lib/imageProcessing";
import { Eraser } from "lucide-react";

interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function RemoveObjects() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [selections, setSelections] = useState<Selection[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<Selection | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setSelections([]);
    setProcessedBlob(null);
    setProcessedPreview(null);
  };

  const handleImageLoad = (img: HTMLImageElement) => {
    imageRef.current = img;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsSelecting(true);
    setCurrentSelection({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelecting || !currentSelection || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentSelection({
      ...currentSelection,
      width: x - currentSelection.x,
      height: y - currentSelection.y,
    });
  };

  const handleMouseUp = () => {
    if (currentSelection && Math.abs(currentSelection.width) > 5 && Math.abs(currentSelection.height) > 5) {
      const normalized = {
        x: Math.min(currentSelection.x, currentSelection.x + currentSelection.width),
        y: Math.min(currentSelection.y, currentSelection.y + currentSelection.height),
        width: Math.abs(currentSelection.width),
        height: Math.abs(currentSelection.height),
      };
      setSelections([...selections, normalized]);
    }
    setIsSelecting(false);
    setCurrentSelection(null);
  };

  const removeSelection = (index: number) => {
    setSelections(selections.filter((_, i) => i !== index));
  };

  const handleRemoveObjects = async () => {
    if (files.length === 0 || selections.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please upload an image and select objects to remove",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const img = await loadImage(files[0].file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const originalData = new Uint8ClampedArray(data);

      // Process each selection
      selections.forEach(sel => {
        const scaleX = img.width / (canvasRef.current?.width || img.width);
        const scaleY = img.height / (canvasRef.current?.height || img.height);
        const x = Math.floor(sel.x * scaleX);
        const y = Math.floor(sel.y * scaleY);
        const width = Math.floor(sel.width * scaleX);
        const height = Math.floor(sel.height * scaleY);

        // Inpaint the selected area
        for (let py = y; py < y + height; py++) {
          for (let px = x; px < x + width; px++) {
            if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue;

            const idx = (py * canvas.width + px) * 4;
            const blendRadius = 20;
            let rSum = 0, gSum = 0, bSum = 0, aSum = 0, totalWeight = 0;

            for (let dy = -blendRadius; dy <= blendRadius; dy++) {
              for (let dx = -blendRadius; dx <= blendRadius; dx++) {
                const sampleX = px + dx;
                const sampleY = py + dy;
                if (sampleX < 0 || sampleX >= canvas.width || sampleY < 0 || sampleY >= canvas.height) continue;

                const isInsideSelection = sampleX >= x && sampleX < x + width && sampleY >= y && sampleY < y + height;
                if (isInsideSelection) continue;

                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > blendRadius) continue;

                const weight = 1 / (1 + dist * 0.1);
                const sampleIdx = (sampleY * canvas.width + sampleX) * 4;
                rSum += originalData[sampleIdx] * weight;
                gSum += originalData[sampleIdx + 1] * weight;
                bSum += originalData[sampleIdx + 2] * weight;
                aSum += originalData[sampleIdx + 3] * weight;
                totalWeight += weight;
              }
            }

            if (totalWeight > 0) {
              data[idx] = Math.round(rSum / totalWeight);
              data[idx + 1] = Math.round(gSum / totalWeight);
              data[idx + 2] = Math.round(bSum / totalWeight);
              data[idx + 3] = Math.round(aSum / totalWeight);
            }
          }
        }
      });

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          setProcessedBlob(blob);
          setProcessedPreview(URL.createObjectURL(blob));
          setStatus("success");
          toast({
            title: "Success!",
            description: "Objects removed successfully",
          });
        }
      }, files[0].file.type, 0.95);
    } catch (error) {
      setStatus("error");
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const extension = originalName.split('.').pop() || 'png';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_removed.${extension}`);
  };

  return (
    <ToolLayout
      title="Remove Objects From Photo"
      description="Erase unwanted objects from your photos. Select areas to remove and let AI fill them in seamlessly."
      category="Image Tools"
      keywords={["remove objects", "erase objects", "photo editing", "object removal", "inpainting"]}
      howToSteps={[
        { name: "Upload Photo", text: "Upload an image with objects you want to remove" },
        { name: "Select Objects", text: "Click and drag to select objects to remove" },
        { name: "Remove", text: "Click Remove Objects to process" },
        { name: "Download", text: "Download your edited image" },
      ]}
    >
      <div className="space-y-6">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Eraser className="h-5 w-5 text-[#0B9F47]" />
            Upload Photo
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
            <h2 className="text-xl font-bold mb-4">Select Objects to Remove</h2>
            <p className="text-sm text-gray-600 mb-4">
              Click and drag on the image to select areas you want to remove
            </p>
            <div className="relative border rounded-lg overflow-hidden bg-gray-100">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="max-w-full h-auto cursor-crosshair"
                style={{ maxHeight: "600px" }}
                onLoad={(e) => {
                  const img = new Image();
                  img.src = URL.createObjectURL(files[0].file);
                  img.onload = () => {
                    if (canvasRef.current) {
                      const maxWidth = 800;
                      const scale = Math.min(1, maxWidth / img.width);
                      canvasRef.current.width = img.width * scale;
                      canvasRef.current.height = img.height * scale;
                      const ctx = canvasRef.current.getContext('2d');
                      if (ctx) {
                        ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
                        handleImageLoad(img);
                      }
                    }
                  };
                }}
              />
              {selections.map((sel, idx) => (
                <div
                  key={idx}
                  className="absolute border-2 border-red-500 bg-red-500/20"
                  style={{
                    left: `${sel.x}px`,
                    top: `${sel.y}px`,
                    width: `${sel.width}px`,
                    height: `${sel.height}px`,
                  }}
                >
                  <button
                    onClick={() => removeSelection(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleRemoveObjects}
                className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                disabled={status === "processing" || selections.length === 0}
              >
                Remove Objects
              </Button>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Removing objects..."
            successMessage="Objects removed successfully!"
            errorMessage="Failed to remove objects. Please try again."
          />
        )}

        {processedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Result</h2>
            <img src={processedPreview} alt="Processed" className="max-w-full h-auto rounded-lg mb-4" />
            <DownloadButton
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
            >
              Download Image
            </DownloadButton>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

