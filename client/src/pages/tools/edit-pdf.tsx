import { useState, useRef, useEffect, useCallback } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Type, Eraser, Move, Trash2, RotateCw, RotateCcw,
  Crop, Layers, Save, ZoomIn, ZoomOut,
  Bold, Italic, Link as LinkIcon, ImagePlus,
  MousePointer2, ExternalLink, X, Check
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts, degrees, PDFName, PDFArray } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { Canvas, IText, Rect, Image as FabricImage, FabricObject } from "fabric";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageData {
  pageNumber: number;
  /** High-res data URL (rendered at RENDER_SCALE) */
  canvasDataUrl: string;
  /** Logical pt dimensions at scale=1 */
  logicalWidth: number;
  logicalHeight: number;
  /** Pixel dimensions of the rendered image */
  renderWidth: number;
  renderHeight: number;
  viewBox: number[];
  rotation: number;
  isDeleted: boolean;
}

interface LinkAnnotation {
  pageIndex: number;
  /** Normalised 0-1 coords relative to logical page size */
  x: number; y: number; w: number; h: number;
  url: string;
  text: string;
}

interface LinkPopupState {
  visible: boolean;
  anchorX: number; // viewport px
  anchorY: number;
  url: string;
  selectedText: string;
  pageIndex: number;
  /** Page-local CSS px bounding box of the selection */
  selectionRect: { x: number; y: number; w: number; h: number } | null;
}

// Render at 2× for sharpness, CSS-scale back down for display
const RENDER_SCALE = 2;

