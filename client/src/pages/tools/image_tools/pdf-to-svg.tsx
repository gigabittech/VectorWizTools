import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { convertImageFormat, SupportedImageFormat } from "@/lib/imageProcessing";
import { downloadFile } from "@/lib/fileUtils";
import { RefreshCw, FileDown } from "lucide-react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import JSZip from "jszip";

// Configure worker
GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

type RenderedPage = {
    pageNumber: number;
    blob: Blob;
    url: string;
    width?: number;
    height?: number;
};

// Note: Ensure SupportedImageFormat in your lib includes "application/pdf", "image/svg+xml", "image/heic"
export default function PDFtoSVG() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [status, setStatus] = useState<ProcessingStatus>("idle");
    const [targetFormat, setTargetFormat] = useState<SupportedImageFormat>("image/svg+xml");
    const [quality, setQuality] = useState([92]);
    const [pages, setPages] = useState<RenderedPage[]>([]);
    const { toast } = useToast();

    const formatOptions: { value: SupportedImageFormat; label: string; extension: string }[] = [
        { value: "image/svg+xml", label: "SVG", extension: "svg" },
        { value: "image/jpeg", label: "JPEG", extension: "jpg" },
        { value: "image/png", label: "PNG", extension: "png" },
        { value: "image/webp", label: "WebP", extension: "webp" },
        { value: "image/bmp", label: "BMP", extension: "bmp" },
        { value: "image/gif", label: "GIF", extension: "gif" },
        { value: "application/pdf", label: "PDF", extension: "pdf" },
    ];

    const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
        setFiles(uploadedFiles);
        setPages([]);
        setStatus("idle");
    };

    const handleConvert = async () => {
        if (files.length === 0) {
            toast({
                title: "No File",
                description: "Please upload a file first",
                variant: "destructive",
            });
            return;
        }

        setStatus("processing");
        setPages([]);

        try {
            const file = files[0].file;
            const qualityValue = quality[0] / 100;
            const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

            if (isPdf) {
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;

                const rendered: RenderedPage[] = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 });

                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    if (!context) throw new Error("Canvas not supported");

                    canvas.width = Math.floor(viewport.width);
                    canvas.height = Math.floor(viewport.height);

                    await page.render({ canvasContext: context, viewport }).promise;

                    let blob: Blob;
                    if (targetFormat === "image/svg+xml") {
                        const dataUrl = canvas.toDataURL("image/png");
                        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}"><image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}" /></svg>`;
                        blob = new Blob([svgString], { type: "image/svg+xml" });
                    } else if (targetFormat === "application/pdf") {
                        // PDF to PDF conversion logic from imageProcessing could be reused here for single pages
                        // But for simplicity, we use convertImageFormat for single images and this loop for PDF
                        const imgData = canvas.toDataURL("image/jpeg", qualityValue);
                        const { jsPDF } = await import("jspdf");
                        const pdfDoc = new jsPDF({
                            orientation: canvas.width > canvas.height ? "l" : "p",
                            unit: "px",
                            format: [canvas.width, canvas.height],
                        });
                        pdfDoc.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
                        blob = pdfDoc.output("blob");
                    } else {
                        blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), targetFormat, qualityValue));
                    }

                    const url = URL.createObjectURL(blob);
                    rendered.push({
                        pageNumber: i,
                        blob,
                        url,
                        width: canvas.width,
                        height: canvas.height
                    });
                }
                setPages(rendered);
            } else {
                // Non-PDF single image conversion
                const blob = await convertImageFormat(file, targetFormat, qualityValue);
                const url = URL.createObjectURL(blob);
                setPages([{
                    pageNumber: 1,
                    blob,
                    url
                }]);
            }

            setStatus("success");

            const formatName = formatOptions.find(f => f.value === targetFormat)?.label || "file";
            toast({
                title: "Success!",
                description: `Converted ${isPdf && pages.length > 1 ? pages.length + " pages" : "file"} to ${formatName}`,
            });
        } catch (error) {
            setStatus("error");
            toast({
                title: "Conversion Failed",
                description: error instanceof Error ? error.message : "An error occurred during conversion",
                variant: "destructive",
            });
        }
    };

    const handleDownloadSingle = (page: RenderedPage) => {
        if (files.length === 0) return;
        const originalName = files[0].file.name;
        const baseName = originalName.replace(/\.[^/.]+$/, '');
        const targetExt = formatOptions.find(f => f.value === targetFormat)?.extension || 'svg';
        const suffix = pages.length > 1 ? `-page-${page.pageNumber}` : '';
        const newFilename = `${baseName}${suffix}.${targetExt}`;
        downloadFile(page.blob, newFilename);
    };

    const handleDownloadAll = async () => {
        if (pages.length === 0 || files.length === 0) return;
        const zip = new JSZip();
        const originalName = files[0].file.name;
        const baseName = originalName.replace(/\.[^/.]+$/, '');
        const targetExt = formatOptions.find(f => f.value === targetFormat)?.extension || 'svg';

        pages.forEach((p) => {
            zip.file(`${baseName}-page-${p.pageNumber}.${targetExt}`, p.blob);
        });

        const content = await zip.generateAsync({ type: "blob" });
        downloadFile(content, `${baseName}-converted-svgs.zip`);
    };

    const quickConversions = [
        { from: "Any", to: "image/svg+xml", label: "To SVG" },
        { from: "Any", to: "image/jpeg", label: "To JPG" },
        { from: "Any", to: "image/png", label: "To PNG" },
        { from: "Any", to: "application/pdf", label: "To PDF" },
        { from: "Any", to: "image/webp", label: "To WebP" },
    ];

    const needsQuality = targetFormat === "image/jpeg" || targetFormat === "image/webp";

    return (
        <ToolLayout
            title="PDF to SVG Converter"
            description="Convert PDF to SVG, PNG, PDF, and more instantly. Fast, free, and secure online conversion."
            category="Image Tools"
            keywords={["pdf to svg", "pdf converter", "image converter", "pdf converter"]}
            howToSteps={[
                { name: "Upload File", text: "Upload your PDF or other image file" },
                { name: "Select Target", text: "Choose SVG or other output format" },
                { name: "Adjust Settings", text: "Fine-tune quality if needed" },
                { name: "Download", text: "Click convert and save your file" },
            ]}
        >
            <div className="space-y-6">
                <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-[#0B9F47]" />
                        Upload File
                    </h2>
                    <div>
                        <FileUploader
                            accept="image/*,application/pdf"
                            maxFiles={1}
                            maxSize={50 * 1024 * 1024}
                            onFilesSelected={handleFilesSelected}
                            multiple={false}
                            allowedTypes={[
                                "image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp",
                                "image/tiff", "application/pdf", "image/heic", "image/svg+xml"
                            ]}
                        />
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
                        <h2 className="text-xl font-bold mb-4">Conversion Settings</h2>
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-blue-900 mb-1">Source Format</p>
                                <p className="text-lg font-bold text-blue-700">
                                    {files[0].file.name.split('.').pop()?.toUpperCase() || "Unknown"}
                                </p>
                            </div>

                            <div>
                                <Label className="mb-3 block">Quick Actions</Label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {quickConversions.map((conv) => (
                                        <Button
                                            key={conv.label}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setTargetFormat(conv.to as SupportedImageFormat)}
                                        >
                                            {conv.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="format">Convert To</Label>
                                <Select value={targetFormat} onValueChange={(value) => setTargetFormat(value as SupportedImageFormat)}>
                                    <SelectTrigger id="format">
                                        <SelectValue placeholder="Select target format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formatOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label} (.{option.extension})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {needsQuality && (
                                <div className="space-y-2">
                                    <Label>Quality: {quality[0]}%</Label>
                                    <Slider
                                        value={quality}
                                        onValueChange={setQuality}
                                        min={10}
                                        max={100}
                                        step={5}
                                        className="w-full"
                                    />
                                </div>
                            )}

                            <Button
                                onClick={handleConvert}
                                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                                size="lg"
                                disabled={status === "processing"}
                            >
                                Convert Now
                            </Button>
                        </div>
                    </div>
                )}

                {status !== "idle" && (
                    <ProcessingIndicator
                        status={status}
                        message="Processing your file..."
                        successMessage="Conversion complete!"
                        errorMessage="Failed to convert. Check file compatibility."
                    />
                )}

                {pages.length > 0 && (
                    <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
                        <h2 className="text-xl font-bold mb-4">
                            {pages.length > 1 ? `Output Files (${pages.length} Pages)` : "Output File"}
                        </h2>
                        <div className="space-y-4">
                            {pages.length === 1 ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-lg border">
                                            <p className="text-sm text-gray-500">Output Size</p>
                                            <p className="font-bold">{(pages[0].blob.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg border">
                                            <p className="text-sm text-gray-500">Format</p>
                                            <p className="font-bold text-[#0B9F47]">{formatOptions.find(f => f.value === targetFormat)?.label}</p>
                                        </div>
                                    </div>

                                    {targetFormat.includes("image") && (
                                        <div className="border rounded-lg p-4 bg-gray-50">
                                            <p className="text-sm font-medium mb-2 text-center">Preview</p>
                                            <img
                                                src={pages[0].url}
                                                alt="Converted preview"
                                                className="max-h-[300px] mx-auto rounded shadow-sm"
                                            />
                                        </div>
                                    )}

                                    <DownloadButton
                                        onClick={() => handleDownloadSingle(pages[0])}
                                        className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                                        size="lg"
                                    >
                                        Download Result
                                    </DownloadButton>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                        {pages.map((p) => (
                                            <div key={p.pageNumber} className="relative group border rounded-lg overflow-hidden bg-gray-50 border-white/40 shadow-sm">
                                                <img src={p.url} alt={`Page ${p.pageNumber}`} className="w-full h-auto" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] py-1 text-center backdrop-blur-sm">
                                                    Page {p.pageNumber}
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadSingle(p)}
                                                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <FileDown className="text-white h-8 w-8" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <DownloadButton
                                        onClick={handleDownloadAll}
                                        className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                                        size="lg"
                                    >
                                        Download All as ZIP
                                    </DownloadButton>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Supported Conversions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>WEBP to JPG / PNG / PDF</li>
                            <li>JPG to WEBP / PNG</li>
                            <li>PNG to WEBP / JPG</li>
                        </ul>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}