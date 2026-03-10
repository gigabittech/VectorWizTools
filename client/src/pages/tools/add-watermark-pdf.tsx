import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { Droplet, Type, Image as ImageIcon, Layout, Settings, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const positions = [
  { value: "center", label: "Center" },
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "left-center", label: "Left Center" },
  { value: "right-center", label: "Right Center" },
  { value: "diagonal", label: "Diagonal" },
];

const fonts = [
  { value: StandardFonts.Helvetica, label: "Helvetica" },
  { value: StandardFonts.HelveticaBold, label: "Helvetica Bold" },
  { value: StandardFonts.TimesRoman, label: "Times Roman" },
  { value: StandardFonts.TimesRomanBold, label: "Times Roman Bold" },
  { value: StandardFonts.Courier, label: "Courier" },
  { value: StandardFonts.CourierBold, label: "Courier Bold" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? { r: parseInt(r[1], 16) / 255, g: parseInt(r[2], 16) / 255, b: parseInt(r[3], 16) / 255 }
    : { r: 0.5, g: 0.5, b: 0.5 };
}

function calcXY(
  pos: string,
  pw: number, ph: number,
  iw: number, ih: number,
  pad = 50
): { x: number; y: number } {
  switch (pos) {
    case "center":
    case "diagonal": return { x: (pw - iw) / 2, y: (ph - ih) / 2 };
    case "top-left": return { x: pad, y: ph - ih - pad };
    case "top-center": return { x: (pw - iw) / 2, y: ph - ih - pad };
    case "top-right": return { x: pw - iw - pad, y: ph - ih - pad };
    case "bottom-left": return { x: pad, y: pad };
    case "bottom-center": return { x: (pw - iw) / 2, y: pad };
    case "bottom-right": return { x: pw - iw - pad, y: pad };
    case "left-center": return { x: pad, y: (ph - ih) / 2 };
    case "right-center": return { x: pw - iw - pad, y: (ph - ih) / 2 };
    default: return { x: (pw - iw) / 2, y: (ph - ih) / 2 };
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── component ────────────────────────────────────────────────────────────────

export default function AddWatermarkPDF() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [watermarkFile, setWatermarkFile] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");

  const [watermarkText, setWatermarkText] = useState("WATERMARK");
  const [fontSize, setFontSize] = useState([60]);
  const [fontFamily, setFontFamily] = useState<string>(StandardFonts.HelveticaBold);
  const [textColor, setTextColor] = useState("#808080");

  const [position, setPosition] = useState("center");
  const [opacity, setOpacity] = useState([50]);
  const [rotation, setRotation] = useState([45]);
  const [imageScale, setImageScale] = useState([0.5]);

  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [outputName, setOutputName] = useState("watermarked.pdf");

  const { toast } = useToast();

  const handleFilesSelected = (uploaded: UploadedFile[]) => {
    setFiles(uploaded);
    setProcessedBlob(null);
    setStatus("idle");
    if (uploaded[0]) {
      const base = uploaded[0].file.name.replace(/\.[^/.]+$/, "");
      setOutputName(`${base}_watermarked.pdf`);
    }
  };

  const handleAddWatermark = async () => {
    if (files.length === 0) {
      toast({ title: "No File", description: "Please upload a PDF file", variant: "destructive" });
      return;
    }
    if (watermarkType === "image" && watermarkFile.length === 0) {
      toast({ title: "No Image", description: "Please upload a watermark image", variant: "destructive" });
      return;
    }

    setStatus("processing");
    setProcessedBlob(null);

    try {
      const pdfBytes = await files[0].file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const font = await pdf.embedFont(fontFamily as StandardFonts);

      // embed watermark image once
      let embeddedImage: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
      if (watermarkType === "image" && watermarkFile[0]) {
        const imgBytes = await watermarkFile[0].file.arrayBuffer();
        const mime = watermarkFile[0].file.type;
        try {
          embeddedImage = mime === "image/png"
            ? await pdf.embedPng(imgBytes)
            : await pdf.embedJpg(imgBytes);
        } catch {
          // fallback: try the other format
          try { embeddedImage = await pdf.embedPng(imgBytes); }
          catch { embeddedImage = await pdf.embedJpg(imgBytes); }
        }
      }

      for (const page of pdf.getPages()) {
        const { width: pw, height: ph } = page.getSize();

        if (watermarkType === "image" && embeddedImage) {
          const scaled = embeddedImage.scale(imageScale[0]);
          const { x, y } = calcXY(position, pw, ph, scaled.width, scaled.height);
          page.drawImage(embeddedImage, {
            x, y,
            width: scaled.width,
            height: scaled.height,
            opacity: opacity[0] / 100,
            rotate: degrees(rotation[0]),
          });
        } else {
          const size = fontSize[0];
          const text = watermarkText || " ";
          const tw = font.widthOfTextAtSize(text, size);
          const th = font.heightAtSize(size);
          const deg = position === "diagonal"
            ? Math.atan2(ph, pw) * (180 / Math.PI)
            : rotation[0];
          const { x, y } = calcXY(position, pw, ph, tw, th);
          const color = hexToRgb(textColor);

          page.drawText(text, {
            x, y, size, font,
            color: rgb(color.r, color.g, color.b),
            opacity: opacity[0] / 100,
            rotate: degrees(deg),
          });
        }
      }

      const saved = await pdf.save();
      const blob = new Blob([saved as any], { type: "application/pdf" });
      setProcessedBlob(blob);
      setStatus("success");
      toast({ title: "Success!", description: "Watermark added successfully." });

    } catch (err) {
      console.error("Watermark error:", err);
      setStatus("error");
      toast({
        title: "Failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (processedBlob) downloadBlob(processedBlob, outputName);
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <ToolLayout
      title="Add Watermark"
      description="Stamp a text or image watermark over your PDF to protect your documents."
      category="PDF Tools"
      keywords={["add watermark", "pdf watermark", "watermark pdf", "protect pdf", "pdf stamp"]}
      howToSteps={[
        { name: "Upload PDF", text: "Upload a PDF file" },
        { name: "Add Watermark", text: "Enter text or upload image watermark" },
        { name: "Set Options", text: "Choose position, opacity and rotation" },
        { name: "Apply", text: "Click Apply Watermark then download" },
      ]}
    >
      <div className="space-y-6">

        {/* Upload PDF */}
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

        {/* Settings */}
        {files.length > 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#0B9F47]" />
              Watermark Settings
            </h2>

            <Tabs
              defaultValue="text"
              className="w-full"
              onValueChange={(v) => setWatermarkType(v as "text" | "image")}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <Type className="h-4 w-4" /> Text
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Image
                </TabsTrigger>
              </TabsList>

              {/* Text tab */}
              <TabsContent value="text" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Watermark Text</Label>
                    <Input
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Enter watermark text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {fonts.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Font Size: {fontSize[0]}px</Label>
                    <Slider value={fontSize} onValueChange={setFontSize} min={10} max={200} step={1} />
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-12 p-1 h-10"
                      />
                      <Input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Image tab */}
              <TabsContent value="image" className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload Image Watermark (PNG or JPG)</Label>
                  <FileUploader
                    accept="image/png,image/jpeg,image/jpg"
                    maxFiles={1}
                    maxSize={10 * 1024 * 1024}
                    onFilesSelected={setWatermarkFile}
                    multiple={false}
                    allowedTypes={["image/png", "image/jpeg", "image/jpg"]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image Scale: {imageScale[0].toFixed(1)}x</Label>
                  <Slider value={imageScale} onValueChange={setImageScale} min={0.1} max={2.0} step={0.1} />
                </div>
              </TabsContent>
            </Tabs>

            {/* Layout & Style */}
            <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Layout className="h-5 w-5 text-[#0B9F47]" />
                Layout &amp; Style
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {positions.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rotation: {rotation[0]}°</Label>
                  <Slider
                    value={rotation}
                    onValueChange={setRotation}
                    min={0} max={360} step={1}
                    disabled={position === "diagonal"}
                  />
                  {position === "diagonal" && (
                    <p className="text-xs text-muted-foreground">
                      Rotation is auto-calculated for diagonal
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Opacity: {opacity[0]}%</Label>
                  <Slider value={opacity} onValueChange={setOpacity} min={5} max={100} step={1} />
                </div>
              </div>

              <Button
                onClick={handleAddWatermark}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white mt-4"
                size="lg"
                disabled={status === "processing"}
              >
                {status === "processing" ? "Processing…" : "Apply Watermark"}
              </Button>
            </div>
          </div>
        )}

        {/* Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Adding watermark…"
            successMessage="Watermark added successfully!"
            errorMessage="Failed to add watermark. Please try again."
          />
        )}

        {/* Download — plain Button, no DownloadButton component */}
        {processedBlob && (
          <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
            <Button
              onClick={handleDownload}
              className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Watermarked PDF
            </Button>
          </div>
        )}

      </div>
    </ToolLayout>
  );
}