// ─── Inject PDF.js text-layer CSS once ───────────────────────────────────────
function ensureTextLayerCSS() {
  if (document.getElementById("pdfjs-tl-style")) return;
  const s = document.createElement("style");
  s.id = "pdfjs-tl-style";
  s.textContent = `
    .pdf-tl span, .pdf-tl br {
      color: transparent;
      position: absolute;
      white-space: pre;
      cursor: text;
      transform-origin: 0% 0%;
    }
    .pdf-tl ::selection {
      background: rgba(37,99,235,0.28);
      color: transparent;
    }
    .pdf-tl {
      position: absolute;
      inset: 0;
      overflow: hidden;
      line-height: 1;
      user-select: text;
    }
  `;
  document.head.appendChild(s);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdvancedPDFEditor() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [pdfLibDoc, setPdfLibDoc] = useState<PDFDocument | null>(null);
  const [pdfjsDoc, setPdfjsDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<"select" | "text" | "erase" | "crop" | "link">("select");
  const [zoom, setZoom] = useState(1.0);
  const [watermark, setWatermark] = useState<{ text: string; opacity: number } | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedFabricObj, setSelectedFabricObj] = useState<FabricObject | null>(null);
  const [linkAnnotations, setLinkAnnotations] = useState<LinkAnnotation[]>([]);
  const [linkPopup, setLinkPopup] = useState<LinkPopupState>({
    visible: false, anchorX: 0, anchorY: 0,
    url: "", selectedText: "", pageIndex: 0, selectionRect: null,
  });

  const { toast } = useToast();
  const fabricRefs = useRef<(Canvas | null)[]>([]);
  // null = "not yet built at this zoom"; stored div ref = "already built"
  const textLayerBuilt = useRef<(HTMLDivElement | null)[]>([]);
  const pageContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const linkUrlInputRef = useRef<HTMLInputElement>(null);
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => { fabricRefs.current.forEach(c => c?.dispose()); }, []);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLinkPopup(p => ({ ...p, visible: false }));
        window.getSelection()?.removeAllRanges();
        return;
      }
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if ((e.key === "Delete" || e.key === "Backspace") && tag !== "INPUT" && tag !== "TEXTAREA") {
        const fc = fabricRefs.current[activePageIndex];
        const obj = fc?.getActiveObject();
        if (obj && !(obj as any).isEditing) { fc?.remove(obj); fc?.renderAll(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activePageIndex]);

  // ─── Load PDF ──────────────────────────────────────────────────────────────
  const handleFilesSelected = async (files: UploadedFile[]) => {
    if (!files.length) return;
    fabricRefs.current.forEach(c => c?.dispose());
    fabricRefs.current = [];
    textLayerBuilt.current = [];
    pageContainerRefs.current = [];
    setPages([]);
    setPdfLibDoc(null);
    setPdfjsDoc(null);
    setLinkAnnotations([]);
    setLinkPopup(p => ({ ...p, visible: false }));

    const uf = files[0];
    setUploadedFile(uf);
    setIsProcessing(true);

    try {
      const ab = await uf.file.arrayBuffer();
      const [libDoc, jsDoc] = await Promise.all([
        PDFDocument.load(ab),
        pdfjsLib.getDocument({ data: ab.slice(0) }).promise,
      ]);
      setPdfLibDoc(libDoc);
      setPdfjsDoc(jsDoc);

      const newPages: PageData[] = [];
      for (let i = 1; i <= jsDoc.numPages; i++) {
        const page = await jsDoc.getPage(i);
        const logVP = page.getViewport({ scale: 1 });
        const renVP = page.getViewport({ scale: RENDER_SCALE });

        const off = document.createElement("canvas");
        off.width = renVP.width;
        off.height = renVP.height;
        await page.render({ canvasContext: off.getContext("2d")!, viewport: renVP }).promise;

        newPages.push({
          pageNumber: i,
          canvasDataUrl: off.toDataURL("image/jpeg", 0.92),
          logicalWidth: logVP.width,
          logicalHeight: logVP.height,
          renderWidth: renVP.width,
          renderHeight: renVP.height,
          viewBox: page.view,
          rotation: 0,
          isDeleted: false,
        });
      }

      fabricRefs.current = new Array(newPages.length).fill(null);
      textLayerBuilt.current = new Array(newPages.length).fill(null);
      pageContainerRefs.current = new Array(newPages.length).fill(null);
      setPages(newPages);
      toast({ title: "PDF Loaded", description: `${newPages.length} page(s) ready.` });
    } catch (err) {
      console.error(err);
      toast({ title: "Load Error", description: "Could not open PDF.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Init Fabric canvas ────────────────────────────────────────────────────
  // KEY FIX: set background image with explicit scaleX/scaleY so it fills
  // the canvas exactly — no cutting off, no distortion.
  const initFabric = useCallback((pageIdx: number, canvasEl: HTMLCanvasElement) => {
    if (!canvasEl || fabricRefs.current[pageIdx]) return;
    const page = pages[pageIdx];
    if (!page) return;

    const dispW = page.logicalWidth * zoom;
    const dispH = page.logicalHeight * zoom;

    const fc = new Canvas(canvasEl, {
      width: dispW,
      height: dispH,
      selection: activeToolRef.current === "select",
    });

    FabricImage.fromURL(page.canvasDataUrl).then(img => {
      // Scale rendered bitmap (renderWidth × renderHeight) → display (dispW × dispH)
      img.set({
        left: 0, top: 0,
        originX: "left", originY: "top",
        scaleX: dispW / page.renderWidth,
        scaleY: dispH / page.renderHeight,
        selectable: false, evented: false,
      });
      fc.backgroundImage = img;
      fc.renderAll();
    });

    fc.on("selection:created", e => setSelectedFabricObj(e.selected?.[0] ?? null));
    fc.on("selection:updated", e => setSelectedFabricObj(e.selected?.[0] ?? null));
    fc.on("selection:cleared", () => setSelectedFabricObj(null));

    fabricRefs.current[pageIdx] = fc;
  }, [pages, zoom]);

  // ─── Init PDF.js text layer ────────────────────────────────────────────────
  // Re-builds if zoom changes (textLayerBuilt ref is nulled on zoom change).
  const initTextLayer = useCallback(async (pageIdx: number, div: HTMLDivElement) => {
    if (!pdfjsDoc || !pages[pageIdx]) return;
    if (textLayerBuilt.current[pageIdx] === div) return; // already built
    textLayerBuilt.current[pageIdx] = div;

    ensureTextLayerCSS();
    div.innerHTML = "";
    div.className = "pdf-tl";

    const page = pages[pageIdx];
    const pdfjsPage = await pdfjsDoc.getPage(page.pageNumber);
    // Viewport must match the CSS display size (logical × zoom)
    const vp = pdfjsPage.getViewport({ scale: zoom });

    const textContent = await pdfjsPage.getTextContent();
    const tl = new pdfjsLib.TextLayer({
      textContentSource: textContent,
      container: div,
      viewport: vp,
    });
    await tl.render();
  }, [pdfjsDoc, pages, zoom]);

  // ─── Re-sync Fabric when zoom changes ─────────────────────────────────────
  useEffect(() => {
    fabricRefs.current.forEach((fc, idx) => {
      if (!fc || !pages[idx]) return;
      const page = pages[idx];
      const dispW = page.logicalWidth * zoom;
      const dispH = page.logicalHeight * zoom;
      fc.setDimensions({ width: dispW, height: dispH });
      // Re-scale background image
      const bg = fc.backgroundImage as FabricImage | undefined;
      if (bg) {
        bg.set({ scaleX: dispW / page.renderWidth, scaleY: dispH / page.renderHeight });
      }
      fc.renderAll();
    });
    // Force text layers to rebuild at new zoom
    textLayerBuilt.current = textLayerBuilt.current.map(() => null);
  }, [zoom, pages]);

  // ─── Tool behaviour on Fabric canvases ────────────────────────────────────
  useEffect(() => {
    fabricRefs.current.forEach(fc => {
      if (!fc) return;
      fc.isDrawingMode = false;
      fc.selection = activeTool === "select";
      fc.defaultCursor = activeTool === "text" ? "crosshair" : "default";
      fc.off("mouse:down");

      fc.on("mouse:down", opt => {
        const pointer = fc.getScenePoint(opt.e);

        if (activeTool === "text") {
          if (opt.target) return;
          const t = new IText("Type here", {
            left: pointer.x, top: pointer.y,
            fontSize: 18, fill: "#111827",
            fontFamily: "Georgia, serif",
          });
          fc.add(t); fc.setActiveObject(t); t.enterEditing(); fc.renderAll();
          return;
        }
        if (activeTool === "erase") {
          if (opt.target) { fc.remove(opt.target); fc.renderAll(); return; }
          fc.add(new Rect({
            left: pointer.x, top: pointer.y, width: 120, height: 28,
            fill: "white", stroke: "#e5e7eb", strokeWidth: 1,
          }));
          fc.renderAll(); return;
        }
        if (activeTool === "crop") {
          fc.getObjects().filter(o => (o as any).isCropRect).forEach(o => fc.remove(o));
          const r = new Rect({
            left: pointer.x, top: pointer.y, width: 200, height: 200,
            fill: "rgba(37,99,235,0.05)", stroke: "#2563eb",
            strokeWidth: 2, strokeDashArray: [6, 4],
          });
          (r as any).isCropRect = true;
          fc.add(r); fc.setActiveObject(r); fc.renderAll(); return;
        }
      });
    });
  }, [activeTool]);

  // ─── Text layer mouseup → link popup ──────────────────────────────────────
  useEffect(() => {
    if (activeTool !== "link") return;

    const handlers: Array<{ div: HTMLDivElement; fn: (e: MouseEvent) => void }> = [];

    textLayerBuilt.current.forEach((div, pageIdx) => {
      if (!div) return;

      const fn = (_e: MouseEvent) => {
        // Brief timeout lets browser finalise the selection
        setTimeout(() => {
          const sel = window.getSelection();
          if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

          const selectedText = sel.toString();
          const range = sel.getRangeAt(0);
          const clientRects = Array.from(range.getClientRects());
          if (!clientRects.length) return;

          // Union all client rects into one bounding box
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          for (const r of clientRects) {
            x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top);
            x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
          }

          const container = pageContainerRefs.current[pageIdx];
          const cRect = container?.getBoundingClientRect();

          setLinkPopup({
            visible: true,
            anchorX: x0 + window.scrollX,
            anchorY: y1 + window.scrollY + 10,
            url: "",
            selectedText,
            pageIndex: pageIdx,
            selectionRect: cRect
              ? { x: x0 - cRect.left, y: y0 - cRect.top, w: x1 - x0, h: y1 - y0 }
              : null,
          });

          setTimeout(() => linkUrlInputRef.current?.focus(), 80);
        }, 20);
      };

      div.addEventListener("mouseup", fn);
      handlers.push({ div, fn });
    });

    return () => handlers.forEach(({ div, fn }) => div.removeEventListener("mouseup", fn));
  }, [activeTool, pages]); // re-run if pages change (new text layers)

  // ─── Apply link ────────────────────────────────────────────────────────────
  const applyLink = () => {
    const { url, pageIndex, selectionRect, selectedText } = linkPopup;
    if (!url.trim()) {
      toast({ title: "URL required", description: "Please enter a URL.", variant: "destructive" });
      return;
    }
    if (!selectionRect) {
      toast({ title: "No selection", description: "Select some text first.", variant: "destructive" });
      return;
    }

    const page = pages[pageIndex];
    if (!page) return;

    const dispW = page.logicalWidth * zoom;
    const dispH = page.logicalHeight * zoom;

    setLinkAnnotations(prev => [...prev, {
      pageIndex,
      x: selectionRect.x / dispW,
      y: selectionRect.y / dispH,
      w: selectionRect.w / dispW,
      h: selectionRect.h / dispH,
      url: url.trim(),
      text: selectedText,
    }]);

    // Visual underline in Fabric
    const fc = fabricRefs.current[pageIndex];
    if (fc) {
      fc.add(new Rect({
        left: selectionRect.x,
        top: selectionRect.y + selectionRect.h - 2,
        width: selectionRect.w, height: 2,
        fill: "#2563eb", selectable: false, evented: false,
      }));
      fc.renderAll();
    }

    window.getSelection()?.removeAllRanges();
    setLinkPopup(p => ({ ...p, visible: false }));
    toast({
      title: "Hyperlink Added",
      description: `"${selectedText.slice(0, 40)}${selectedText.length > 40 ? "…" : ""}" → ${url}`,
    });
  };

  // ─── Image upload ──────────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const fc = fabricRefs.current[activePageIndex];
    if (!fc) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const img = await FabricImage.fromURL(ev.target?.result as string);
      const maxW = (pages[activePageIndex]?.logicalWidth ?? 400) * zoom * 0.55;
      if ((img.width ?? 0) > maxW) img.scaleToWidth(maxW);
      img.set({ left: 50, top: 50 });
      fc.add(img); fc.setActiveObject(img); fc.renderAll();
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  // ─── Text formatting ───────────────────────────────────────────────────────
  const toggleFormat = (fmt: "bold" | "italic") => {
    const fc = fabricRefs.current[activePageIndex];
    const obj = fc?.getActiveObject();
    if (!(obj instanceof IText)) return;
    if (fmt === "bold") obj.set("fontWeight", obj.fontWeight === "bold" ? "normal" : "bold");
    else obj.set("fontStyle", obj.fontStyle === "italic" ? "normal" : "italic");
    fc?.renderAll();
    setSelectedFabricObj({ ...obj } as any);
  };

  // ─── Page ops ──────────────────────────────────────────────────────────────
  const rotatePage = (idx: number, dir: "cw" | "ccw") =>
    setPages(prev => prev.map((p, i) =>
      i !== idx ? p : { ...p, rotation: (p.rotation + (dir === "cw" ? 90 : -90) + 360) % 360 }
    ));

  const deletePage = (idx: number) => {
    setPages(prev => prev.map((p, i) => i !== idx ? p : { ...p, isDeleted: true }));
    toast({ title: "Page Removed", description: `Page ${idx + 1} excluded from export.` });
  };

  // ─── Export ────────────────────────────────────────────────────────────────
  //
  // Strategy:
  //   1. For each page, composite the page image + Fabric annotations onto a
  //      fresh off-screen <canvas> at exactly PDF-point dimensions.  We never
  //      mutate the live Fabric canvas, so the editor stays intact.
  //   2. Convert that composite to PNG bytes via fetch(dataUrl) → arrayBuffer()
  //      to avoid atob() stack-overflow on large canvases.
  //   3. Embed the PNG as a full-page image overlay on the copied PDF page.
  //   4. Append link annotations using pdf-lib's PDFArray API (not spread).
  //   5. Trigger download by appending the <a> to the DOM before clicking.
  //
  const exportPDF = async () => {
    if (!pdfLibDoc || !uploadedFile) return;
    setIsProcessing(true);

    try {
      const out = await PDFDocument.create();
      const font = await out.embedFont(StandardFonts.Helvetica);

      for (let i = 0; i < pages.length; i++) {
        const pd = pages[i];
        if (pd.isDeleted) continue;

        // ── Copy the original PDF page (preserves vectors, fonts, etc.) ──
        const [copied] = await out.copyPages(pdfLibDoc, [i]);
        const { width: pw, height: ph } = copied.getSize();
        if (pd.rotation) copied.setRotation(degrees(pd.rotation));

        // ── Build an off-screen composite canvas at PDF-point resolution ──
        // We draw: (a) the original page bitmap, then (b) Fabric annotations.
        // This canvas is completely separate from the live editor canvas.
        const offscreen = document.createElement("canvas");
        offscreen.width = Math.round(pw);
        offscreen.height = Math.round(ph);
        const ctx = offscreen.getContext("2d")!;

        // (a) Draw the high-res page image, scaled to PDF-point size
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
            resolve();
          };
          img.onerror = reject;
          img.src = pd.canvasDataUrl;
        });

        // (b) Draw Fabric annotation objects (no background) on top
        const fc = fabricRefs.current[i];
        if (fc) {
          // Compute the scale from current display coords → PDF-point coords
          const dispW = pd.logicalWidth * zoom;
          const dispH = pd.logicalHeight * zoom;

          // Serialise every Fabric object and repaint it on the offscreen ctx
          // at the correct PDF-point scale.  We do this manually so we never
          // touch the live canvas dimensions.
          const objects = fc.getObjects();
          if (objects.length > 0) {
            // Render just the annotation layer via a temporary canvas
            const tmpCanvas = document.createElement("canvas");
            tmpCanvas.width = Math.round(dispW);
            tmpCanvas.height = Math.round(dispH);
            const tmpFc = new Canvas(tmpCanvas, {
              width: Math.round(dispW),
              height: Math.round(dispH),
            });

            // Clone each object into the tmp canvas
            for (const obj of objects) {
              try {
                const cloned = await obj.clone();
                tmpFc.add(cloned);
              } catch {
                // skip uncloneable objects
              }
            }
            tmpFc.renderAll();

            // Draw the annotation layer scaled to PDF-point size
            ctx.drawImage(tmpCanvas, 0, 0, offscreen.width, offscreen.height);
            tmpFc.dispose();
          }
        }

        // ── Convert composite canvas → PNG bytes via fetch (safe for large canvases) ──
        const dataUrl = offscreen.toDataURL("image/png");
        const response = await fetch(dataUrl);
        const arrayBuf = await response.arrayBuffer();
        const pngBytes = new Uint8Array(arrayBuf);

        // ── Embed and draw the composite as a full-page image ──
        const embeddedPng = await out.embedPng(pngBytes);
        copied.drawImage(embeddedPng, { x: 0, y: 0, width: pw, height: ph });

        // ── Embed hyperlink annotations ──
        const pageLinks = linkAnnotations.filter(a => a.pageIndex === i);
        if (pageLinks.length > 0) {
          for (const ann of pageLinks) {
            // PDF coordinate system: origin bottom-left, Y grows upward
            const rectX1 = ann.x * pw;
            const rectY1 = ph - (ann.y + ann.h) * ph;  // bottom edge
            const rectX2 = (ann.x + ann.w) * pw;
            const rectY2 = ph - ann.y * ph;             // top edge

            // Build URI action dict
            const actionRef = out.context.register(
              out.context.obj({
                Type: PDFName.of("Action"),
                S: PDFName.of("URI"),
                URI: out.context.obj(ann.url),
              })
            );

            // Build Link annotation dict referencing the action
            const annotRef = out.context.register(
              out.context.obj({
                Type: PDFName.of("Annot"),
                Subtype: PDFName.of("Link"),
                Rect: out.context.obj([rectX1, rectY1, rectX2, rectY2]),
                Border: out.context.obj([0, 0, 0]),
                A: actionRef,
                F: out.context.obj(4),
              })
            );

            // Get or create the Annots array on the page node
            const annotsKey = PDFName.of("Annots");
            const existing = copied.node.get(annotsKey);
            if (existing instanceof PDFArray) {
              existing.push(annotRef);
            } else {
              const arr = out.context.obj([annotRef]) as PDFArray;
              copied.node.set(annotsKey, arr);
            }
          }
        }

        // ── Watermark ──
        if (watermark?.text) {
          copied.drawText(watermark.text, {
            x: pw / 6,
            y: ph / 3,
            size: Math.max(24, Math.min(60, pw / 10)),
            font,
            color: rgb(0.7, 0.7, 0.7),
            opacity: watermark.opacity,
            rotate: degrees(35),
          });
        }

        out.addPage(copied);
      }

      // ── Serialise & trigger download ──
      const pdfBytes = await out.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `edited_${uploadedFile.file.name}`;
      // Must be in the DOM for Firefox compatibility
      document.body.appendChild(a);
      a.click();
      // Cleanup after the browser has a chance to start the download
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);

      toast({ title: "Download Started", description: "Your edited PDF is downloading." });
    } catch (err: any) {
      console.error("PDF export error:", err);
      toast({
        title: "Export Failed",
        description: err?.message ?? "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── UI constants ──────────────────────────────────────────────────────────
  const TOOLS = [
    { id: "select" as const, Icon: MousePointer2, label: "Select" },
    { id: "text" as const, Icon: Type, label: "Add Text" },
    { id: "erase" as const, Icon: Eraser, label: "Erase" },
    { id: "crop" as const, Icon: Crop, label: "Crop" },
    { id: "link" as const, Icon: LinkIcon, label: "Add Link" },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <ToolLayout
      title="Pro PDF Editor"
      description="Edit, annotate, add hyperlinks and export PDFs professionally."
      category="PDF Tools"
      keywords={["pdf editor", "edit pdf", "hyperlink pdf", "pdf annotation"]}
      howToSteps={[
        { name: "Upload", text: "Drop your PDF file to begin." },
        { name: "Edit", text: "Use Select to move objects, or Text to add annotations." },
        { name: "Link", text: "Activate Add Link, select PDF text, enter URL in the popup." },
        { name: "Export", text: "Click Export PDF — all edits and links are embedded." },
      ]}
    >
      {/* ── Link URL popup (fixed, above everything) ── */}
      {linkPopup.visible && (
        <div
          className="fixed z-[9999] bg-white border border-blue-200 rounded-2xl shadow-2xl p-4 w-80 space-y-3"
          style={{
            left: Math.min(linkPopup.anchorX, Math.max(0, (typeof window !== "undefined" ? window.innerWidth : 1200) - 344)),
            top: linkPopup.anchorY,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <ExternalLink className="h-4 w-4" /> Insert Hyperlink
            </span>
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => { setLinkPopup(p => ({ ...p, visible: false })); window.getSelection()?.removeAllRanges(); }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {linkPopup.selectedText && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-800 truncate">
              <em>"{linkPopup.selectedText.slice(0, 55)}{linkPopup.selectedText.length > 55 ? "…" : ""}"</em>
            </div>
          )}

          <Input
            ref={linkUrlInputRef}
            placeholder="https://example.com"
            value={linkPopup.url}
            onChange={e => setLinkPopup(p => ({ ...p, url: e.target.value }))}
            onKeyDown={e => { if (e.key === "Enter") applyLink(); }}
            className="text-sm border-blue-200 focus-visible:ring-blue-500"
          />

          <div className="flex gap-2">
            <Button className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={applyLink}>
              <Check className="h-4 w-4" /> Apply Link
            </Button>
            <Button variant="outline" className="h-9" onClick={() => { setLinkPopup(p => ({ ...p, visible: false })); window.getSelection()?.removeAllRanges(); }}>
              Cancel
            </Button>
          </div>
          <p className="text-center text-[11px] text-gray-400">Press Enter or click Apply to save</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        {!uploadedFile ? (
          <Card className="border-dashed border-2 py-16">
            <CardContent>
              <FileUploader accept="application/pdf" onFilesSelected={handleFilesSelected} multiple={false} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* ── Sidebar ─────────────────────────────────────────────── */}
            <aside className="lg:col-span-1">
              <div className="sticky top-4 space-y-5">

                <Card className="shadow-md border-primary/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" /> Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">

                    <div className="grid grid-cols-2 gap-2">
                      {TOOLS.map(({ id, Icon, label }) => (
                        <Button
                          key={id}
                          variant={activeTool === id ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setActiveTool(id);
                            if (id === "link") toast({
                              title: "Link Mode Active",
                              description: "Select any text in the PDF, then enter a URL in the popup.",
                            });
                          }}
                          className={cn(
                            "gap-1.5 text-xs",
                            activeTool === id && id === "link" && "bg-blue-600 hover:bg-blue-700"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" /> {label}
                        </Button>
                      ))}
                    </div>

                    {activeTool === "link" && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1.5">
                        <p className="font-semibold">How to add a link:</p>
                        <ol className="list-decimal list-inside space-y-0.5 text-blue-600">
                          <li>Click &amp; drag to select text</li>
                          <li>Release — a popup appears</li>
                          <li>Type your URL and press Enter</li>
                        </ol>
                      </div>
                    )}

                    {/* Text formatting */}
                    {selectedFabricObj && (selectedFabricObj as any).type === "i-text" && (
                      <>
                        <Separator />
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => toggleFormat("bold")}>
                            <Bold className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => toggleFormat("italic")}>
                            <Italic className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}

                    <Separator />

                    {/* Watermark */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Watermark</Label>
                      <Input
                        placeholder="Watermark text…"
                        className="text-sm h-9"
                        onChange={e => setWatermark(e.target.value
                          ? { text: e.target.value, opacity: watermark?.opacity ?? 0.3 }
                          : null
                        )}
                      />
                      {watermark && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Opacity</span><span>{Math.round(watermark.opacity * 100)}%</span>
                          </div>
                          <Slider min={5} max={80} value={[watermark.opacity * 100]}
                            onValueChange={([v]) => setWatermark(w => w ? { ...w, opacity: v / 100 } : null)} />
                        </div>
                      )}
                    </div>

                    <Separator />

                    <Button
                      variant="destructive" size="sm" className="w-full gap-2"
                      onClick={() => {
                        const fc = fabricRefs.current[activePageIndex];
                        const obj = fc?.getActiveObject();
                        if (obj) { fc?.remove(obj); fc?.renderAll(); }
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Delete Selected
                    </Button>

                    <Button
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                      onClick={exportPDF}
                      disabled={isProcessing}
                    >
                      <Save className="h-4 w-4" />
                      {isProcessing ? "Processing…" : "Export PDF"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Thumbnails */}
                <Card className="hidden lg:block">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Pages ({pages.filter(p => !p.isDeleted).length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-72 pr-2">
                      <div className="space-y-2">
                        {pages.map((p, i) => !p.isDeleted && (
                          <button
                            key={i}
                            onClick={() => {
                              setActivePageIndex(i);
                              document.getElementById(`page-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className={cn(
                              "w-full relative border rounded-lg overflow-hidden transition-all",
                              activePageIndex === i
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-gray-200 hover:border-primary/40"
                            )}
                          >
                            <img src={p.canvasDataUrl} alt={`Page ${i + 1}`} className="w-full h-auto block" />
                            <Badge className="absolute top-1 left-1 h-4 text-[9px] px-1.5">{i + 1}</Badge>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* ── Editor ──────────────────────────────────────────────── */}
            <div className="lg:col-span-3 flex flex-col gap-4">

              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur border rounded-xl px-4 py-2.5 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Zoom stepper */}
                  <div className="flex items-center border rounded-lg bg-gray-50 overflow-hidden">
                    <button
                      onClick={() => setZoom(z => Math.max(0.5, parseFloat((z - 0.1).toFixed(2))))}
                      className="px-2.5 py-1.5 hover:bg-gray-100 transition-colors text-gray-600"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-mono w-12 text-center text-gray-700 select-none">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={() => setZoom(z => Math.min(2.5, parseFloat((z + 0.1).toFixed(2))))}
                      className="px-2.5 py-1.5 hover:bg-gray-100 transition-colors text-gray-600"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Zoom presets */}
                  <div className="flex gap-1">
                    {[75, 100, 125, 150].map(pct => (
                      <button
                        key={pct}
                        onClick={() => setZoom(pct / 100)}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-lg border font-medium transition-all",
                          Math.round(zoom * 100) === pct
                            ? "bg-primary text-primary-foreground border-primary"
                            : "text-gray-500 border-gray-200 hover:border-primary/50"
                        )}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  {/* Image insert */}
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => imageInputRef.current?.click()}>
                    <ImagePlus className="h-3.5 w-3.5" /> Insert Image
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {isProcessing && <Badge variant="secondary" className="animate-pulse">Working…</Badge>}
                  {activeTool === "link" && (
                    <Badge className="bg-blue-600 text-white px-3 gap-1">
                      <LinkIcon className="h-3 w-3" /> Link Mode
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{pages.filter(p => !p.isDeleted).length} pages</Badge>
                </div>
              </div>

              {/* Pages */}
              <div
                className="overflow-y-auto overflow-x-auto rounded-xl bg-neutral-300/60"
                style={{ minHeight: "72vh", maxHeight: "calc(100vh - 190px)" }}
              >
                <div className="flex flex-col items-center gap-14 py-12 px-16">
                  {pages.map((page, idx) => {
                    if (page.isDeleted) return null;
                    const dispW = page.logicalWidth * zoom;
                    const dispH = page.logicalHeight * zoom;

                    return (
                      <div key={idx} className="relative" id={`page-${idx}`}>
                        {/* Page label */}
                        <div className="mb-2 text-xs font-medium text-gray-500 select-none pl-1">
                          Page {idx + 1}
                        </div>

                        {/* Page container – exact size, no overflow */}
                        <div
                          ref={el => { pageContainerRefs.current[idx] = el; }}
                          className={cn(
                            "relative overflow-hidden bg-white flex-shrink-0",
                            "shadow-[0_6px_28px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.08)]",
                            activePageIndex === idx
                              ? "ring-2 ring-primary ring-offset-2 ring-offset-neutral-300"
                              : "hover:ring-1 hover:ring-primary/30 hover:ring-offset-1"
                          )}
                          style={{
                            width: dispW,
                            height: dispH,
                            transform: page.rotation ? `rotate(${page.rotation}deg)` : undefined,
                            transformOrigin: "center center",
                          }}
                          onClick={() => setActivePageIndex(idx)}
                        >
                          {/* Fabric annotation canvas */}
                          <canvas
                            ref={el => el && initFabric(idx, el)}
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "block",
                              // Passthrough to text layer when in link mode
                              pointerEvents: activeTool === "link" ? "none" : "auto",
                            }}
                          />

                          {/* PDF.js native text selection layer */}
                          <div
                            ref={el => { if (el && pdfjsDoc) initTextLayer(idx, el); }}
                            style={{
                              position: "absolute",
                              inset: 0,
                              // Only active + interactive in link mode
                              pointerEvents: activeTool === "link" ? "auto" : "none",
                              zIndex: activeTool === "link" ? 20 : 0,
                              cursor: activeTool === "link" ? "text" : "default",
                            }}
                          />

                          {/* Link mode active indicator */}
                          {activeTool === "link" && activePageIndex === idx && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{ zIndex: 30 }}
                            >
                              <div className="absolute inset-0 ring-2 ring-inset ring-blue-400/40 rounded-[1px]" />
                              <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 opacity-90 select-none shadow">
                                <LinkIcon className="h-2.5 w-2.5" /> select text
                              </span>
                            </div>
                          )}

                          {/* Existing link highlights */}
                          {linkAnnotations
                            .filter(a => a.pageIndex === idx)
                            .map((ann, ai) => (
                              <div
                                key={ai}
                                title={ann.url}
                                className="absolute pointer-events-none"
                                style={{
                                  left: ann.x * dispW,
                                  top: ann.y * dispH,
                                  width: ann.w * dispW,
                                  height: ann.h * dispH,
                                  background: "rgba(37,99,235,0.08)",
                                  borderBottom: "2px solid rgba(37,99,235,0.6)",
                                  zIndex: 25,
                                }}
                              />
                            ))}
                        </div>

                        {/* Page control buttons (left side) */}
                        <div className="absolute left-0 top-0 -translate-x-11 flex flex-col gap-1.5">
                          {[
                            { icon: RotateCcw, action: () => rotatePage(idx, "ccw"), title: "Rotate left", cls: "hover:bg-gray-100" },
                            { icon: RotateCw, action: () => rotatePage(idx, "cw"), title: "Rotate right", cls: "hover:bg-gray-100" },
                            { icon: Trash2, action: () => deletePage(idx), title: "Delete page", cls: "text-red-500 hover:bg-red-50" },
                          ].map(({ icon: Icon, action, title, cls }) => (
                            <button
                              key={title}
                              onClick={e => { e.stopPropagation(); action(); }}
                              title={title}
                              className={cn("h-8 w-8 rounded-full bg-white border shadow flex items-center justify-center transition-colors", cls)}
                            >
                              <Icon className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}