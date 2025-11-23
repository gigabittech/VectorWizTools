import { useEffect, useRef, useState } from "react";
import { Container, Grid, Group, Paper, Stack, Title, Text, Badge, Alert, Divider } from "@mantine/core";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, FileImage, FileDown, Images, Info, Loader2, Settings } from "lucide-react";

import JSZip from "jszip";

// Import pdfjs-dist and configure worker
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from "pdfjs-dist";

// Configure worker - use jsdelivr CDN with correct .mjs extension
// Note: pdfjs-dist 4.x uses .mjs (ES module) instead of .js
GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

// Optimal scale for high-quality conversion (2.5x provides excellent quality without excessive memory usage)
const OPTIMAL_SCALE = 2.5;

type RenderedPage = {
  pageNumber: number;
  blob: Blob;
  url: string;
  width: number;
  height: number;
};

// Maximum JPEG quality for best output
const MAX_JPEG_QUALITY = 1.0; // 100%

export default function PDFToJPG() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [numPages, setNumPages] = useState<number | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "PDF to JPG - VectorWiz";
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    setFile(f);
    setPages([]);
    setNumPages(null);
    setStatus("idle");
  };

  const renderPdf = async () => {
    if (!file) return;
    setStatus("processing");
    setPages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      pdfRef.current = pdf;
      setNumPages(pdf.numPages);

      const rendered: RenderedPage[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: OPTIMAL_SCALE });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas not supported");

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({ canvasContext: context, viewport }).promise;

        const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", MAX_JPEG_QUALITY));
        const url = URL.createObjectURL(blob);
        rendered.push({ pageNumber: i, blob, url, width: canvas.width, height: canvas.height });
      }

      setPages(rendered);
      setStatus("success");
      toast({ title: "Conversion complete", description: `Converted ${rendered.length} page(s) to JPG.` });
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      toast({ title: "Conversion failed", description: err.message || "Unable to convert PDF.", variant: "destructive" });
    }
  };

  const downloadAll = async () => {
    if (!pages.length || !file) return;
    const zip = new JSZip();
    const folder = zip.folder("pdf-to-jpg")!;
    for (const p of pages) {
      const baseName = file.name.replace(/\.pdf$/i, "");
      folder.file(`${baseName}-page-${p.pageNumber}.jpg`, p.blob);
    }
    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = `${file.name.replace(/\.pdf$/i, "")}-jpg.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadSingle = (p: RenderedPage) => {
    if (!file) return;
    const a = document.createElement("a");
    a.href = p.url;
    a.download = `${file.name.replace(/\.pdf$/i, "")}-page-${p.pageNumber}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="text-white" style={{ backgroundColor: '#09183a' }}>
        <Container size="xl" py="xl">
          <div className="mb-6">
            <Link href="/tools">
              <Button 
                variant="ghost" 
                className="text-white/90 hover:text-white hover:bg-white/10 mb-6"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Tools
              </Button>
            </Link>
          </div>

          <Group align="flex-start" gap="xl" wrap="nowrap">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#489c51' }}>
              <Images className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1">
              <Title order={1} size="h1" mb="md" className="text-white">PDF to JPG</Title>
              <Text size="lg" className="text-white/90 mb-4 max-w-2xl">
                Convert each page of your PDF into maximum quality JPG images with automatic optimal settings, directly in your browser.
              </Text>
              <Group gap="xs" mt="md">
                <Badge size="lg" variant="light" className="text-white border-white/30" style={{ backgroundColor: 'rgba(72, 156, 81, 0.3)' }}>No upload needed</Badge>
                <Badge size="lg" variant="light" className="text-white border-white/30" style={{ backgroundColor: 'rgba(72, 156, 81, 0.3)' }}>Fast & secure</Badge>
              </Group>
            </div>
          </Group>
        </Container>
      </div>

      <Container size="xl" py="xl">
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper withBorder shadow="lg" p="xl" className="bg-white border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#489c51' }}>
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <Title order={2} size="h3">Convert PDF</Title>
              </div>

              <Stack gap="lg">
                <div className="space-y-3">
                  <Label htmlFor="pdf-file" className="text-base font-semibold">
                    PDF File
                  </Label>
                  <input
                    id="pdf-file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm"
                  />
                  <Text size="xs" c="dimmed">Max size depends on your browser memory. For large PDFs, try converting in batches.</Text>
                </div>

                <Divider />

                <Button
                  onClick={renderPdf}
                  disabled={!file || status === "processing"}
                  className="h-12 text-white"
                  style={{ backgroundColor: '#489c51' }}
                >
                  {status === "processing" ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Converting...</>) : (<><FileImage className="mr-2 h-5 w-5" />Convert to JPG</>)}
                </Button>

                {status === "error" && (
                  <Alert color="red" title="Conversion Failed" icon={<Info className="h-4 w-4" />} className="border-red-200">
                    Please check the PDF file and try again.
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper withBorder shadow="lg" p="xl" className="bg-white border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#09183a' }}>
                  <FileDown className="h-5 w-5 text-white" />
                </div>
                <Title order={2} size="h3">Output</Title>
              </div>

              {status === "idle" && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-32 h-32 rounded-2xl flex items-center justify-center mb-6 shadow-lg" style={{ backgroundColor: 'rgba(72, 156, 81, 0.1)' }}>
                    <Images className="h-16 w-16" style={{ color: '#489c51' }} />
                  </div>
                  <Text size="xl" fw={600} mb="xs">Ready to Convert</Text>
                  <Text size="sm" c="dimmed" ta="center" maw={320}>Upload a PDF and click "Convert to JPG" to begin.</Text>
                </div>
              )}

              {status === "processing" && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: '#489c51' }}>
                      <Loader2 className="h-12 w-12 text-white animate-spin" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full animate-ping" style={{ backgroundColor: '#489c51' }}></div>
                  </div>
                  <Text size="lg" fw={600} mb="xs">Converting PDF</Text>
                  <Text size="sm" c="dimmed" ta="center" maw={320}>This may take a moment for multi-page or high-resolution PDFs.</Text>
                </div>
              )}

              {status === "success" && (
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Text size="sm" c="dimmed">Pages: {pages.length}{numPages ? ` / ${numPages}` : ""}</Text>
                    <Button onClick={downloadAll} className="text-white" style={{ backgroundColor: '#489c51' }}>
                      <FileDown className="mr-2 h-5 w-5" /> Download All (ZIP)
                    </Button>
                  </Group>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pages.map((p) => (
                      <div key={p.pageNumber} className="rounded-lg overflow-hidden border bg-white">
                        <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center">
                          <img src={p.url} alt={`Page ${p.pageNumber}`} className="max-w-full max-h-full" />
                        </div>
                        <div className="p-3 flex items-center justify-between text-sm">
                          <div className="text-slate-600">Page {p.pageNumber} — {p.width}×{p.height}px</div>
                          <Button size="sm" onClick={() => downloadSingle(p)}>
                            <FileDown className="mr-2 h-4 w-4" /> JPG
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Stack>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  );
}


