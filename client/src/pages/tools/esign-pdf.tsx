import { useState, useRef, useEffect, useCallback } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Download, Type, PenTool, Move, Trash2,
  Undo, Redo, ZoomIn, ZoomOut, Save,
  MousePointer2, Eraser
} from "lucide-react";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import * as pdfjsLib from 'pdfjs-dist';
import { Canvas, IText, Path, PencilBrush } from "fabric";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PageData {
  pageNumber: number;
  canvasDataUrl: string;
  width: number;
  height: number;
  viewBox: number[];
}

export default function ESignPDF() {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "text">("select");
  const [zoom, setZoom] = useState(0.5);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const { toast } = useToast();

  const activeToolRef = useRef(activeTool);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  const fabricCanvases = useRef<(Canvas | null)[]>([]);

  useEffect(() => {
    return () => {
      fabricCanvases.current.forEach(c => c?.dispose());
    };
  }, []);

  const handleFilesSelected = async (uploadedFiles: UploadedFile[]) => {
    if (uploadedFiles.length === 0) return;

    // Cleanup old session
    fabricCanvases.current.forEach(c => c?.dispose());
    fabricCanvases.current = [];
    setPages([]);
    setPdfDoc(null);

    setIsProcessing(true);
    const selectedFile = uploadedFiles[0];
    setFile(selectedFile);

    try {
      const arrayBuffer = await selectedFile.file.arrayBuffer();

      const libDoc = await PDFDocument.load(arrayBuffer);
      setPdfDoc(libDoc);

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfjsDoc = await loadingTask.promise;

      const newPages: PageData[] = [];
      for (let i = 1; i <= pdfjsDoc.numPages; i++) {
        const page = await pdfjsDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); // Render at 2x for clarity

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport }).promise;

        newPages.push({
          pageNumber: i,
          canvasDataUrl: canvas.toDataURL("image/png"),
          width: viewport.width,
          height: viewport.height,
          viewBox: page.view
        });
      }

      setPages(newPages);
      fabricCanvases.current = new Array(newPages.length).fill(null);
      toast({ title: "Success", description: `PDF loaded with ${newPages.length} pages.` });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load PDF.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const initFabric = useCallback((index: number, el: HTMLCanvasElement) => {
    if (!el || fabricCanvases.current[index]) return;

    const page = pages[index];
    const canvas = new Canvas(el, {
      width: page.width,
      height: page.height,
      selection: true,
      allowTouchScrolling: true
    });

    // Initialize brush
    const brush = new PencilBrush(canvas);
    brush.color = "#000000";
    brush.width = 3;
    canvas.freeDrawingBrush = brush;

    canvas.on("mouse:down", (opt) => {
      setActivePageIndex(index);

      // If clicking directly on canvas (not an object) and tool is text
      if (!opt.target && activeToolRef.current === "text") {
        const pointer = canvas.getScenePoint(opt.e);
        const text = new IText("Type here", {
          left: pointer.x,
          top: pointer.y,
          fontSize: 30,
          fill: "#000000",
          fontFamily: "Arial",
          padding: 10,
          cornerSize: 10,
          transparentCorners: false,
          borderColor: "#0B9F47",
          cornerColor: "#0B9F47"
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        setActiveTool("select");
        canvas.renderAll();
      }
    });

    fabricCanvases.current[index] = canvas;
  }, [pages]);

  useEffect(() => {
    fabricCanvases.current.forEach((canvas, idx) => {
      if (!canvas || !pages[idx]) return;
      const page = pages[idx];
      canvas.setDimensions({
        width: page.width * zoom,
        height: page.height * zoom
      });
      canvas.setZoom(zoom);
      canvas.renderAll();
    });
  }, [zoom, pages]);

  useEffect(() => {
    fabricCanvases.current.forEach((canvas) => {
      if (!canvas) return;
      canvas.isDrawingMode = activeTool === "draw";
      canvas.selection = activeTool === "select";

      // If text tool is active, we want the canvas to be clickable but not drag-selecting
      if (activeTool === "text") {
        canvas.selection = false;
      }

      // Update cursors
      if (activeTool === "draw") {
        canvas.defaultCursor = "crosshair";
      } else if (activeTool === "text") {
        canvas.defaultCursor = "text";
      } else {
        canvas.defaultCursor = "default";
      }
      canvas.renderAll();
    });
  }, [activeTool]);

  // Set initial zoom based on container width
  useEffect(() => {
    if (pages.length > 0) {
      const container = document.getElementById("pages-container");
      if (container) {
        const containerWidth = container.clientWidth;
        const pageWidth = pages[0].width;
        // Aim for about 95% of container width
        const initialZoom = (containerWidth * 0.95) / pageWidth;
        setZoom(Math.min(initialZoom, 1.0));
      }
    }
  }, [pages]);

  const savePDF = async () => {
    if (!pdfDoc || !file) return;
    setIsProcessing(true);

    try {
      const exportPdf = await PDFDocument.create();

      for (let i = 0; i < pages.length; i++) {
        const pageData = pages[i];
        const [copiedPage] = await exportPdf.copyPages(pdfDoc, [i]);
        const { width: pdfWidth, height: pdfHeight } = copiedPage.getSize();

        const canvas = fabricCanvases.current[i];
        if (canvas) {
          // Important: We need to export at original scale (no zoom)
          // We capture the annotations at the same resolution as the background rendering (2x)
          const originalZoom = canvas.getZoom();
          canvas.setZoom(1);
          canvas.setDimensions({ width: pageData.width, height: pageData.height });

          const annotationsDataUrl = canvas.toDataURL({
            format: "png",
            multiplier: 1,
          });

          // Restore zoom
          canvas.setZoom(originalZoom);
          canvas.setDimensions({
            width: pageData.width * originalZoom,
            height: pageData.height * originalZoom
          });

          // Convert dataURL to Uint8Array for pdf-lib
          const base64Data = annotationsDataUrl.split(',')[1];
          const binaryData = atob(base64Data);
          const bytes = new Uint8Array(binaryData.length);
          for (let j = 0; j < binaryData.length; j++) {
            bytes[j] = binaryData.charCodeAt(j);
          }

          const annotationImage = await exportPdf.embedPng(bytes);

          // PDF-lib coordinate system: (0,0) is bottom-left.
          // Our canvas image is top-down. 
          // Drawing it at (0,0) with full page size will overlay it correctly.
          copiedPage.drawImage(annotationImage, {
            x: 0,
            y: 0,
            width: pdfWidth,
            height: pdfHeight,
          });
        }

        exportPdf.addPage(copiedPage);
      }

      const pdfBytes = await exportPdf.save();
      const blob = new Blob([pdfBytes.buffer as any], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `signed_${file.file.name}`;
      link.click();

      toast({ title: "Success", description: "Your signed PDF has been downloaded." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save signed PDF", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="eSign PDF"
      description="Draw your signature or add text to sign PDF documents electronically."
      category="PDF Tools"
      keywords={["esign pdf", "pdf signature", "electronic signature", "sign pdf", "pdf sign"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload the document you want to sign" },
        { name: "Select Tool", text: "Choose Pen to draw or Text to type" },
        { name: "Place", text: "Draw or type anywhere on the document pages" },
        { name: "Download", text: "Export and download your signed PDF" },
      ]}
    >
      <div className="max-w-7xl mx-auto">
        {!file ? (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PenTool className="h-5 w-5 text-[#0B9F47]" />
              Upload Document
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
            {/* Sidebar Tools */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                <Card className="shadow-lg border-white/40 bg-white/80 backdrop-blur-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PenTool className="h-5 w-5 text-primary" /> Signature Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant={activeTool === "select" ? "default" : "outline"}
                        onClick={() => setActiveTool("select")}
                        className="justify-start gap-3 h-11"
                      >
                        <MousePointer2 className="h-4 w-4" /> Select / Move
                      </Button>
                      <Button
                        variant={activeTool === "draw" ? "default" : "outline"}
                        onClick={() => setActiveTool("draw")}
                        className="justify-start gap-3 h-11"
                      >
                        <PenTool className="h-4 w-4" /> Draw Signature
                      </Button>
                      <Button
                        variant={activeTool === "text" ? "default" : "outline"}
                        onClick={() => setActiveTool("text")}
                        className="justify-start gap-3 h-11"
                      >
                        <Type className="h-4 w-4" /> Add Text
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Button
                        variant="destructive"
                        className="w-full justify-start gap-3"
                        onClick={() => {
                          const canvas = fabricCanvases.current[activePageIndex];
                          if (!canvas) return;
                          const activeObjects = canvas.getActiveObjects();
                          if (activeObjects.length > 0) {
                            canvas.remove(...activeObjects);
                            canvas.discardActiveObject();
                            canvas.renderAll();
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Remove Selected
                      </Button>
                    </div>

                    <Separator />

                    <Button
                      className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white shadow-lg h-12 text-lg font-semibold"
                      onClick={savePDF}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        "Processing..."
                      ) : (
                        <>
                          <Download className="mr-2 h-5 w-5" /> Download PDF
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Page Navigation */}
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
                              document.getElementById(`page-container-${i}`)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <img src={p.canvasDataUrl} className="w-full h-auto" alt={`Page ${i + 1}`} />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                            <Badge className="absolute top-1 left-1 bg-white text-black hover:bg-white text-[10px] h-5 min-w-5 flex items-center justify-center">
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

            {/* Document Viewer */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex justify-between items-center bg-white/80 backdrop-blur-md p-3 rounded-xl border border-white/40 sticky top-6 z-20 shadow-sm">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.1, z - 0.05))}><ZoomOut className="h-4 w-4" /></Button>
                  <span className="text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2.0, z + 0.05))}><ZoomIn className="h-4 w-4" /></Button>
                </div>
                <div className="hidden md:block text-sm text-muted-foreground font-medium truncate max-w-[200px]">
                  {file.file.name}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/50">{pages.length} Pages</Badge>
                </div>
              </div>

              <div id="pages-container" className="flex flex-col items-center gap-8 pb-20 overflow-x-auto w-full">
                {pages.map((page, idx) => (
                  <div
                    key={idx}
                    id={`page-container-${idx}`}
                    className={cn(
                      "relative bg-white shadow-xl transition-shadow",
                      activePageIndex === idx ? "shadow-2xl ring-2 ring-[#0B9F47]/30" : "hover:shadow-2xl"
                    )}
                    style={{
                      width: page.width * zoom,
                      height: page.height * zoom,
                    }}
                    onClick={() => setActivePageIndex(idx)}
                  >
                    {/* Rendered PDF Page as Background */}
                    <img
                      src={page.canvasDataUrl}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ userSelect: 'none' }}
                      alt=""
                    />

                    {/* Fabric Canvas Overlay */}
                    <canvas
                      ref={(el) => el && initFabric(idx, el)}
                      className="absolute inset-0"
                    />

                    <div className="absolute -right-12 top-0 bg-white/80 backdrop-blur-md rounded-full shadow-md py-2 px-1 text-[10px] font-bold text-gray-500 vertical-text hidden lg:block">
                      PAGE {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
