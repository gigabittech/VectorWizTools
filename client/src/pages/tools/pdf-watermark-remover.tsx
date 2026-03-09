import { useState, useRef, useEffect, useCallback } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import { PDFDocument, rgb } from "pdf-lib";
import * as pdfjsLib from 'pdfjs-dist';
import { Droplet, FileText, Loader2, Download, Trash2, ZoomIn, ZoomOut, Search, Paintbrush, MousePointer2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Canvas, PencilBrush, FabricImage } from "fabric";

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface DetectedObject {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PageData {
  pageNumber: number;
  canvasDataUrl: string;
  width: number;
  height: number;
  objects: DetectedObject[];
}

export default function PDFWatermarkRemover() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<{ [key: string]: boolean }>({});
  const [activeTool, setActiveTool] = useState<"select" | "brush">("brush");
  const [brushSize, setBrushSize] = useState(30);
  const [isRendering, setIsRendering] = useState(false);
  const [zoom, setZoom] = useState(0.6);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const { toast } = useToast();

  const fabricCanvases = useRef<(Canvas | null)[]>([]);

  useEffect(() => {
    return () => {
      fabricCanvases.current.forEach(c => c?.dispose());
    };
  }, []);

  const handleFilesSelected = async (uploadedFiles: UploadedFile[]) => {
    if (uploadedFiles.length === 0) return;
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setPages([]);
    setSelectedObjects({});
    setIsRendering(true);

    try {
      const selectedFile = uploadedFiles[0];
      const arrayBuffer = await selectedFile.file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfjsDoc = await loadingTask.promise;

      const newPages: PageData[] = [];
      for (let i = 1; i <= pdfjsDoc.numPages; i++) {
        const page = await pdfjsDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport }).promise;

        // Detect XObjects and their positions
        const operatorList = await page.getOperatorList();
        const detectedObjects: DetectedObject[] = [];

        let currentTransform = [1, 0, 0, 1, 0, 0];

        for (let j = 0; j < operatorList.fnArray.length; j++) {
          const fn = operatorList.fnArray[j];
          const args = operatorList.argsArray[j];

          if (fn === pdfjsLib.OPS.paintXObject || fn === pdfjsLib.OPS.paintImageXObject) {
            const name = args[0];
            // Transform is [a, b, c, d, e, f]
            // We can approximate the bounding box from the transform
            // In PDF, XObjects are often painted with a transform that defines their size/pos
            const [a, b, c, d, e, f] = currentTransform;

            // Convert PDF coordinates to viewport coordinates
            const [vx1, vy1] = viewport.convertToViewportPoint(e, f);
            const [vx2, vy2] = viewport.convertToViewportPoint(e + a, f + d);

            detectedObjects.push({
              name,
              x: Math.min(vx1, vx2),
              y: Math.min(vy1, vy2),
              width: Math.abs(vx1 - vx2),
              height: Math.abs(vy1 - vy2),
            });
          } else if (fn === pdfjsLib.OPS.transform) {
            currentTransform = args;
          }
        }

        newPages.push({
          pageNumber: i,
          canvasDataUrl: canvas.toDataURL("image/png"),
          width: viewport.width,
          height: viewport.height,
          objects: detectedObjects,
        });
      }

      setPages(newPages);
      toast({ title: "PDF Loaded", description: `Detected ${newPages.length} pages and potential watermarks.` });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to render PDF preview.", variant: "destructive" });
    } finally {
      setIsRendering(false);
    }
  };

  const handleRemove = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    try {
      const selectedFile = files[0].file;
      const arrayBuffer = await selectedFile.arrayBuffer();

      // Load the PDF with pdf-lib
      const { PDFDocument, PDFName, PDFDict, PDFStream, PDFArray } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const catalog = pdfDoc.catalog;

      // 1. Remove Optional Content (Layers)
      if (catalog.has(PDFName.of("OCProperties"))) {
        catalog.delete(PDFName.of("OCProperties"));
      }

      const docPages = pdfDoc.getPages();
      const hasSelections = Object.values(selectedObjects).some(v => v);

      for (let i = 0; i < docPages.length; i++) {
        const page = docPages[i];
        const { node } = page as any;
        const { width, height } = page.getSize();

        // 1. Process Brush Strokes (Manual Removal)
        const canvas = fabricCanvases.current[i];
        if (canvas) {
          const objects = canvas.getObjects();
          for (const obj of objects) {
            // Check if it's a brush path
            if (obj.type === "path") {
              const bound = obj.getBoundingRect();
              const pageScaleX = width / canvas.width;
              const pageScaleY = height / canvas.height;

              page.drawRectangle({
                x: bound.left * pageScaleX,
                y: height - ((bound.top + bound.height) * pageScaleY),
                width: bound.width * pageScaleX,
                height: bound.height * pageScaleY,
                color: rgb(1, 1, 1),
              });
            }
          }
        }

        // 2. Remove Watermark Annotations
        const annots = node.get(PDFName.of("Annots"));
        if (annots instanceof PDFArray) {
          const filteredAnnots = annots.asArray().filter((annot: any) => {
            if (!(annot instanceof PDFDict)) return true;
            const subtype = annot.get(PDFName.of("Subtype"));
            const subtypeStr = subtype?.toString();
            return subtypeStr !== "/Watermark" && subtypeStr !== "/Stamp";
          });
          node.set(PDFName.of("Annots"), pdfDoc.context.obj(filteredAnnots));
        }

        const resources = node.get(PDFName.of("Resources"));
        if (resources instanceof PDFDict) {
          // 3. Remove highly transparent GStates (common for text watermarks) - Only if in AUTO mode
          const gStates = resources.get(PDFName.of("ExtGState"));
          if (!hasSelections && gStates instanceof PDFDict) {
            for (const name of gStates.keys()) {
              const gState = gStates.get(name);
              if (gState instanceof PDFDict) {
                const ca = gState.get(PDFName.of("ca"));
                const CA = gState.get(PDFName.of("CA"));
                if (
                  (ca && (ca as any).numberValue < 0.5) ||
                  (CA && (CA as any).numberValue < 0.5)
                ) {
                  gStates.delete(name);
                }
              }
            }
          }

          // 4. Selective XObject Removal
          const xObjects = resources.get(PDFName.of("XObject"));
          if (xObjects instanceof PDFDict) {
            const xObjectNames = xObjects.keys();
            for (const name of xObjectNames) {
              const nameStr = name.asString();
              const xObject = xObjects.get(name);
              if (xObject instanceof PDFStream) {
                const dict = xObject.dict;
                const subtype = dict.get(PDFName.of("Subtype"));
                const fullNameStr = name.asString().toLowerCase();

                const isForm = subtype?.toString() === "/Form";
                const isImage = subtype?.toString() === "/Image";
                const isSelected = selectedObjects[nameStr];

                if (hasSelections) {
                  if (isSelected) {
                    xObjects.delete(name);
                  }
                } else {
                  const hasWatermarkName = fullNameStr.includes("watermark") ||
                    fullNameStr.includes("stamp") ||
                    fullNameStr.includes("header") ||
                    fullNameStr.includes("footer") ||
                    fullNameStr.includes("logo");

                  if ((isForm || isImage) && hasWatermarkName) {
                    xObjects.delete(name);
                  }
                }
              }
            }
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as any], { type: "application/pdf" });
      setProcessedBlob(blob);
      setStatus("success");
      toast({
        title: "Success",
        description: "Watermarks removed successfully",
      });
    } catch (error) {
      console.error(error);
      setStatus("error");
      toast({
        title: "Error",
        description: "Something went wrong during processing",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;
    const originalName = files[0].file.name;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(processedBlob, `${baseName}_cleaned.pdf`);
  };

  useEffect(() => {
    if (pages.length > 0) {
      const container = document.getElementById("pdf-viewer-container");
      if (container) {
        const containerWidth = container.clientWidth;
        const pageWidth = pages[0].width;
        const initialZoom = (containerWidth * 0.9) / pageWidth;
        setZoom(Math.min(initialZoom, 1.0));
      }
    }
  }, [pages]);

  return (
    <ToolLayout
      title="PDF Watermark Remover"
      description="Automatically detect and remove watermarks, stamps, and logos from your PDF documents while preserving quality."
      category="PDF Tools"
      keywords={["remove watermark", "pdf watermark", "watermark remover", "remove stamp", "pdf cleaner"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file with watermarks" },
        { name: "Preview", text: "Verify the document in the viewer" },
        { name: "Process", text: "Click Remove Watermark to clean the document" },
        { name: "Download", text: "Save your cleaned PDF" },
      ]}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {!files.length ? (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Droplet className="h-5 w-5 text-[#0B9F47]" />
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Controls */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                <Card className="shadow-lg border-white/40 bg-white/80 backdrop-blur-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="h-5 w-5 text-[#0B9F47]" /> Process PDF
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 leading-relaxed space-y-2">
                      <p>Use the <b>Brush Tool</b> to paint over watermarks you want to remove.</p>
                      <p className="font-semibold border-t border-blue-200 pt-2 text-blue-900">
                        <Droplet className="inline-block h-3 w-3 mr-1" />
                        Tip: You can also use "Select" mode to click on detected logos.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={activeTool === "brush" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveTool("brush")}
                          className="gap-2 h-9 px-2"
                        >
                          <Paintbrush className="h-3.5 w-3.5" /> Brush
                        </Button>
                        <Button
                          variant={activeTool === "select" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveTool("select")}
                          className="gap-2 h-9 px-2"
                        >
                          <MousePointer2 className="h-3.5 w-3.5" /> Select
                        </Button>
                      </div>
                    </div>

                    {activeTool === "brush" && (
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Brush Size</label>
                          <span className="text-xs font-medium text-gray-600">{brushSize}px</span>
                        </div>
                        <Slider
                          value={[brushSize]}
                          min={5}
                          max={100}
                          step={1}
                          onValueChange={(val) => setBrushSize(val[0])}
                          className="py-2"
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleRemove}
                      className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white h-12 text-md font-bold"
                      disabled={status === "processing" || isRendering}
                    >
                      {status === "processing" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-5 w-5" />
                          Remove Watermark
                        </>
                      )}
                    </Button>

                    {status === "success" && processedBlob && (
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="w-full border-2 border-[#0B9F47] text-[#0B9F47] hover:bg-[#0B9F47]/10 h-12 font-bold"
                      >
                        <Download className="mr-2 h-5 w-5" />
                        Download Cleaned PDF
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setFiles([]);
                        setPages([]);
                        setStatus("idle");
                        setProcessedBlob(null);
                      }}
                      className="w-full text-gray-500 hover:text-red-500"
                    >
                      Start Over
                    </Button>
                  </CardContent>
                </Card>

                {/* Page Thumbnails */}
                <Card className="hidden lg:block bg-white/50 backdrop-blur-sm border-white/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-2">
                      <div className="space-y-3">
                        {pages.map((p, i) => (
                          <div
                            key={i}
                            className={cn(
                              "relative border-2 rounded-lg cursor-pointer transition-all overflow-hidden group",
                              activePageIndex === i
                                ? "border-[#0B9F47] ring-2 ring-[#0B9F47]/20"
                                : "border-transparent hover:border-gray-300"
                            )}
                            onClick={() => {
                              setActivePageIndex(i);
                              document.getElementById(`pdf-page-${i}`)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <img src={p.canvasDataUrl} className="w-full h-auto" alt={`Page ${i + 1}`} />
                            <Badge className="absolute top-1 left-1 bg-white/90 text-black hover:bg-white text-[10px] h-5 min-w-5 flex items-center justify-center">
                              {i + 1}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Viewer */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex justify-between items-center bg-white/80 backdrop-blur-md p-3 rounded-xl border border-white/40 sticky top-6 z-20 shadow-sm">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
                  <span className="text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2.0, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
                </div>
                <div className="hidden md:flex text-sm text-muted-foreground font-medium truncate max-w-[300px] items-center gap-2">
                  <FileText className="h-4 w-4" /> {files[0].file.name}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/50">{pages.length} Pages</Badge>
                </div>
              </div>

              {isRendering ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-xl border border-dashed border-gray-300">
                  <Loader2 className="h-10 w-10 text-[#0B9F47] animate-spin mb-4" />
                  <p className="text-gray-500 font-medium">Rendering PDF preview...</p>
                </div>
              ) : (
                <div id="pdf-viewer-container" className="flex flex-col items-start gap-8 pb-10 w-full overflow-x-auto overflow-y-hidden min-h-[500px]">
                  <div className="flex flex-col items-center w-full min-w-max">
                    {pages.map((page, idx) => (
                      <div
                        key={idx}
                        id={`pdf-page-${idx}`}
                        className={cn(
                          "relative bg-white shadow-xl transition-all duration-300",
                          activePageIndex === idx ? "ring-2 ring-[#0B9F47]" : ""
                        )}
                        style={{
                          width: page.width * zoom,
                          height: page.height * zoom,
                        }}
                        onClick={() => setActivePageIndex(idx)}
                      >
                        {/* Fabric Drawing Overlays */}
                        <CanvasOverlay
                          idx={idx}
                          page={page}
                          zoom={zoom}
                          activeTool={activeTool}
                          brushSize={brushSize}
                          onCanvasReady={(canvas) => {
                            fabricCanvases.current[idx] = canvas;
                          }}
                        />

                        {/* Detected Watermark Selection Layers - only show in Select mode */}
                        {activeTool === "select" && page.objects.map((obj, oIdx) => (
                          <div
                            key={`${idx}-${oIdx}`}
                            className={cn(
                              "absolute border-2 transition-all cursor-pointer",
                              selectedObjects[obj.name]
                                ? "bg-[#0B9F47]/20 border-[#0B9F47] shadow-[0_0_10px_rgba(11,159,71,0.5)] z-20"
                                : "bg-red-500/5 border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 z-10"
                            )}
                            style={{
                              left: obj.x * zoom,
                              top: obj.y * zoom,
                              width: obj.width * zoom,
                              height: obj.height * zoom,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedObjects(prev => ({
                                ...prev,
                                [obj.name]: !prev[obj.name]
                              }));
                            }}
                          >
                            {selectedObjects[obj.name] && (
                              <div className="absolute -top-6 left-0 bg-[#0B9F47] text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm font-bold whitespace-nowrap">
                                Selected for removal
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="absolute -left-16 top-0 text-[10px] font-bold text-gray-400 hidden lg:flex h-full flex-col justify-start pt-4">
                          PAGE {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {status === "processing" && (
          <ProcessingIndicator
            status={status}
            message="Analyzing and removing watermarks..."
          />
        )}
      </div>
    </ToolLayout>
  );
}

// Fabric Canvas Overlay Component
function CanvasOverlay({
  idx,
  page,
  zoom,
  activeTool,
  brushSize,
  onCanvasReady
}: {
  idx: number;
  page: PageData;
  zoom: number;
  activeTool: string;
  brushSize: number;
  onCanvasReady: (canvas: Canvas) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const lastZoomRef = useRef(zoom);

  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: page.width * zoom,
      height: page.height * zoom,
      isDrawingMode: activeTool === "brush",
      enableRetinaScaling: true,
    });

    // Set background image
    const setBg = async () => {
      const img = await new Promise<HTMLImageElement>((resolve) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.src = page.canvasDataUrl;
      });
      const fabImg = new FabricImage(img, {
        name: 'bg',
        scaleX: (page.width * zoom) / img.width,
        scaleY: (page.height * zoom) / img.height,
        selectable: false,
        evented: false,
      });
      canvas.add(fabImg);
      canvas.sendObjectToBack(fabImg);
      canvas.renderAll();
    };
    setBg();

    const brush = new PencilBrush(canvas);
    brush.color = "rgba(255, 0, 0, 0.5)"; // Select color
    brush.width = brushSize * zoom;
    canvas.freeDrawingBrush = brush;

    fabricRef.current = canvas;
    onCanvasReady(canvas);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []); // Only once

  useEffect(() => {
    const canvas = fabricRef.current;
    if (canvas) {
      canvas.isDrawingMode = activeTool === "brush";
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = brushSize * zoom;
      }

      const factor = zoom / lastZoomRef.current;
      lastZoomRef.current = zoom;

      canvas.setDimensions({
        width: page.width * zoom,
        height: page.height * zoom
      });

      // Synchronize all objects to the new zoom scale
      canvas.getObjects().forEach(obj => {
        obj.scaleX *= factor;
        obj.scaleY *= factor;
        obj.left *= factor;
        obj.top *= factor;
        obj.setCoords();
      });

      canvas.requestRenderAll();
    }
  }, [activeTool, brushSize, zoom]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-30 pointer-events-auto">
      <canvas ref={canvasRef} />
    </div>
  );
}

