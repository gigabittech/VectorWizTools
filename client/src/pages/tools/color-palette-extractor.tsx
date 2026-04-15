import { useState, useRef, useEffect, useCallback } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { extractColors } from "@/lib/imageProcessing";
import { Palette, Check, Copy, Pipette } from "lucide-react";

export default function ColorPaletteExtractor() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [colorCount, setColorCount] = useState([5]);
  const [colors, setColors] = useState<string[]>([]);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Eyedropper state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [loupPos, setLoupPos] = useState({ x: 0, y: 0, visible: false });
  const [hintPos, setHintPos] = useState({ x: 0, y: 0 });

  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setColors([]);
    setHoveredColor(null);
  };

  // Draw image onto canvas when file is selected
  useEffect(() => {
    if (files.length === 0 || !files[0].preview) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      const maxW = Math.min(img.width, 800);
      const scale = maxW / img.width;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = files[0].preview;
  }, [files]);

  const handleExtractColors = async () => {
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
      const extractedColors = await extractColors(files[0].file, colorCount[0]);
      setColors(extractedColors);
      setStatus("success");
      toast({
        title: "Success!",
        description: `Extracted ${extractedColors.length} colors`,
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

  // ── Eyedropper helpers ──────────────────────────────────────────────────────

  const rgbToHex = (r: number, g: number, b: number): string =>
    "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

  const getBrightness = (r: number, g: number, b: number): number =>
    (r * 299 + g * 587 + b * 114) / 1000;

  const drawLoupe = useCallback(
    (srcX: number, srcY: number) => {
      const canvas = canvasRef.current;
      const loupe = loupCanvasRef.current;
      if (!canvas || !loupe) return;
      const ctx = canvas.getContext("2d");
      const loupCtx = loupe.getContext("2d");
      if (!ctx || !loupCtx) return;

      const loupSize = 80;
      const zoom = 5;
      const srcSize = Math.floor(loupSize / zoom);
      const sx = Math.max(0, Math.min(srcX - Math.floor(srcSize / 2), canvas.width - srcSize));
      const sy = Math.max(0, Math.min(srcY - Math.floor(srcSize / 2), canvas.height - srcSize));

      loupCtx.clearRect(0, 0, loupSize, loupSize);
      loupCtx.imageSmoothingEnabled = false;
      loupCtx.drawImage(canvas, sx, sy, srcSize, srcSize, 0, 0, loupSize, loupSize);

      // crosshair
      loupCtx.strokeStyle = "rgba(255,255,255,0.8)";
      loupCtx.lineWidth = 1;
      loupCtx.beginPath();
      loupCtx.moveTo(loupSize / 2, 0);
      loupCtx.lineTo(loupSize / 2, loupSize);
      loupCtx.stroke();
      loupCtx.beginPath();
      loupCtx.moveTo(0, loupSize / 2);
      loupCtx.lineTo(loupSize, loupSize / 2);
      loupCtx.stroke();
    },
    []
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const px = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(px[0], px[1], px[2]);
      setHoveredColor(hex);

      // loupe position (relative to canvas display rect)
      const dispX = (e.clientX - rect.left);
      const dispY = (e.clientY - rect.top);
      const loupSize = 80;
      const offset = 16;
      let lx = dispX + offset;
      let ly = dispY - loupSize - offset;
      if (lx + loupSize > rect.width) lx = dispX - loupSize - offset;
      if (ly < 0) ly = dispY + offset;
      setLoupPos({ x: lx, y: ly, visible: true });
      setHintPos({ x: lx, y: ly + loupSize + 4 });

      drawLoupe(x, y);
    },
    [drawLoupe]
  );

  const handleCanvasMouseLeave = useCallback(() => {
    setHoveredColor(null);
    setLoupPos((p) => ({ ...p, visible: false }));
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const px = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(px[0], px[1], px[2]);

      setColors((prev) => {
        if (prev.includes(hex)) return prev;
        return [hex, ...prev];
      });

      toast({
        title: "Color picked!",
        description: `${hex.toUpperCase()} added to palette`,
      });
    },
    [toast]
  );

  // ── Existing helpers ────────────────────────────────────────────────────────

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    toast({
      title: "Copied!",
      description: `${color} copied to clipboard`,
    });
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const copyAllColors = () => {
    const colorList = colors.join(", ");
    navigator.clipboard.writeText(colorList);
    toast({
      title: "Copied!",
      description: "All colors copied to clipboard",
    });
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : { r: 0, g: 0, b: 0 };
  };

  const getTextColor = (hex: string): string => {
    const rgb = hexToRgb(hex);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#FFFFFF";
  };

  return (
    <ToolLayout
      title="Color Palette Extractor"
      description="Extract dominant colors from images online for free. Get hex and RGB color codes from photos. Perfect for designers and developers."
      category="Image Tools"
      keywords={["extract colors", "color palette", "image colors", "dominant colors", "color picker"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image file" },
        { name: "Set Color Count", text: "Choose how many colors to extract (3-10)" },
        { name: "Extract", text: "Click Extract Colors to analyze the image" },
        { name: "Pick Colors", text: "Hover over the image and click to pick any color manually" },
        { name: "Copy Colors", text: "Click on any color to copy its hex code" },
      ]}
    >
      <div className="space-y-6">

        {/* File Upload */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5 text-[#0B9F47]" />
            Upload Image
          </h2>
          <div>
            <FileUploader
              accept="image/*"
              maxFiles={1}
              maxSize={50 * 1024 * 1024}
              onFilesSelected={handleFilesSelected}
              multiple={false}
              allowedTypes={["image/jpeg", "image/png", "image/webp"]}
              data-testid="file-uploader"
            />
          </div>
        </div>

        {/* Settings */}
        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-4">Extraction Settings</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label data-testid="label-color-count">Number of Colors: {colorCount[0]}</Label>
                <Slider
                  value={colorCount}
                  onValueChange={setColorCount}
                  min={3}
                  max={10}
                  step={1}
                  className="w-full"
                  data-testid="slider-color-count"
                />
                <p className="text-xs text-gray-500">
                  Extract 3-10 dominant colors from your image
                </p>
              </div>

              <Button
                onClick={handleExtractColors}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
                disabled={status === "processing"}
                data-testid="button-extract"
              >
                Extract Colors
              </Button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Extracting colors..."
            successMessage="Colors extracted successfully!"
            errorMessage="Failed to extract colors. Please try again."
          />
        )}

        {/* ── Eyedropper Canvas ─────────────────────────────────────────────── */}
        {files.length > 0 && files[0].preview && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Pipette className="h-5 w-5 text-[#0B9F47]" />
              Color Picker
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Hover over the image to preview a color — click to add it to the palette.
            </p>

            {/* Live color preview badge */}
            <div className="flex items-center gap-3 mb-3 min-h-[36px]">
              {hoveredColor ? (
                <>
                  <div
                    className="w-8 h-8 rounded-md border border-white/60 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: hoveredColor }}
                  />
                  <span
                    className="text-sm font-mono font-semibold px-2 py-1 rounded"
                    style={{
                      backgroundColor: hoveredColor,
                      color: getTextColor(hoveredColor),
                    }}
                  >
                    {hoveredColor.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    rgb({hexToRgb(hoveredColor).r}, {hexToRgb(hoveredColor).g}, {hexToRgb(hoveredColor).b})
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400 italic">Move mouse over image…</span>
              )}
            </div>

            {/* Canvas with loupe overlay */}
            <div
              ref={canvasWrapRef}
              className="relative inline-block w-full"
              style={{ cursor: "crosshair" }}
            >
              <canvas
                ref={canvasRef}
                className="block max-w-full h-auto rounded-lg border border-white/40"
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
                onClick={handleCanvasClick}
                data-testid="eyedropper-canvas"
              />

              {/* Magnifying loupe */}
              {loupPos.visible && (
                <div
                  className="absolute pointer-events-none z-10 rounded-full overflow-hidden"
                  style={{
                    left: loupPos.x,
                    top: loupPos.y,
                    width: 80,
                    height: 80,
                    border: "3px solid #ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                  }}
                >
                  <canvas
                    ref={loupCanvasRef}
                    width={80}
                    height={80}
                    style={{ width: 80, height: 80 }}
                  />
                </div>
              )}

              {/* Hex hint bubble */}
              {loupPos.visible && hoveredColor && (
                <div
                  className="absolute pointer-events-none z-20 text-xs font-mono px-2 py-0.5 rounded whitespace-nowrap"
                  style={{
                    left: hintPos.x,
                    top: hintPos.y,
                    backgroundColor: hoveredColor,
                    color: getTextColor(hoveredColor),
                    boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                  }}
                >
                  {hoveredColor.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Color Palette Display */}
        {colors.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Color Palette</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAllColors}
                data-testid="button-copy-all"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            </div>
            <div className="space-y-4">
              {/* Color Swatches */}
              <div className="grid grid-cols-1 gap-3" data-testid="color-palette">
                {colors.map((color, index) => {
                  const rgb = hexToRgb(color);
                  const isCopied = copiedColor === color;

                  return (
                    <div
                      key={index}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => copyToClipboard(color)}
                      data-testid={`color-card-${index}`}
                    >
                      <div className="flex items-center">
                        <div
                          className="w-24 h-24 flex items-center justify-center"
                          style={{ backgroundColor: color }}
                        >
                          {isCopied && (
                            <Check
                              className="h-6 w-6"
                              style={{ color: getTextColor(color) }}
                            />
                          )}
                        </div>
                        <div className="flex-1 p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">HEX</p>
                              <p
                                className="font-mono font-semibold text-sm"
                                data-testid={`hex-${index}`}
                              >
                                {color.toUpperCase()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">RGB</p>
                              <p
                                className="font-mono text-sm"
                                data-testid={`rgb-${index}`}
                              >
                                {rgb.r}, {rgb.g}, {rgb.b}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Click to copy</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Palette as Gradient */}
              <div className="mt-6">
                <Label className="mb-2 block" data-testid="label-palette-preview">
                  Palette Preview
                </Label>
                <div
                  className="h-16 rounded-lg overflow-hidden flex"
                  data-testid="palette-preview"
                >
                  {colors.map((color, index) => (
                    <div
                      key={index}
                      className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: color }}
                      onClick={() => copyToClipboard(color)}
                      title={`Click to copy ${color}`}
                      data-testid={`palette-swatch-${index}`}
                    />
                  ))}
                </div>
              </div>

              {/* Export Formats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="mb-2 block" data-testid="label-export-formats">
                  Export Formats
                </Label>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">CSS Array</p>
                    <code
                      className="bg-white p-2 rounded block text-xs overflow-x-auto"
                      data-testid="export-css"
                    >
                      [{colors.map((c) => `'${c}'`).join(", ")}]
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tailwind Colors</p>
                    <code
                      className="bg-white p-2 rounded block text-xs overflow-x-auto"
                      data-testid="export-tailwind"
                    >
                      {colors.map((c, i) => `'color${i + 1}': '${c}'`).join(", ")}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
          <h2 className="text-xl font-bold mb-4">About Color Palette Extraction</h2>
          <div className="prose prose-sm max-w-none">
            <p>
              Extract dominant colors from any image to create beautiful color palettes. Perfect for:
            </p>
            <ul>
              <li>
                <strong>Design Projects:</strong> Match colors from inspiration images
              </li>
              <li>
                <strong>Web Development:</strong> Create consistent color schemes
              </li>
              <li>
                <strong>Branding:</strong> Extract colors from logos and photos
              </li>
              <li>
                <strong>Art & Photography:</strong> Analyze color composition
              </li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              <strong>Pro Tip:</strong> Use the eyedropper tool to manually pick any specific color
              from the image, or use Auto Extract to get the dominant colors automatically.
            </p>
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}