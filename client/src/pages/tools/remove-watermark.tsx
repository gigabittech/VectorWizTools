import { useState, useRef, useEffect } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { removeWatermark } from "@/lib/imageProcessing";
import { downloadFile, getImageDimensions } from "@/lib/fileUtils";
import { Eraser, MousePointer2, RotateCcw, Paintbrush } from "lucide-react";

type SelectionMode = "rectangle" | "brush";

interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function RemoveWatermark() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("brush");
  const [selection, setSelection] = useState<SelectionArea | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleFilesSelected = async (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setProcessedPreview(null);
    setSelection(null);
    setStartPos(null);
    setIsSelecting(false);
    setIsDrawing(false);

    if (uploadedFiles.length > 0) {
      try {
        const dimensions = await getImageDimensions(uploadedFiles[0].file);
        setImageDimensions(dimensions);
        
        // Create preview URL
        const url = URL.createObjectURL(uploadedFiles[0].file);
        setImageUrl(url);

        // Load image element
        const img = new Image();
        img.onload = () => {
          setImageElement(img);
          // Initialize mask canvas
          if (maskCanvasRef.current) {
            maskCanvasRef.current.width = img.width;
            maskCanvasRef.current.height = img.height;
          }
        };
        img.src = url;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to read image",
          variant: "destructive",
        });
      }
    }
  };

  const getImageCoordinates = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !imageElement || !imageDimensions) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    const imgRect = imageElement.getBoundingClientRect();
    
    // Calculate scale factor
    const scaleX = imageDimensions.width / imgRect.width;
    const scaleY = imageDimensions.height / imgRect.height;
    
    // Get mouse position relative to image
    const x = (e.clientX - imgRect.left) * scaleX;
    const y = (e.clientY - imgRect.top) * scaleY;
    
    return {
      x: Math.max(0, Math.min(x, imageDimensions.width)),
      y: Math.max(0, Math.min(y, imageDimensions.height)),
    };
  };

  const drawBrush = (x: number, y: number) => {
    if (!maskCanvasRef.current || !imageDimensions) return;
    
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageUrl || !imageDimensions) return;
    
    const pos = getImageCoordinates(e);
    if (!pos) return;

    if (selectionMode === "brush") {
      setIsDrawing(true);
      if (maskCanvasRef.current) {
        const ctx = maskCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        }
      }
      drawBrush(pos.x, pos.y);
    } else {
      setIsSelecting(true);
      setStartPos(pos);
      setSelection(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageDimensions) return;

    const pos = getImageCoordinates(e);
    if (!pos) return;

    if (selectionMode === "brush" && isDrawing) {
      drawBrush(pos.x, pos.y);
    } else if (selectionMode === "rectangle" && isSelecting && startPos) {
      const x = Math.min(startPos.x, pos.x);
      const y = Math.min(startPos.y, pos.y);
      const width = Math.abs(pos.x - startPos.x);
      const height = Math.abs(pos.y - startPos.y);

      setSelection({
        x: Math.max(0, Math.min(x, imageDimensions.width)),
        y: Math.max(0, Math.min(y, imageDimensions.height)),
        width: Math.min(width, imageDimensions.width - x),
        height: Math.min(height, imageDimensions.height - y),
      });
    }
  };

  const handleMouseUp = () => {
    if (selectionMode === "brush" && isDrawing) {
      setIsDrawing(false);
      // Calculate bounding box from mask
      calculateSelectionFromMask();
    } else {
      setIsSelecting(false);
    }
  };

  const calculateSelectionFromMask = () => {
    if (!maskCanvasRef.current || !imageDimensions) return;

    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    const data = imageData.data;

    let minX = imageDimensions.width;
    let minY = imageDimensions.height;
    let maxX = 0;
    let maxY = 0;
    let hasSelection = false;

    for (let y = 0; y < imageDimensions.height; y++) {
      for (let x = 0; x < imageDimensions.width; x++) {
        const idx = (y * imageDimensions.width + x) * 4;
        if (data[idx + 3] > 0) { // Has alpha (painted)
          hasSelection = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (hasSelection) {
      // Add padding
      const padding = brushSize;
      setSelection({
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: Math.min(imageDimensions.width, maxX - minX + padding * 2),
        height: Math.min(imageDimensions.height, maxY - minY + padding * 2),
      });
    }
  };

  const handleManualInput = (field: keyof SelectionArea, value: string) => {
    if (!imageDimensions) return;

    const numValue = parseInt(value) || 0;
    const newSelection = selection || { x: 0, y: 0, width: 0, height: 0 };

    switch (field) {
      case 'x':
        newSelection.x = Math.max(0, Math.min(numValue, imageDimensions.width - newSelection.width));
        break;
      case 'y':
        newSelection.y = Math.max(0, Math.min(numValue, imageDimensions.height - newSelection.height));
        break;
      case 'width':
        newSelection.width = Math.max(1, Math.min(numValue, imageDimensions.width - newSelection.x));
        break;
      case 'height':
        newSelection.height = Math.max(1, Math.min(numValue, imageDimensions.height - newSelection.y));
        break;
    }

    setSelection(newSelection);
  };

  const handleRemoveWatermark = async () => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    if (!selection || selection.width === 0 || selection.height === 0) {
      toast({
        title: "No Selection",
        description: "Please select the watermark area first",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const blob = await removeWatermark(files[0].file, {
        x: Math.max(0, Math.floor(selection.x)),
        y: Math.max(0, Math.floor(selection.y)),
        width: Math.max(1, Math.floor(selection.width)),
        height: Math.max(1, Math.floor(selection.height)),
        blendRadius: 50, // Increased for better results
      });

      setProcessedBlob(blob);
      const previewUrl = URL.createObjectURL(blob);
      setProcessedPreview(previewUrl);

      setStatus("success");
      toast({
        title: "Success!",
        description: "Watermark removed successfully",
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Removal Failed",
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
    const newFilename = `${baseName}_watermark_removed.${extension}`;

    downloadFile(processedBlob, newFilename);
  };

  const handleReset = () => {
    setSelection(null);
    setStartPos(null);
    setIsSelecting(false);
    setIsDrawing(false);
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      }
    }
  };

  // Render mask overlay
  useEffect(() => {
    if (!maskCanvasRef.current || !imageElement || !imageDimensions) return;

    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw mask on display canvas
    const displayCanvas = canvasRef.current;
    if (displayCanvas && imageElement) {
      const displayCtx = displayCanvas.getContext('2d');
      if (displayCtx) {
        const imgRect = imageElement.getBoundingClientRect();
        displayCanvas.width = imgRect.width;
        displayCanvas.height = imgRect.height;
        
        // Scale and draw mask
        displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        const scaleX = displayCanvas.width / canvas.width;
        const scaleY = displayCanvas.height / canvas.height;
        displayCtx.save();
        displayCtx.scale(scaleX, scaleY);
        displayCtx.drawImage(canvas, 0, 0);
        displayCtx.restore();
      }
    }
  }, [imageElement, imageDimensions, selectionMode]);

  return (
    <ToolLayout
      title="Remove Watermark"
      description="Remove watermarks from photos and images for free. Paint over or select the watermark area and let our tool intelligently fill it using surrounding pixels. Clean, professional results."
      category="Image Tools"
      keywords={["remove watermark", "watermark remover", "erase watermark", "clean image", "remove text from image"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image with watermark" },
        { name: "Select Area", text: "Use brush tool to paint over the watermark, or use rectangle selection" },
        { name: "Remove", text: "Click 'Remove Watermark' to process the image" },
        { name: "Download", text: "Download your cleaned image" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Eraser className="h-5 w-5 text-[#0B9F47]" />
            Upload Image
          </h2>
          <div>
            <FileUploader
              accept="image/*"
              maxFiles={1}
              maxSize={50 * 1024 * 1024}
              onFilesSelected={handleFilesSelected}
              multiple={false}
              allowedTypes={["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]}
            />
          </div>
        </div>

        {/* Image Preview with Selection */}
        {imageUrl && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MousePointer2 className="h-5 w-5 text-[#0B9F47]" />
                Select Watermark Area
              </h2>
              {selection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              {/* Selection Mode Toggle */}
              <div className="flex gap-2 p-2 bg-gray-50 rounded-lg">
                <Button
                  variant={selectionMode === "brush" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectionMode("brush");
                    handleReset();
                  }}
                  className={selectionMode === "brush" ? "bg-[#0B9F47] text-white" : ""}
                >
                  <Paintbrush className="h-4 w-4 mr-2" />
                  Brush Tool
                </Button>
                <Button
                  variant={selectionMode === "rectangle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectionMode("rectangle");
                    handleReset();
                  }}
                  className={selectionMode === "rectangle" ? "bg-[#0B9F47] text-white" : ""}
                >
                  <MousePointer2 className="h-4 w-4 mr-2" />
                  Rectangle
                </Button>
              </div>

              {/* Brush Size Control */}
              {selectionMode === "brush" && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm mb-2 block">
                    Brush Size: <span className="text-[#0B9F47] font-semibold">{brushSize}px</span>
                  </Label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              <div className="text-sm text-gray-600 mb-2">
                {selectionMode === "brush" 
                  ? "Click and drag to paint over the watermark area"
                  : "Click and drag on the image to select the watermark area"}
              </div>
              
              <div
                ref={containerRef}
                className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100"
                style={{ cursor: selectionMode === "brush" ? "crosshair" : "crosshair" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {imageElement && (
                  <>
                    <img
                      ref={(img) => {
                        if (img) setImageElement(img);
                      }}
                      src={imageUrl}
                      alt="Preview"
                      className="max-w-full h-auto block"
                      style={{ maxHeight: "600px", display: "block" }}
                    />
                    {/* Mask overlay canvas */}
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 pointer-events-none"
                      style={{ maxHeight: "600px" }}
                    />
                    {/* Hidden canvas for mask data */}
                    <canvas
                      ref={maskCanvasRef}
                      className="hidden"
                    />
                  </>
                )}
                {/* Rectangle selection overlay */}
                {selectionMode === "rectangle" && selection && imageElement && (
                  <div
                    className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none"
                    style={{
                      left: `${(selection.x / imageDimensions!.width) * imageElement.offsetWidth}px`,
                      top: `${(selection.y / imageDimensions!.height) * imageElement.offsetHeight}px`,
                      width: `${(selection.width / imageDimensions!.width) * imageElement.offsetWidth}px`,
                      height: `${(selection.height / imageDimensions!.height) * imageElement.offsetHeight}px`,
                    }}
                  />
                )}
              </div>

              {/* Manual Input */}
              {imageDimensions && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm">X Position</Label>
                    <Input
                      type="number"
                      min="0"
                      max={imageDimensions.width}
                      value={selection?.x || 0}
                      onChange={(e) => handleManualInput('x', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Y Position</Label>
                    <Input
                      type="number"
                      min="0"
                      max={imageDimensions.height}
                      value={selection?.y || 0}
                      onChange={(e) => handleManualInput('y', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Width</Label>
                    <Input
                      type="number"
                      min="1"
                      max={imageDimensions.width}
                      value={selection?.width || 0}
                      onChange={(e) => handleManualInput('width', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Height</Label>
                    <Input
                      type="number"
                      min="1"
                      max={imageDimensions.height}
                      value={selection?.height || 0}
                      onChange={(e) => handleManualInput('height', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {selection && selection.width > 0 && selection.height > 0 && (
                <div className="p-4 bg-[#0B9F47]/10 rounded-lg border border-[#0B9F47]/20">
                  <p className="text-sm text-gray-600">Selected Area:</p>
                  <p className="font-semibold text-[#0B9F47]">
                    {selection.width} × {selection.height} pixels at ({selection.x}, {selection.y})
                  </p>
                </div>
              )}

              <Button
                onClick={handleRemoveWatermark}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing" || !selection || selection.width === 0 || selection.height === 0}
              >
                <Eraser className="h-5 w-5 mr-2" />
                Remove Watermark
              </Button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Removing watermark using intelligent inpainting..."
            successMessage="Watermark removed successfully!"
            errorMessage="Failed to remove watermark. Please try again."
          />
        )}

        {/* Preview and Download */}
        {processedBlob && processedPreview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-4">Processed Image Preview</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50 overflow-auto max-h-[600px]">
                <img
                  src={processedPreview}
                  alt="Watermark removed"
                  className="max-w-full h-auto mx-auto"
                />
              </div>

              <DownloadButton
                onClick={handleDownload}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
              >
                Download Cleaned Image
              </DownloadButton>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4">About Watermark Removal</h2>
          <div className="prose prose-sm max-w-none">
            <p>
              Our free watermark removal tool uses intelligent inpainting algorithms to fill the selected area with surrounding pixels:
            </p>
            <ul>
              <li><strong>Brush Tool:</strong> Paint over the watermark area for precise selection</li>
              <li><strong>Rectangle Tool:</strong> Click and drag to select a rectangular area</li>
              <li><strong>Intelligent Inpainting:</strong> Uses nearby pixels to naturally fill the watermark area</li>
              <li><strong>Edge-Aware Blending:</strong> Ensures smooth transitions at the edges</li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">
              <strong>Tip:</strong> Use the brush tool for irregular watermarks. Adjust brush size for better control. The tool works best on watermarks over relatively uniform backgrounds.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
