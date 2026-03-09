import * as pdfjs from "pdfjs-dist";
import pptxgen from "pptxgenjs";

// Vite approach to worker initialization
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

/**
 * Client-side PDF to PPTX conversion.
 * Logic: Renders high-res page graphics as a background and overlays searchable/editable text.
 */
export async function convertPdfToPptx(file: File): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;

    const pptx = new pptxgen();

    // Set the presentation layout based on the first page
    const firstPage = await pdf.getPage(1);
    const firstViewport = firstPage.getViewport({ scale: 1.0 });
    const slideWidthIn = firstViewport.width / 72;
    const slideHeightIn = firstViewport.height / 72;

    pptx.defineLayout({
        name: "PDF_ADAPTIVE",
        width: slideWidthIn,
        height: slideHeightIn,
    });
    pptx.layout = "PDF_ADAPTIVE";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewportBase = page.getViewport({ scale: 1.0 });

        // High-res (4x) render for crystalline graphics
        const renderScale = 4.0;
        const viewportRender = page.getViewport({ scale: renderScale });

        const slide = pptx.addSlide();

        // 1. Render Background Graphics/Images
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context) {
            canvas.width = viewportRender.width;
            canvas.height = viewportRender.height;

            // Note: We render with high quality settings
            await page.render({
                canvasContext: context,
                viewport: viewportRender,
                intent: "display",
            }).promise;

            const imageUrl = canvas.toDataURL("image/png");

            slide.addImage({
                data: imageUrl,
                x: 0,
                y: 0,
                w: slideWidthIn,
                h: slideHeightIn,
            });
        }

        // 2. Extract and Overlay Structured Text
        const textContent = await page.getTextContent();
        const textItems = textContent.items as any[];

        // Group text items by line (using Y-coordinate) to improve structure
        const lines: Record<number, any[]> = {};
        textItems.forEach((item) => {
            if (!item.str || !item.str.trim()) return;

            const translateY = Math.round(item.transform[5]);
            if (!lines[translateY]) lines[translateY] = [];
            lines[translateY].push(item);
        });

        Object.keys(lines).sort((a, b) => Number(b) - Number(a)).forEach((yCoord) => {
            const lineItems = lines[Number(yCoord)].sort((a, b) => a.transform[4] - b.transform[4]);

            // Combine adjacent fragments on the same line if they are close
            let currentText = "";
            let startX = lineItems[0].transform[4];
            let fontSize = Math.abs(lineItems[0].transform[0]);

            lineItems.forEach((item, idx) => {
                currentText += item.str;

                // If it's the last item or there's a big gap, add the text block
                const nextItem = lineItems[idx + 1];
                const isLast = !nextItem;
                const hasGap = nextItem && (nextItem.transform[4] - (item.transform[4] + (item.width || 0)) > 5);

                if (isLast || hasGap) {
                    const pdfX = startX;
                    const pdfY = viewportBase.height - Number(yCoord);

                    // Positioning in absolute inches for maximum precision
                    const xIn = (pdfX / 72);
                    const yIn = ((pdfY - fontSize) / 72);

                    slide.addText(currentText, {
                        x: xIn,
                        y: yIn,
                        w: "auto",
                        h: "auto",
                        fontSize: fontSize,
                        color: "000000",
                        valign: "top",
                        align: "left",
                        margin: 0,
                        transparent: true, // Key for clarity; text doesn't have a white box
                    } as any);

                    if (nextItem) {
                        currentText = "";
                        startX = nextItem.transform[4];
                        fontSize = Math.abs(nextItem.transform[0]);
                    }
                }
            });
        });

        // Cleanup
        canvas.width = 0;
        canvas.height = 0;
    }

    const out = await pptx.write({ outputType: "blob" });
    return out as Blob;
}
