import * as pdfjs from "pdfjs-dist";
import pptxgen from "pptxgenjs";

// Vite approach to worker initialization
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

/**
 * Client-side PDF to PPTX conversion.
 *
 * Strategy: Each PDF page is rendered as a high-resolution JPEG image
 * and placed as a full-slide background. No text layer is overlaid,
 * which eliminates all text overlap / jumbling issues entirely.
 *
 * The resulting slides are pixel-perfect visual copies of the PDF pages.
 */
export async function convertPdfToPptx(file: File): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;

    const pptx = new pptxgen();

    // ── Pass 1: collect all pages and find max dimensions ──
    let maxW = 0;
    let maxH = 0;
    const pages: pdfjs.PDFPageProxy[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 1.0 });
        maxW = Math.max(maxW, vp.width);
        maxH = Math.max(maxH, vp.height);
        pages.push(page);
    }

    // Convert points to inches  (1 pt = 1/72 inch)
    const slideW = maxW / 72;
    const slideH = maxH / 72;

    pptx.defineLayout({ name: "PDF_LAYOUT", width: slideW, height: slideH });
    pptx.layout = "PDF_LAYOUT";

    // ── Pass 2: render each page and add as a slide ──
    for (const page of pages) {
        const vpBase = page.getViewport({ scale: 1.0 });

        // Center smaller pages on the slide
        const offsetX = (maxW - vpBase.width) / 2 / 72;
        const offsetY = (maxH - vpBase.height) / 2 / 72;
        const pageW = vpBase.width / 72;
        const pageH = vpBase.height / 72;

        // Render at 3x for sharp output
        const SCALE = 3;
        const vpRender = page.getViewport({ scale: SCALE });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = vpRender.width;
        canvas.height = vpRender.height;

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
            canvasContext: ctx,
            viewport: vpRender,
            intent: "print",
        }).promise;

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

        const slide = pptx.addSlide();
        slide.background = { color: "FFFFFF" };

        slide.addImage({
            data: dataUrl,
            x: offsetX,
            y: offsetY,
            w: pageW,
            h: pageH,
        });

        // Free canvas memory immediately
        canvas.width = 0;
        canvas.height = 0;
    }

    const blob = await pptx.write({ outputType: "blob" });
    return blob as Blob;
}