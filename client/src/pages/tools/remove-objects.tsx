import { useState, useRef, useEffect } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { Eraser, RotateCcw, Brush } from "lucide-react";

export default function RemoveObjects() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [brushSize, setBrushSize] = useState([20]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [originalImageObj, setOriginalImageObj] = useState<HTMLImageElement | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Handle file selection
  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setStatus("idle");
    setProcessedPreview(null);
    setProcessedBlob(null);
  };

  // Load image onto canvas when file changes
  useEffect(() => {
    if (files.length > 0 && canvasRef.current) {
      const img = new Image();
      const url = URL.createObjectURL(files[0].file);
      img.src = url;

      img.onload = () => {
        setOriginalImageObj(img);
        const canvas = canvasRef.current;
        if (canvas) {
          // Limit canvas size for performance, but keep aspect ratio
          const maxWidth = 800;
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;

          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        }
      };
    }
  }, [files]);

  // --- Brush/Drawing Logic ---

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.beginPath();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineWidth = brushSize[0];
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Using pure red for the mask to easily identify it later
    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // Reset the canvas to the original image
  const resetCanvas = () => {
    if (originalImageObj && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(originalImageObj, 0, 0, canvas.width, canvas.height);
      }
    }
  };

  // --- Object Removal Logic (Inpainting) ---

  const handleRemoveObjects = async () => {
    if (!canvasRef.current || !originalImageObj) return;

    setStatus("processing");

    // Using setTimeout to allow the UI to show the loading state
    setTimeout(() => {
      try {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

        const width = canvas.width;
        const height = canvas.height;

        // 1. Get current data (Image + Red Mask)
        const currentImageData = ctx.getImageData(0, 0, width, height);
        const data = currentImageData.data;

        // 2. Get clean original data (Image without Mask)
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.drawImage(originalImageObj, 0, 0, width, height);
        const originalImageData = tempCtx.getImageData(0, 0, width, height).data;

        // Output buffer
        const outputData = new Uint8ClampedArray(originalImageData);

        // Identify Mask Pixels
        const maskPixels: number[] = []; // Stores indices of pixels to be removed

        for (let i = 0; i < data.length; i += 4) {
          // Detect Red Mask (High Red, Low Green/Blue)
          if (data[i] > 200 && data[i + 1] < 100 && data[i + 2] < 100) {
            maskPixels.push(i);
          }
        }

        // --- Improved Algorithm: Nearest Neighbor Diffusion ---
        // Instead of averaging (blur), we copy pixels from the nearest valid border.
        // This preserves texture better than simple blur.

        if (maskPixels.length > 0) {
          const maxSearchRadius = 100; // How far to look for good pixels

          for (let i = 0; i < maskPixels.length; i++) {
            const idx = maskPixels[i];
            const pixelIndex = idx / 4;
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);

            // Spiral search for the nearest non-mask pixel
            let found = false;
            let radius = 1;

            while (!found && radius < maxSearchRadius) {
              // Check pixels in a square ring around the center
              for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                  // Only check the outer edge of the square (efficiency)
                  if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

                  const nx = x + dx;
                  const ny = y + dy;

                  if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const nIdx = (ny * width + nx) * 4;

                    // Check if this neighbor is NOT part of the mask
                    // We check the 'data' array which holds the visible red mask
                    const isMask = data[nIdx] > 200 && data[nIdx + 1] < 100;

                    if (!isMask) {
                      // Found a valid neighbor! Copy it to the output.
                      outputData[idx] = originalImageData[nIdx];     // R
                      outputData[idx + 1] = originalImageData[nIdx + 1]; // G
                      outputData[idx + 2] = originalImageData[nIdx + 2]; // B
                      outputData[idx + 3] = 255; // Alpha
                      found = true;
                      break;
                    }
                  }
                }
                if (found) break;
              }
              radius++;
            }
          }

          // Optional: A very light smoothing pass just on the modified pixels to blend seams
          // This removes the "blocky" look of the nearest neighbor copy
          const smoothedData = new Uint8ClampedArray(outputData);
          for (let i = 0; i < maskPixels.length; i++) {
            const idx = maskPixels[i];
            const pixelIndex = idx / 4;
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);

            let r = 0, g = 0, b = 0, count = 0;

            // 3x3 Smoothing
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const nIdx = (ny * width + nx) * 4;
                  r += outputData[nIdx];
                  g += outputData[nIdx + 1];
                  b += outputData[nIdx + 2];
                  count++;
                }
              }
            }
            smoothedData[idx] = r / count;
            smoothedData[idx + 1] = g / count;
            smoothedData[idx + 2] = b / count;
            smoothedData[idx + 3] = 255;
          }

          // Apply smoothed data back to output
          for (let i = 0; i < maskPixels.length; i++) {
            const idx = maskPixels[i];
            outputData[idx] = smoothedData[idx];
            outputData[idx + 1] = smoothedData[idx + 1];
            outputData[idx + 2] = smoothedData[idx + 2];
          }
        }

        // 3. Put result back
        const finalImageData = new ImageData(outputData, width, height);
        ctx.putImageData(finalImageData, 0, 0);

        // 4. Create Blob for download
        canvas.toBlob((blob) => {
          if (blob) {
            setProcessedBlob(blob);
            setProcessedPreview(URL.createObjectURL(blob));
            setStatus("success");
            toast({
              title: "Success",
              description: "Object removed successfully",
            });
          }
        }, "image/png");

      } catch (error) {
        console.error(error);
        setStatus("error");
        toast({
          title: "Error",
          description: "Something went wrong during processing",
          variant: "destructive",
        });
      }
    }, 100);
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_cleaned.png`);
  };

  return (
    <ToolLayout
      title="Remove Objects From Photo"
      description="Erase unwanted objects from your photos. Select areas to remove and let the tool fill them in."
      category="Image Tools"
      keywords={["remove objects", "erase objects", "photo editing", "object removal", "inpainting"]}
      howToSteps={[
        { name: "Upload Photo", text: "Upload an image with objects you want to remove" },
        { name: "Highlight", text: "Use the brush to cover the object completely" },
        { name: "Remove", text: "Click Remove Objects to process" },
        { name: "Download", text: "Download your edited image" },
      ]}
    >
      <div className="space-y-6">
        {/* Upload Section */}
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

        {/* Editor Section */}
        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">

            {/* Controls Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold">Select Objects</h2>
                <p className="text-sm text-gray-600">Paint over the object you want to remove.</p>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <Brush className="h-4 w-4 text-gray-600" />
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500 mb-1 block">Brush Size</Label>
                    <Slider
                      value={brushSize}
                      onValueChange={setBrushSize}
                      min={5}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={resetCanvas} title="Reset Selection">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative border rounded-lg overflow-hidden bg-gray-100 flex justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onMouseMove={draw}
                className="max-w-full h-auto cursor-crosshair touch-none"
                style={{ maxHeight: "600px" }}
              />
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                onClick={handleRemoveObjects}
                className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white min-w-[150px]"
                disabled={status === "processing"}
                size="lg"
              >
                Remove Objects
              </Button>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Processing image..."
            successMessage="Objects removed successfully!"
            errorMessage="Failed to remove objects."
          />
        )}

        {/* Result Section */}
        {processedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold mb-4">Result</h2>
            <div className="border rounded-lg overflow-hidden bg-gray-50 mb-4 inline-block">
              <img src={processedPreview} alt="Processed" className="max-w-full h-auto" />
            </div>
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