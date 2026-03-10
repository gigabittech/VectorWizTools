import { useState, useRef } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, Loader2, FileDown, Monitor, Smartphone,
  AlertCircle, CheckCircle2, RefreshCw, Zap, ArrowRight,
} from "lucide-react";

/* ─── dynamic script loader ─────────────────────────────────────────────────── */
function loadScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = () => res(); s.onerror = rej;
    document.head.appendChild(s);
  });
}

/* ─── types ──────────────────────────────────────────────────────────────────── */
type ViewMode = "desktop" | "mobile";
type Phase = "idle" | "converting" | "done" | "error";

/* ─── helpers ────────────────────────────────────────────────────────────────── */
const normalize = (raw: string) =>
  /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;

const getFilename = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, "") + ".pdf"; }
  catch { return "webpage.pdf"; }
};

const toAbsolute = (href: string, base: string) => {
  try { return new URL(href, base).href; } catch { return href; }
};

/* ─── CORS proxies ───────────────────────────────────────────────────────────── */
const PROXIES = [
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

async function proxyFetch(url: string, binary = false): Promise<string | ArrayBuffer> {
  for (const mk of PROXIES) {
    try {
      const r = await fetch(mk(url), { signal: AbortSignal.timeout(14_000) });
      if (!r.ok) continue;
      return binary ? r.arrayBuffer() : r.text();
    } catch { /* try next */ }
  }
  throw new Error(`Cannot fetch: ${url}`);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   METHOD 1 — microlink.io  (real headless Chromium → pixel-perfect PDF)
   Free tier: ~50 req / day, no API key.
═══════════════════════════════════════════════════════════════════════════════ */
async function viaHeadlessChrome(
  url: string,
  viewMode: ViewMode,
  onStep: (label: string, pct: number) => void,
): Promise<Blob> {
  onStep("Sending to headless browser…", 20);

  const vp = viewMode === "mobile"
    ? { width: 390, height: 844, deviceScaleFactor: 2 }
    : { width: 1280, height: 900, deviceScaleFactor: 1 };

  const api = new URL("https://api.microlink.io");
  api.searchParams.set("url", url);
  api.searchParams.set("pdf", "true");
  api.searchParams.set("meta", "false");
  api.searchParams.set("pdf.format", "A4");
  api.searchParams.set("pdf.printBackground", "true");
  api.searchParams.set("pdf.scale", "1");
  api.searchParams.set("viewport.width", String(vp.width));
  api.searchParams.set("viewport.height", String(vp.height));
  api.searchParams.set("viewport.deviceScaleFactor", String(vp.deviceScaleFactor));

  const res = await fetch(api.toString(), { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`microlink: ${res.status}`);

  const json = await res.json();
  if (json.status !== "success" || !json.data?.pdf?.url)
    throw new Error(json.message ?? "No PDF from microlink");

  onStep("Downloading PDF…", 80);
  const pdf = await fetch(json.data.pdf.url, { signal: AbortSignal.timeout(30_000) });
  if (!pdf.ok) throw new Error("PDF download failed");

  onStep("Finalising…", 95);
  return pdf.blob();
}

/* ═══════════════════════════════════════════════════════════════════════════════
   METHOD 2 — dom-to-image-more + jsPDF  (in-browser fallback)
   dom-to-image-more uses SVG foreignObject → much better CSS fidelity than
   html2canvas (supports Grid, Flexbox, CSS variables, transforms, web fonts).
═══════════════════════════════════════════════════════════════════════════════ */

/* Fetch + inline a single external stylesheet (recursive for @import) */
async function inlineCSS(cssUrl: string, depth = 0): Promise<string> {
  if (depth > 3) return "";
  try {
    let css = (await proxyFetch(cssUrl)) as string;
    /* resolve @import */
    const imports: { full: string; url: string }[] = [];
    css.replace(/@import\s+(?:url\()?['"]?([^'");\s]+)['"]?\)?[^;]*;/g, (f, u) => {
      imports.push({ full: f, url: toAbsolute(u, cssUrl) }); return f;
    });
    for (const { full, url } of imports)
      css = css.replace(full, await inlineCSS(url, depth + 1));
    /* rewrite url() */
    css = css.replace(/url\((['"]?)([^'")]+)\1\)/g, (_, q, v) =>
      /^(https?:|data:|#)/.test(v) ? `url(${q}${v}${q})` : `url(${q}${toAbsolute(v, cssUrl)}${q})`
    );
    return css;
  } catch { return ""; }
}

/* Convert any image URL to data-URI */
async function toDataURI(src: string): Promise<string> {
  try {
    const buf = (await proxyFetch(src, true)) as ArrayBuffer;
    const arr = new Uint8Array(buf);
    let bin = "";
    arr.forEach(b => (bin += String.fromCharCode(b)));
    const ext = src.split("?")[0].split(".").pop()?.toLowerCase() ?? "png";
    const mime = ({
      svg: "image/svg+xml", webp: "image/webp", gif: "image/gif",
      jpg: "image/jpeg", jpeg: "image/jpeg"
    } as Record<string, string>)[ext] ?? "image/png";
    return `data:${mime};base64,${btoa(bin)}`;
  } catch { return src; }
}

/* Detect and return all Google Fonts @import URLs from CSS text */
function extractGoogleFonts(html: string): string[] {
  const hits: string[] = [];
  const re = /https:\/\/fonts\.googleapis\.com\/css[^"')>]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) hits.push(m[0]);
  return [...new Set(hits)];
}

/* Build a fully self-contained HTML document for iframe rendering */
async function buildDoc(
  rawHtml: string,
  base: string,
  onStep: (label: string, pct: number) => void,
): Promise<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  /* ensure <base href> */
  if (!doc.querySelector("base")) {
    const b = doc.createElement("base"); b.href = base;
    doc.head.prepend(b);
  }

  /* 1 — inline stylesheets */
  onStep("Fetching stylesheets…", 28);
  const links = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  await Promise.all(links.map(async el => {
    const href = toAbsolute(el.getAttribute("href") ?? "", base);
    if (!href) return;
    const css = await inlineCSS(href);
    const st = doc.createElement("style"); st.textContent = css;
    el.replaceWith(st);
  }));

  /* 2 — keep Google Fonts links intact (external CDN, browser can load them) */
  const gFonts = extractGoogleFonts(rawHtml);
  gFonts.forEach(href => {
    const el = doc.createElement("link");
    el.rel = "stylesheet"; el.href = href;
    doc.head.appendChild(el);
  });

  /* 3 — inline images as data-URIs */
  onStep("Fetching images…", 42);
  const imgs = Array.from(doc.querySelectorAll<HTMLImageElement>("img[src]")).slice(0, 80);
  await Promise.all(imgs.map(async img => {
    const src = toAbsolute(img.getAttribute("src") ?? "", base);
    if (!src || src.startsWith("data:")) return;
    img.src = await toDataURI(src);
    img.removeAttribute("srcset"); img.removeAttribute("loading");
    img.decoding = "sync";
  }));

  /* 4 — fix remaining relative URLs */
  doc.querySelectorAll("[href]").forEach(el => {
    const v = el.getAttribute("href");
    if (v && !/^(https?:|#|javascript:|mailto:|tel:|data:)/.test(v))
      el.setAttribute("href", toAbsolute(v, base));
  });
  doc.querySelectorAll("[src]").forEach(el => {
    const v = el.getAttribute("src");
    if (v && !/^(https?:|data:)/.test(v))
      el.setAttribute("src", toAbsolute(v, base));
  });

  /* 5 — remove scripts / noisy overlays */
  doc.querySelectorAll("script, noscript").forEach(el => el.remove());

  /* 6 — inject render-friendly overrides */
  const overrides = doc.createElement("style");
  overrides.textContent = `
    *, *::before, *::after { animation: none !important; transition: none !important; }
    [class*="cookie"],[class*="consent"],[class*="gdpr"],[class*="popup"],
    [class*="modal"],[class*="overlay"],[class*="chat"],[class*="banner"],
    [class*="notification"],[id*="cookie"],[id*="consent"],[id*="popup"] {
      display: none !important;
    }
    html, body { overflow: visible !important; scroll-behavior: auto !important; }
    img { max-width: 100% !important; height: auto !important; }
    * { -webkit-font-smoothing: antialiased; }
  `;
  doc.head.appendChild(overrides);
  return doc.documentElement.outerHTML;
}

async function viaInBrowser(
  url: string,
  viewMode: ViewMode,
  onStep: (label: string, pct: number) => void,
): Promise<Blob> {
  /* load libs */
  onStep("Loading renderer…", 5);
  await loadScript("https://cdn.jsdelivr.net/npm/dom-to-image-more@3.4.2/dist/dom-to-image-more.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

  /* fetch page */
  onStep("Fetching page…", 14);
  const raw = (await proxyFetch(url)) as string;
  const html = await buildDoc(raw, url, onStep);

  /* create off-screen iframe (srcdoc = same-origin, dom-to-image can access it) */
  onStep("Rendering page…", 55);
  const vpW = viewMode === "mobile" ? 430 : 1280;
  const frame = document.createElement("iframe");
  frame.style.cssText =
    `position:fixed;left:-99999px;top:0;width:${vpW}px;height:900px;border:none;visibility:hidden;`;
  document.body.appendChild(frame);

  try {
    frame.srcdoc = html;
    await new Promise<void>(r => { frame.onload = () => r(); setTimeout(r, 10_000); });
    /* extra wait for web-fonts / deferred layout */
    await new Promise(r => setTimeout(r, 2_500));

    const iDoc = frame.contentDocument!;
    const body = iDoc.body;
    const fullH = Math.max(body.scrollHeight, iDoc.documentElement.scrollHeight);
    frame.style.height = `${fullH}px`;
    await new Promise(r => setTimeout(r, 600));

    onStep("Capturing screenshot…", 65);

    /* dom-to-image-more: SVG-based, far better CSS fidelity */
    // @ts-ignore
    const dataUrl: string = await window.domtoimage.toPng(body, {
      width: vpW,
      height: fullH,
      style: {
        transform: "scale(1)",
        transformOrigin: "top left",
        width: `${vpW}px`,
        height: `${fullH}px`,
      },
      quality: 1,
      bgcolor: "#ffffff",
      imagePlaceholder:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    });

    onStep("Building PDF pages…", 82);

    /* load image to get natural dimensions */
    const img = new Image();
    img.src = dataUrl;
    await new Promise(r => { img.onload = r; });

    /* A4 in mm */
    const A4W = 210, A4H = 297;
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pxPerMm = img.width / A4W;
    const pageHeightPx = A4H * pxPerMm;
    const totalPages = Math.ceil(img.height / pageHeightPx);

    /* slice each page from the full-height canvas */
    for (let p = 0; p < totalPages; p++) {
      if (p > 0) pdf.addPage();
      const srcY = p * pageHeightPx;
      const srcH = Math.min(pageHeightPx, img.height - srcY);

      const slice = document.createElement("canvas");
      slice.width = img.width;
      slice.height = srcH;
      const ctx = slice.getContext("2d")!;
      ctx.drawImage(img, 0, srcY, img.width, srcH, 0, 0, img.width, srcH);

      pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, A4W, srcH / pxPerMm);
    }

    onStep("Saving…", 96);
    return pdf.output("blob");
  } finally {
    document.body.removeChild(frame);
  }
}

/* ─── orchestrator ───────────────────────────────────────────────────────────── */
async function convert(
  url: string,
  viewMode: ViewMode,
  onStep: (label: string, pct: number) => void,
): Promise<{ blob: Blob; method: "headless-chrome" | "in-browser" }> {
  try {
    const blob = await viaHeadlessChrome(url, viewMode, onStep);
    return { blob, method: "headless-chrome" };
  } catch (e) {
    console.warn("[url2pdf] headless failed, falling back:", e);
    onStep("Switching to in-browser render…", 4);
  }
  const blob = await viaInBrowser(url, viewMode, onStep);
  return { blob, method: "in-browser" };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   UI
═══════════════════════════════════════════════════════════════════════════════ */
export default function URLToPDF() {
  const [url, setUrl] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepLabel, setStepLabel] = useState("");
  const [pct, setPct] = useState(0);
  const [method, setMethod] = useState<"headless-chrome" | "in-browser" | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const { toast } = useToast();

  const busy = phase === "converting";

  const onStep = (label: string, p: number) => {
    setStepLabel(label); setPct(p);
  };

  const handleConvert = async () => {
    const norm = normalize(url);
    if (!url.trim()) {
      toast({ title: "URL দাও", description: "কোনো URL ছাড়া convert হবে না।", variant: "destructive" }); return;
    }
    try { new URL(norm); }
    catch { toast({ title: "Invalid URL", description: "https://example.com এর মতো URL দাও।", variant: "destructive" }); return; }

    setPhase("converting"); onStep("Starting…", 5);
    try {
      const { blob, method: m } = await convert(norm, viewMode, onStep);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = getFilename(norm);
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
      setMethod(m);
      setPhase("done");
      toast({ title: "PDF Downloaded!", description: "Downloads folder চেক করো।" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setErrMsg(msg); setPhase("error");
      toast({ title: "Failed", description: msg, variant: "destructive" });
    }
  };

  const reset = () => { setPhase("idle"); setUrl(""); setPct(0); };

  /* ── render ── */
  return (
    <ToolLayout
      title="URL to PDF"
      description="Convert any webpage to a pixel-perfect PDF. Uses real headless Chromium when available."
      category="PDF Tools"
      keywords={["url to pdf", "webpage to pdf", "html to pdf", "web to pdf", "website pdf"]}
      howToSteps={[
        { name: "Paste URL", text: "Any public webpage URL." },
        { name: "Pick layout", text: "Desktop (1280 px) or Mobile (390 px)." },
        { name: "Convert", text: "PDF downloads automatically — no print dialog." },
      ]}
    >
      {/* inject CSS for shimmer + gradient animations */}
      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes pulse-ring{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.12);opacity:1}}
        @keyframes slide-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .shimmer-line{background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);
          background-size:200% 100%;animation:shimmer 1.6s infinite linear;border-radius:4px;}
        .card-glow{box-shadow:0 0 0 1px rgba(11,159,71,.15),0 4px 24px rgba(11,159,71,.08);}
        .slide-up{animation:slide-up .35s ease both;}
      `}</style>

      <div className="space-y-4">

        {/* ── Hero input card ── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/80 backdrop-blur-md card-glow">

          {/* decorative gradient blob */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#0B9F47]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-emerald-200/30 blur-2xl" />

          <div className="relative p-6 space-y-6">

            {/* header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B9F47] to-emerald-400 shadow-md">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">URL → PDF</h2>
                <p className="text-xs text-gray-500">Pixel-perfect conversion via headless Chrome</p>
              </div>
            </div>

            {/* URL input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Website URL</label>
              <div className={`
                flex items-center gap-2 rounded-xl border-2 bg-gray-50/80 px-4 py-3
                transition-all duration-200
                ${busy ? "opacity-60 pointer-events-none" : "focus-within:border-[#0B9F47] focus-within:bg-white border-gray-200"}
              `}>
                <Globe className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !busy && handleConvert()}
                  placeholder="https://example.com"
                  disabled={busy}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none min-w-0"
                />
              </div>
            </div>

            {/* Layout toggle */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Page Layout</label>
              <div className="grid grid-cols-2 gap-2">
                {(["desktop", "mobile"] as ViewMode[]).map(mode => {
                  const active = viewMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      disabled={busy}
                      className={`
                        relative flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-4
                        text-sm font-medium transition-all duration-200
                        ${active
                          ? "border-[#0B9F47] bg-gradient-to-b from-[#0B9F47]/8 to-[#0B9F47]/3 text-[#0B9F47]"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"}
                      `}
                    >
                      {mode === "desktop"
                        ? <Monitor className="h-5 w-5" />
                        : <Smartphone className="h-5 w-5" />}
                      <span>{mode === "desktop" ? "Desktop" : "Mobile"}</span>
                      {active && (
                        <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#0B9F47] border-2 border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400">
                {viewMode === "desktop" ? "Renders at 1280 px wide" : "Renders at 390 px wide (iPhone-sized)"}
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={handleConvert}
              disabled={busy || !url.trim()}
              className={`
                w-full relative overflow-hidden rounded-xl py-3.5 font-semibold text-sm
                flex items-center justify-center gap-2.5 transition-all duration-200
                ${busy || !url.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#0B9F47] to-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99]"}
              `}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span className="truncate">{stepLabel}</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 shrink-0" />
                  <span>Convert &amp; Download PDF</span>
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-70" />
                </>
              )}
            </button>

            {/* Progress bar */}
            {busy && (
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0B9F47] to-emerald-400 transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>{stepLabel}</span>
                  <span>{pct}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Success banner ── */}
        {phase === "done" && (
          <div className="slide-up flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-emerald-900 text-sm">PDF Downloaded!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Rendered via{" "}
                <span className="font-medium">
                  {method === "headless-chrome" ? "headless Chromium (pixel-perfect ✓)" : "in-browser renderer"}
                </span>
              </p>
              <button
                onClick={reset}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
              >
                <RefreshCw className="h-3 w-3" /> Convert another
              </button>
            </div>
          </div>
        )}

        {/* ── Error banner ── */}
        {phase === "error" && (
          <div className="slide-up flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-4.5 w-4.5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-900 text-sm">Conversion failed</p>
              <p className="text-xs text-red-700 mt-0.5 break-words">{errMsg}</p>
              <button
                onClick={() => setPhase("idle")}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900"
              >
                <RefreshCw className="h-3 w-3" /> Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Method comparison card ── */}
        <div className="rounded-2xl border border-white/50 bg-white/70 backdrop-blur-md p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">How it works</h3>

          <div className="space-y-2">
            {/* Method 1 */}
            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-transparent p-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <Zap className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-900">Primary — Headless Chromium (microlink.io)</p>
                <p className="mt-0.5 text-xs text-emerald-700 leading-relaxed">
                  Renders via a real Chrome browser. JS executes, fonts &amp; images all load.
                  Output is identical to what you see in your browser.
                  Free · ~50 req/day · no key required.
                </p>
              </div>
            </div>

            {/* Method 2 */}
            <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <Monitor className="h-3.5 w-3.5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700">Fallback — dom-to-image-more + jsPDF</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                  Fetches HTML + CSS via proxy, inlines everything, renders in a hidden
                  frame, captures with SVG-based dom-to-image (better than html2canvas —
                  supports Grid, Flexbox, CSS variables &amp; web fonts).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 p-3">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              <strong>Tip:</strong> Works best on public content sites (blogs, docs, articles).
              Pages behind login, heavy SPAs, or strict CSP headers may not render perfectly.
            </p>
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}