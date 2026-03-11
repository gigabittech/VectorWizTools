import { jsPDF } from "jspdf";
import JSZip from "jszip";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 55;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM_LIMIT = PAGE_H - MARGIN;

// ─── Block types ──────────────────────────────────────────────────────────────
type BlockType = "h1" | "h2" | "h3" | "p" | "li" | "img" | "spacer";

interface Block {
    type: BlockType;
    text?: string;
    bold?: boolean;
    italic?: boolean;
    indent?: number;
    imgData?: string; // base64 dataURL
    imgW?: number;
    imgH?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolvePath(raw: string): string {
    const parts = raw.replace(/\\/g, "/").split("/");
    const out: string[] = [];
    for (const p of parts) {
        if (p === "..") out.pop();
        else if (p && p !== ".") out.push(p);
    }
    return out.join("/");
}

function joinPath(base: string, rel: string): string {
    if (!base) return resolvePath(rel);
    return resolvePath(`${base}/${rel}`);
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(blob);
    });
}

function getImgDims(dataUrl: string): Promise<{ w: number; h: number }> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 300, h: 200 });
        img.src = dataUrl;
    });
}

// ─── Parse EPUB ───────────────────────────────────────────────────────────────
export async function convertEpubToPdf(
    file: File,
    onProgress?: (pct: number) => void
): Promise<Blob> {
    onProgress?.(2);

    const buf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);

    // 1. container.xml
    const containerXml = await zip.file("META-INF/container.xml")?.async("string");
    if (!containerXml) throw new Error("Not a valid EPUB: missing container.xml");

    const opfPathMatch = /full-path="([^"]+\.opf)"/i.exec(containerXml);
    // fallback: scan for any .opf file
    let opfPath = opfPathMatch?.[1] ?? "";
    if (!opfPath) {
        zip.forEach((rel) => { if (rel.endsWith(".opf")) opfPath = rel; });
    }
    if (!opfPath) throw new Error("Cannot locate OPF file in EPUB");

    const opfXml = await zip.file(opfPath)?.async("string");
    if (!opfXml) throw new Error(`Cannot read OPF: ${opfPath}`);

    const opfFolder = opfPath.includes("/")
        ? opfPath.slice(0, opfPath.lastIndexOf("/"))
        : "";

    // 2. Parse manifest & spine
    const domParser = new DOMParser();
    const opfDoc = domParser.parseFromString(opfXml, "application/xml");

    // Build manifest map: id → {href, mediaType}
    const manifest: Record<string, { href: string; mediaType: string }> = {};
    for (const item of Array.from(opfDoc.querySelectorAll("manifest item"))) {
        const id = item.getAttribute("id") ?? "";
        const href = item.getAttribute("href") ?? "";
        const mt = item.getAttribute("media-type") ?? "";
        if (id && href) manifest[id] = { href, mediaType: mt };
    }

    // Build spine: ordered list of content file hrefs
    const spineHrefs: string[] = [];
    for (const ref of Array.from(opfDoc.querySelectorAll("spine itemref"))) {
        const idref = ref.getAttribute("idref") ?? "";
        if (idref && manifest[idref]) spineHrefs.push(manifest[idref].href);
    }

    if (spineHrefs.length === 0) throw new Error("EPUB spine is empty — no pages found");

    // 3. Pre-load all images → dataURL map
    const imageMap: Record<string, string> = {};
    const imgMimes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/jpg"]);

    for (const [, item] of Object.entries(manifest)) {
        if (!imgMimes.has(item.mediaType)) continue;
        const fullPath = joinPath(opfFolder, item.href);
        const entry = zip.file(fullPath) ?? zip.file(item.href);
        if (!entry) continue;
        try {
            const blob = await entry.async("blob");
            const dataUrl = await blobToDataUrl(blob);
            imageMap[fullPath] = dataUrl;
            imageMap[item.href] = dataUrl;
            // also store just the filename as key for fallback
            const fname = item.href.split("/").pop() ?? "";
            if (fname) imageMap[fname] = dataUrl;
        } catch (_) { /* skip */ }
    }

    onProgress?.(15);

    // 4. Parse each spine file into blocks
    const allBlocks: Block[] = [];
    for (let si = 0; si < spineHrefs.length; si++) {
        const href = spineHrefs[si];
        const fullPath = joinPath(opfFolder, href);
        const hrefFolder = href.includes("/") ? href.slice(0, href.lastIndexOf("/")) : "";

        // Try multiple paths
        const entry =
            zip.file(fullPath) ??
            zip.file(href) ??
            zip.file(resolvePath(href));

        if (!entry) continue;

        const rawHtml = await entry.async("string");
        if (!rawHtml?.trim()) continue;

        // Parse as XHTML first, fallback to text/html
        let doc: Document;
        try {
            doc = domParser.parseFromString(rawHtml, "application/xhtml+xml");
            // Check for parse error
            if (doc.querySelector("parsererror")) {
                doc = domParser.parseFromString(rawHtml, "text/html");
            }
        } catch {
            doc = domParser.parseFromString(rawHtml, "text/html");
        }

        // Remove non-content tags
        doc.querySelectorAll("script,style,head,link,meta,noscript").forEach(e => e.remove());

        const body = doc.body ?? doc.querySelector("body") ?? doc.documentElement;

        // Resolve image srcs within this document to dataURLs
        for (const img of Array.from(body.querySelectorAll("img,image"))) {
            const srcAttr = img.getAttribute("src") ?? img.getAttribute("xlink:href") ?? "";
            if (!srcAttr || srcAttr.startsWith("data:")) continue;
            const resolved = joinPath(joinPath(opfFolder, hrefFolder), srcAttr);
            const dataUrl =
                imageMap[resolved] ??
                imageMap[joinPath(opfFolder, srcAttr)] ??
                imageMap[srcAttr] ??
                imageMap[srcAttr.split("/").pop() ?? ""] ??
                null;
            if (dataUrl) img.setAttribute("src", dataUrl);
        }

        const blocks = await nodeToBlocks(body, imageMap);
        allBlocks.push(...blocks);

        // Page break between chapters
        if (si < spineHrefs.length - 1) {
            allBlocks.push({ type: "spacer" });
        }

        onProgress?.(15 + ((si + 1) / spineHrefs.length) * 60);
    }

    if (allBlocks.length === 0) {
        throw new Error("No readable content found in this EPUB. The file may be DRM-protected or image-only.");
    }

    // 5. Render to PDF
    const blob = await renderPdf(allBlocks, onProgress);
    onProgress?.(100);
    return blob;
}

