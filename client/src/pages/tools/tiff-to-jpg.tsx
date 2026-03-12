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
import { RefreshCw } from "lucide-react";

export default function TIFFtoJPG() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [status, setStatus] = useState<ProcessingStatus>("idle");
    const [targetFormat, setTargetFormat] = useState<SupportedImageFormat>("image/jpeg");
    const [quality, setQuality] = useState([92]);
    const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
    const [convertedPreview, setConvertedPreview] = useState<string | null>(null);
    const { toast } = useToast();

    const formatOptions: { value: SupportedImageFormat; label: string; extension: string }[] = [
        { value: "image/jpeg", label: "JPEG", extension: "jpg" },
        { value: "image/png", label: "PNG", extension: "png" },
        { value: "image/webp", label: "WebP", extension: "webp" },
        { value: "image/bmp", label: "BMP", extension: "bmp" },
        { value: "image/gif", label: "GIF", extension: "gif" },
        { value: "image/svg+xml", label: "SVG", extension: "svg" },
        { value: "application/pdf", label: "PDF", extension: "pdf" },
    ];

    const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
        setFiles(uploadedFiles);
        setConvertedBlob(null);
        setConvertedPreview(null);
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

        try {
            const formData = new FormData();
            formData.append("file", files[0].file);

            // Map MIME type to extension for backend
            const extension = formatOptions.find(f => f.value === targetFormat)?.extension || "jpg";
            formData.append("format", extension);
            formData.append("quality", quality[0].toString());

            const response = await fetch("/tools/api/tools/tiff-to-jpg", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to convert file");
            }

            const blob = await response.blob();
            setConvertedBlob(blob);

            // Only show preview if it's an image
            if (targetFormat.startsWith("image/")) {
                const previewUrl = URL.createObjectURL(blob);
                setConvertedPreview(previewUrl);
            } else {
                setConvertedPreview(null);
            }

            setStatus("success");

            const formatName = formatOptions.find(f => f.value === targetFormat)?.label || "file";
            toast({
                title: "Success!",
                description: `File converted to ${formatName}`,
            });
        } catch (error: any) {
            console.error("Conversion error:", error);
            setStatus("error");
            toast({
                title: "Conversion Failed",
                description: error.message || "Failed to convert. An error occurred.",
                variant: "destructive",
            });
        }
    };

    const handleDownload = () => {
        if (!convertedBlob || files.length === 0) return;

        const originalName = files[0].file.name;
        const baseName = originalName.replace(/\.[^/.]+$/, '');
        const targetExt = formatOptions.find(f => f.value === targetFormat)?.extension || 'jpg';
        const newFilename = `${baseName}.${targetExt}`;

        const url = window.URL.createObjectURL(convertedBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = newFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const quickConversions = [
        { from: "Any", to: "image/jpeg", label: "To JPG" },
        { from: "Any", to: "image/png", label: "To PNG" },
        { from: "Any", to: "application/pdf", label: "To PDF" },
        { from: "Any", to: "image/webp", label: "To WebP" },
        { from: "Any", to: "image/svg+xml", label: "To SVG" },
    ];

    const needsQuality = targetFormat === "image/jpeg" || targetFormat === "image/webp";

    return (
        <ToolLayout
            title="TIFF to JPG Converter"
            description="Convert TIFF to JPG, PNG, PDF, and more instantly. Fast, free, and secure online conversion."
            category="Image Tools"
            keywords={["tiff to jpg", "tiff converter", "image converter", "pdf converter"]}
            howToSteps={[
                { name: "Upload File", text: "Upload your TIFF file" },
                { name: "Select Target", text: "Choose JPG or other output format" },
                { name: "Convert", text: "Click convert button" },
                { name: "Download", text: "Save the converted file" },
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
                            accept="image/tiff,image/*"
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

                {convertedBlob && convertedPreview && (
                    <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 hover:bg-white/80 transition-all">
                        <h2 className="text-xl font-bold mb-4">Output File</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg border">
                                    <p className="text-sm text-gray-500">Output Size</p>
                                    <p className="font-bold">{(convertedBlob.size / 1024).toFixed(1)} KB</p>
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
                                        src={convertedPreview}
                                        alt="Converted preview"
                                        className="max-h-[300px] mx-auto rounded shadow-sm"
                                    />
                                </div>
                            )}

                            <DownloadButton
                                onClick={handleDownload}
                                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                                size="lg"
                            >
                                Download Result
                            </DownloadButton>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
