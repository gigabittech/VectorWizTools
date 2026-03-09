import { useState, useRef, useEffect, useCallback } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Download, Type, Eraser, Move, Trash2, RotateCw,
  RotateCcw, Crop, Layers, Image as ImageIcon,
  Save, Undo, Redo, ZoomIn, ZoomOut, Plus, X,
  FileText, Ghost
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import * as pdfjsLib from 'pdfjs-dist';
import { Canvas, IText, Rect, Image as FabricImage } from "fabric";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PageData {
  pageNumber: number;
  canvasDataUrl: string;
  rotation: number;
  isDeleted: boolean;
  width: number;
  height: number;
  viewBox: number[];
}

export default function AdvancedPDFEditor() {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<"select" | "text" | "erase" | "crop">("select");
  const [zoom, setZoom] = useState(0.8);
  const [watermark, setWatermark] = useState<{ text: string; opacity: number } | null>(null);
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
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport }).promise;

        newPages.push({
          pageNumber: i,
          canvasDataUrl: canvas.toDataURL(),
          rotation: 0,
          isDeleted: false,
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

  const extractText = async (index: number, canvas: Canvas) => {
    if (!file) return;
    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfjsDoc = await loadingTask.promise;
      const page = await pdfjsDoc.getPage(index + 1);
      const textContent = await page.getTextContent();
      const items = textContent.items as any[];
      const pageData = pages[index];
      const scale = pageData.width / pageData.viewBox[2];

      const lines: any[][] = [];
      items.forEach(item => {
        if (!item.str.trim()) return;
        const lastLine = lines[lines.length - 1];
        if (lastLine && Math.abs(lastLine[0].transform[5] - item.transform[5]) < 5) {
          lastLine.push(item);
        } else {
          lines.push([item]);
        }
      });

      lines.forEach(lineItems => {
        lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

        let currentText = "";
        const startX = lineItems[0].transform[4] * scale;
        const startY = pageData.height - (lineItems[0].transform[5] * scale) - (lineItems[0].transform[0] * scale);
        const currentFontSize = lineItems[0].transform[0] * scale;

        lineItems.forEach((item, i) => {
          currentText += item.str;
          if (lineItems[i + 1]) {
            const gap = lineItems[i + 1].transform[4] - (item.transform[4] + item.width);
            if (gap > 5) currentText += " ";
          }
        });

        const text = new IText(currentText, {
          left: startX,
          top: startY,
          fontSize: currentFontSize,
          fill: "transparent",
          backgroundColor: "rgba(59, 130, 246, 0.04)",
          cursorColor: "#3b82f6",
          padding: 2,
          hoverCursor: "text",
          transparentCorners: false,
          borderColor: "#3b82f6",
          cornerColor: "#3b82f6",
          cornerSize: 8,
        });

        text.on("mousedown", () => {
          if (text.fill === "transparent") {
            text.set("backgroundColor", "rgba(59, 130, 246, 0.1)");
            canvas.renderAll();
          }
        });

        (text as any).originalPos = { x: startX, y: startY, w: text.width, h: text.height };
        (text as any).isExtracted = true;

        text.on("changed", () => {
          text.set("fill", "#000000");
          (text as any).isModified = true;
        });

        canvas.add(text);
      });
      canvas.renderAll();
    } catch (err) {
      console.error("Text extraction failed", err);
    }
  };

  const initFabric = useCallback((index: number, el: HTMLCanvasElement) => {
    if (!el || fabricCanvases.current[index]) return;

    const page = pages[index];
    const canvas = new Canvas(el, {
      width: page.width,
      height: page.height,
    });

    // Handle background
    FabricImage.fromURL(page.canvasDataUrl).then((img) => {
      canvas.backgroundImage = img;
      canvas.renderAll();
      extractText(index, canvas);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && document.activeElement?.tagName !== "INPUT") {
        const activeCanvas = fabricCanvases.current[activePageIndex];
        if (!activeCanvas) return;
        const activeObject = activeCanvas.getActiveObject();
        if (activeObject && !(activeObject as any).isEditing) {
          activeCanvas.remove(activeObject);
          activeCanvas.renderAll();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePageIndex]);

  useEffect(() => {
    fabricCanvases.current.forEach((canvas) => {
      if (!canvas) return;
      canvas.isDrawingMode = false;
      canvas.selection = activeTool === "select";
      canvas.off("mouse:down");

      canvas.on("mouse:down", (opt) => {
        if (opt.target) return;

        const pointer = canvas.getScenePoint(opt.e);
        if (activeTool === "text") {
          const text = new IText("New Text", {
            left: pointer.x,
            top: pointer.y,
            fontSize: 40, // Increased for 2x scale canvas
            fill: "#000000",
            scaleX: 1,
            scaleY: 1,
          });
          canvas.add(text);
          canvas.setActiveObject(text);
          canvas.renderAll();
        } else if (activeTool === "erase") {
          const rect = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 150,
            height: 40,
            fill: "white",
            stroke: "#ddd",
            strokeWidth: 1,
            transparentCorners: false,
          });
          canvas.add(rect);
          setActiveTool("select");
        } else if (activeTool === "crop") {
          const existing = canvas.getObjects().filter(o => (o as any).isCropRect);
          canvas.remove(...existing);
          const rect = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 300,
            height: 300,
            fill: "transparent",
            stroke: "#3b82f6",
            strokeWidth: 3,
            strokeDashArray: [8, 4],
            transparentCorners: false,
          });
          (rect as any).isCropRect = true;
          canvas.add(rect);
          setActiveTool("select");
        }
      });
    });
  }, [activeTool, zoom]);

  const rotatePage = (index: number, dir: "cw" | "ccw") => {
    const newPages = [...pages];
    newPages[index].rotation = (newPages[index].rotation + (dir === "cw" ? 90 : -90)) % 360;
    setPages(newPages);
  };

  const deletePage = (index: number) => {
    const newPages = [...pages];
    newPages[index].isDeleted = true;
    setPages(newPages);
    toast({ title: "Page Removed", description: `Page ${index + 1} will not be included in the final PDF.` });
  };

  const savePDF = async () => {
    if (!pdfDoc || !file) return;
    setIsProcessing(true);

    try {
      const exportPdf = await PDFDocument.create();
      const font = await exportPdf.embedFont(StandardFonts.Helvetica);

      for (let i = 0; i < pages.length; i++) {
        const pageData = pages[i];
        if (pageData.isDeleted) continue;

        const [copiedPage] = await exportPdf.copyPages(pdfDoc, [i]);
        const { width: pdfWidth, height: pdfHeight } = copiedPage.getSize();

        if (pageData.rotation !== 0) {
          copiedPage.setRotation(degrees(pageData.rotation));
        }

        const canvas = fabricCanvases.current[i];
        if (canvas) {
          // 0. White out original positions of modified text objects
          const objects = canvas.getObjects();
          const scaleX = pdfWidth / pageData.width;
          const scaleY = pdfHeight / pageData.height;

          for (const obj of objects) {
            if ((obj as any).isModified && (obj as any).originalPos) {
              const orig = (obj as any).originalPos;
              copiedPage.drawRectangle({
                x: orig.x * scaleX,
                y: pdfHeight - ((orig.y + orig.h) * scaleY),
                width: orig.w * scaleX,
                height: orig.h * scaleY,
                color: rgb(1, 1, 1),
              });
            }
          }

          // 1. Hide background image to capture ONLY annotations
          const bg = canvas.backgroundImage;
          canvas.backgroundImage = undefined;

          // 2. Capture at original resolution (the scale we rendered at, which is scale: 2)
          // We need to temporarily reset zoom to 1 to get full resolution capture
          const originalZoom = canvas.getZoom();
          canvas.setZoom(1);
          canvas.setDimensions({ width: pageData.width, height: pageData.height });

          const annotationsDataUrl = canvas.toDataURL({
            format: "png",
            multiplier: 1,
          });

          // 3. Restore canvas state
          canvas.setZoom(originalZoom);
          canvas.setDimensions({
            width: pageData.width * originalZoom,
            height: pageData.height * originalZoom
          });
          canvas.backgroundImage = bg;
          canvas.renderAll();

          // 4. Embed and Draw Overlay
          const base64Data = annotationsDataUrl.split(',')[1];
          const binaryData = atob(base64Data);
          const bytes = new Uint8Array(binaryData.length);
          for (let j = 0; j < binaryData.length; j++) {
            bytes[j] = binaryData.charCodeAt(j);
          }

          const annotationImage = await exportPdf.embedPng(bytes);

          // Draw the overlay. PDF-lib (0,0) is bottom-left.
          // Since our PNG represents the whole page, drawing it at (0,0) with page size 
          // will align it perfectly.
          copiedPage.drawImage(annotationImage, {
            x: 0,
            y: 0,
            width: pdfWidth,
            height: pdfHeight,
          });
        }

        if (watermark) {
          copiedPage.drawText(watermark.text, {
            x: pdfWidth / 6,
            y: pdfHeight / 3,
            size: 60,
            font,
            color: rgb(0.7, 0.7, 0.7),
            opacity: watermark.opacity,
            rotate: degrees(35),
          });
        }
        exportPdf.addPage(copiedPage);
      }

      const pdfBytes = await exportPdf.save();
      const blob = new Blob([pdfBytes.buffer as any], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `edited_${file.file.name}`;
      link.click();
      toast({ title: "Success", description: "Your PDF has been saved and downloaded." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save PDF", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Pro PDF Editor"
      description="Interactive PDF editor with text editing, cropping, and more."
      category="PDF Tools"
      keywords={["pdf editor", "edit pdf online", "pdf text editor"]}
      howToSteps={[
        { name: "Upload", text: "Choose your PDF file." },
        { name: "Edit", text: "Click tools and interact with pages." },
        { name: "Watermark", text: "Add custom watermark if needed." },
        { name: "Download", text: "Save your changes." }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4">
        {!file ? (
          <Card className="border-dashed border-2 py-12">
            <CardContent>
              <FileUploader
                accept="application/pdf"
                onFilesSelected={handleFilesSelected}
                multiple={false}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-6 self-start">
                <Card className="shadow-lg border-primary/10">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" /> Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={activeTool === "select" ? "default" : "outline"}
                        onClick={() => setActiveTool("select")}
                        className="gap-2"
                      >
                        <Move className="h-4 w-4" /> Select
                      </Button>
                      <Button
                        variant={activeTool === "text" ? "default" : "outline"}
                        onClick={() => setActiveTool("text")}
                        className="gap-2"
                      >
                        <Type className="h-4 w-4" /> Text
                      </Button>
                      <Button
                        variant={activeTool === "erase" ? "default" : "outline"}
                        onClick={() => setActiveTool("erase")}
                        className="gap-2"
                      >
                        <Eraser className="h-4 w-4" /> Erase
                      </Button>
                      <Button
                        variant={activeTool === "crop" ? "default" : "outline"}
                        onClick={() => setActiveTool("crop")}
                        className="gap-2"
                      >
                        <Crop className="h-4 w-4" /> Crop
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Watermark</Label>
                      <Input
                        placeholder="Text..."
                        onChange={(e) => setWatermark(e.target.value ? { text: e.target.value, opacity: watermark?.opacity || 0.3 } : null)}
                      />
                      {watermark && (
                        <div className="space-y-3 pt-2">
                          <div className="flex justify-between text-xs">
                            <span>Opacity</span>
                            <span>{Math.round(watermark.opacity * 100)}%</span>
                          </div>
                          <Slider
                            value={[watermark.opacity * 100]}
                            onValueChange={([v]) => setWatermark({ ...watermark, opacity: v / 100 })}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      onClick={() => {
                        const canvas = fabricCanvases.current[activePageIndex];
                        if (!canvas) return;
                        const active = canvas.getActiveObject();
                        if (active) {
                          canvas.remove(active);
                          canvas.renderAll();
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Delete Selected
                    </Button>

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 shadow-md"
                      onClick={savePDF}
                      disabled={isProcessing}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isProcessing ? "Processing..." : "Export PDF"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hidden lg:block">
                  <CardHeader><CardTitle className="text-sm">Page Navigation</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-3">
                        {pages.map((p, i) => !p.isDeleted && (
                          <div
                            key={i}
                            className={cn(
                              "relative border rounded cursor-pointer transition-all p-1",
                              activePageIndex === i ? "border-primary ring-1 ring-primary" : "hover:border-primary/50"
                            )}
                            onClick={() => {
                              setActivePageIndex(i);
                              document.getElementById(`page-view-${i}`)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <img src={p.canvasDataUrl} className="w-full h-auto rounded-sm" alt={`P${i + 1}`} />
                            <Badge className="absolute top-1 left-1 h-5 text-[10px]">{i + 1}</Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="flex justify-between items-center bg-white/50 backdrop-blur p-4 rounded-xl border sticky top-4 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white border rounded-lg px-2 shadow-sm">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
                    <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1">{pages.filter(p => !p.isDeleted).length} Pages</Badge>
                </div>
              </div>

              <div className="flex flex-col items-center gap-12 pb-24 w-full">
                {pages.map((page, idx) => !page.isDeleted && (
                  <div
                    key={idx}
                    id={`page-view-${idx}`}
                    className={cn(
                      "relative bg-white shadow-2xl transition-all duration-300 ring-offset-8 mx-auto",
                      activePageIndex === idx ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/30"
                    )}
                    style={{
                      width: page.width * zoom,
                      height: page.height * zoom,
                      transform: `rotate(${page.rotation}deg)`,
                      transformOrigin: "center center"
                    }}
                    onClick={() => setActivePageIndex(idx)}
                  >
                    <div className="absolute -left-14 top-0 flex flex-col gap-3">
                      <Button variant="secondary" size="icon" className="rounded-full shadow-lg" onClick={(e) => { e.stopPropagation(); rotatePage(idx, "ccw"); }}><RotateCcw className="h-4 w-4" /></Button>
                      <Button variant="secondary" size="icon" className="rounded-full shadow-lg" onClick={(e) => { e.stopPropagation(); rotatePage(idx, "cw"); }}><RotateCw className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" className="rounded-full shadow-lg" onClick={(e) => { e.stopPropagation(); deletePage(idx); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>

                    <canvas
                      ref={(el) => el && initFabric(idx, el)}
                      className="border shadow-inner"
                    />
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