// ─── DOM → Blocks ─────────────────────────────────────────────────────────────
async function nodeToBlocks(root: Element, imageMap: Record<string, string>): Promise<Block[]> {
    const blocks: Block[] = [];

    async function walk(node: Node, ctx: { bold: boolean; italic: boolean; listDepth: number }) {
        if (node.nodeType === Node.TEXT_NODE) return; // handled by block-level parents

        const el = node as Element;
        const tag = (el.tagName ?? "").toLowerCase().replace(/^[a-z]+:/, ""); // strip namespace

        if (!tag) {
            for (const c of Array.from(el.childNodes)) await walk(c, ctx);
            return;
        }

        // Skip invisible / non-content
        if (["script", "style", "head", "link", "meta", "noscript"].includes(tag)) return;

        // ── Headings ──
        if (tag === "h1") {
            const t = getTextContent(el);
            if (t) blocks.push({ type: "h1", text: t, bold: true });
            return;
        }
        if (tag === "h2") {
            const t = getTextContent(el);
            if (t) blocks.push({ type: "h2", text: t, bold: true });
            return;
        }
        if (["h3", "h4", "h5", "h6"].includes(tag)) {
            const t = getTextContent(el);
            if (t) blocks.push({ type: "h3", text: t, bold: true });
            return;
        }

        // ── Image ──
        if (tag === "img" || tag === "image") {
            const src = el.getAttribute("src") ?? el.getAttribute("xlink:href") ?? "";
            if (src && src.startsWith("data:")) {
                try {
                    const dims = await getImgDims(src);
                    blocks.push({ type: "img", imgData: src, imgW: dims.w, imgH: dims.h });
                } catch (_) { /* skip */ }
            }
            return;
        }

        // ── List items ──
        if (tag === "li") {
            const t = getTextContent(el);
            if (t) blocks.push({ type: "li", text: t, indent: ctx.listDepth * 12 });
            return;
        }

        // ── Paragraph / block-level text containers ──
        if (["p", "div", "section", "article", "blockquote", "figure", "figcaption",
            "td", "th", "caption", "dt", "dd", "pre", "address"].includes(tag)) {

            // Check if this element has meaningful direct text
            const directText = getDirectText(el);

            // Check for img children first
            for (const child of Array.from(el.childNodes)) {
                const childEl = child as Element;
                const childTag = (childEl.tagName ?? "").toLowerCase();
                if (childTag === "img" || childTag === "image") {
                    await walk(childEl, ctx);
                }
            }

            // If this is a leaf-ish block with text
            if (directText.trim()) {
                const isBold = ctx.bold || tag === "th";
                const isItalic = ctx.italic;
                blocks.push({ type: "p", text: directText, bold: isBold, italic: isItalic });
                return;
            }

            // Otherwise recurse into children for nested blocks
            const newCtx = { ...ctx };
            if (["ul", "ol"].includes(tag)) newCtx.listDepth++;
            for (const child of Array.from(el.childNodes)) {
                await walk(child, newCtx);
            }
            return;
        }

        // ── Inline bold/italic wrappers — recurse ──
        if (["strong", "b"].includes(tag)) {
            for (const child of Array.from(el.childNodes)) {
                await walk(child, { ...ctx, bold: true });
            }
            return;
        }
        if (["em", "i"].includes(tag)) {
            for (const child of Array.from(el.childNodes)) {
                await walk(child, { ...ctx, italic: true });
            }
            return;
        }

        // ── List containers ──
        if (["ul", "ol"].includes(tag)) {
            for (const child of Array.from(el.childNodes)) {
                await walk(child, { ...ctx, listDepth: ctx.listDepth + 1 });
            }
            return;
        }

        // ── Default: recurse ──
        for (const child of Array.from(el.childNodes)) {
            await walk(child, ctx);
        }
    }

    await walk(root, { bold: false, italic: false, listDepth: 0 });
    return blocks;
}

/**
 * Get all text content of an element, collapsing whitespace.
 * Includes text from children.
 */
function getTextContent(el: Element): string {
    return (el.textContent ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

/**
 * Get text that is "directly" in this element — considering all descendant text
 * but ignoring purely structural children that will be handled recursively.
 * Used to decide if a block-level element should emit a text block.
 */
function getDirectText(el: Element): string {
    // Collect all text nodes and inline element text, stop at block children
    const BLOCK_TAGS = new Set(["p", "div", "section", "article", "blockquote", "ul", "ol", "li",
        "h1", "h2", "h3", "h4", "h5", "h6", "table", "tr", "td", "th", "figure", "pre", "address"]);

    let text = "";
    function collect(node: Node) {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent ?? "";
            return;
        }
        const child = node as Element;
        const tag = (child.tagName ?? "").toLowerCase();
        if (BLOCK_TAGS.has(tag)) return; // let parent handle block recursion
        if (["script", "style"].includes(tag)) return;
        for (const c of Array.from(child.childNodes)) collect(c);
    }
    for (const c of Array.from(el.childNodes)) collect(c);
    return text.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

// ─── Render PDF ───────────────────────────────────────────────────────────────
async function renderPdf(blocks: Block[], onProgress?: (pct: number) => void): Promise<Blob> {
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "p" });
    let y = MARGIN;

    function newPage() {
        pdf.addPage();
        y = MARGIN;
    }

    function ensureSpace(need: number) {
        if (y + need > BOTTOM_LIMIT) newPage();
    }

    function drawText(
        text: string,
        fontSize: number,
        lineH: number,
        bold: boolean,
        italic: boolean,
        indent = 0,
        color: [number, number, number] = [40, 40, 40]
    ) {
        const style = bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal";
        pdf.setFont("helvetica", style);
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);

        const maxW = CONTENT_W - indent;
        const lines = pdf.splitTextToSize(text, maxW) as string[];
        for (const line of lines) {
            ensureSpace(lineH);
            pdf.text(line, MARGIN + indent, y);
            y += lineH;
        }
    }

    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        onProgress?.(75 + (i / blocks.length) * 22);

        switch (b.type) {
            case "h1":
                y += 8;
                drawText(b.text!, 18, 26, true, false, 0, [15, 15, 15]);
                y += 4;
                break;

            case "h2":
                y += 6;
                drawText(b.text!, 14, 21, true, false, 0, [25, 25, 25]);
                y += 3;
                break;

            case "h3":
                y += 4;
                drawText(b.text!, 12, 18, true, false, 0, [35, 35, 35]);
                y += 2;
                break;

            case "p":
                drawText(b.text!, 11, 17, b.bold ?? false, b.italic ?? false, 0, [50, 50, 50]);
                y += 3;
                break;

            case "li":
                drawText("• " + b.text!, 11, 17, false, false, (b.indent ?? 0) + 6, [50, 50, 50]);
                break;

            case "spacer":
                // chapter break — start new page
                if (i > 0 && i < blocks.length - 1) newPage();
                break;

            case "img": {
                if (!b.imgData) break;
                const maxW = CONTENT_W;
                const maxH = PAGE_H - MARGIN * 2 - 20;
                let w = b.imgW ?? 300;
                let h = b.imgH ?? 200;
                if (w > maxW) { h = (h * maxW) / w; w = maxW; }
                if (h > maxH) { w = (w * maxH) / h; h = maxH; }

                ensureSpace(h + 10);
                try {
                    // Detect format from dataURL
                    const fmt = b.imgData.startsWith("data:image/png") ? "PNG" : "JPEG";
                    pdf.addImage(b.imgData, fmt, MARGIN, y, w, h);
                    y += h + 8;
                } catch (_) { /* skip broken image */ }
                break;
            }
        }
    }

    return pdf.output("blob");
}