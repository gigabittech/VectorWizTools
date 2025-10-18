import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import FileUploader, { UploadedFile } from "@/components/tools/shared/FileUploader";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import DownloadButton from "@/components/tools/shared/DownloadButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { rotateImage, flipImage } from "@/lib/imageProcessing";
import { downloadFile } from "@/lib/fileUtils";
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical } from "lucide-react";

export default function ImageRotator() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<string>("");
  const { toast } = useToast();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    setProcessedBlob(null);
    setProcessedPreview(null);
    setLastOperation("");
  };

  const handleRotate = async (degrees: number) => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const blob = await rotateImage(files[0].file, degrees);
      
      setProcessedBlob(blob);
      const previewUrl = URL.createObjectURL(blob);
      setProcessedPreview(previewUrl);
      
      setLastOperation(`Rotated ${degrees}°`);
      setStatus("success");
      toast({
        title: "Success!",
        description: `Image rotated ${degrees}°`,
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Rotation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleFlip = async (direction: 'horizontal' | 'vertical') => {
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      const blob = await flipImage(files[0].file, direction);
      
      setProcessedBlob(blob);
      const previewUrl = URL.createObjectURL(blob);
      setProcessedPreview(previewUrl);
      
      setLastOperation(`Flipped ${direction}`);
      setStatus("success");
      toast({
        title: "Success!",
        description: `Image flipped ${direction}`,
      });
    } catch (error) {
      setStatus("error");
      toast({
        title: "Flip Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedBlob || files.length === 0) return;

    const originalName = files[0].file.name;
    const extension = originalName.split('.').pop() || 'png';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const operation = lastOperation.toLowerCase().replace(/\s+/g, '_');
    const newFilename = `${baseName}_${operation}.${extension}`;

    downloadFile(processedBlob, newFilename);
  };

  return (
    <ToolLayout
      title="Image Rotator & Flipper"
      description="Rotate and flip images online for free. Turn images 90, 180, or 270 degrees. Flip images horizontally or vertically with one click."
      category="Image Tools"
      keywords={["rotate image", "flip image", "turn image", "image rotation", "mirror image"]}
      howToSteps={[
        { name: "Upload Image", text: "Click or drag and drop your image file" },
        { name: "Choose Operation", text: "Click a rotation or flip button" },
        { name: "Preview", text: "See the result instantly" },
        { name: "Download", text: "Download your transformed image" },
      ]}
    >
      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-[#0B9F47]" />
              Upload Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader
              accept="image/*"
              maxFiles={1}
              maxSize={50 * 1024 * 1024}
              onFilesSelected={handleFilesSelected}
              multiple={false}
              allowedTypes={["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]}
            />
          </CardContent>
        </Card>

        {/* Operations */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Transform Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rotation Options */}
              <div>
                <h3 className="text-sm font-medium mb-3">Rotate</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    onClick={() => handleRotate(90)}
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    disabled={status === "processing"}
                    data-testid="button-rotate-90"
                  >
                    <RotateCw className="h-6 w-6" />
                    <span className="text-sm">90° Right</span>
                  </Button>
                  <Button
                    onClick={() => handleRotate(180)}
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    disabled={status === "processing"}
                    data-testid="button-rotate-180"
                  >
                    <RotateCw className="h-6 w-6" />
                    <span className="text-sm">180°</span>
                  </Button>
                  <Button
                    onClick={() => handleRotate(270)}
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    disabled={status === "processing"}
                    data-testid="button-rotate-270"
                  >
                    <RotateCcw className="h-6 w-6" />
                    <span className="text-sm">270° Left</span>
                  </Button>
                  <Button
                    onClick={() => handleRotate(360)}
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    disabled={status === "processing"}
                    data-testid="button-rotate-360"
                  >
                    <RotateCw className="h-6 w-6" />
                    <span className="text-sm">360°</span>
                  </Button>
                </div>
              </div>

              {/* Flip Options */}
              <div>
                <h3 className="text-sm font-medium mb-3">Flip</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleFlip('horizontal')}
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    disabled={status === "processing"}
                    data-testid="button-flip-horizontal"
                  >
                    <FlipHorizontal className="h-6 w-6" />
                    <span className="text-sm">Flip Horizontal</span>
                  </Button>
                  <Button
                    onClick={() => handleFlip('vertical')}
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    disabled={status === "processing"}
                    data-testid="button-flip-vertical"
                  >
                    <FlipVertical className="h-6 w-6" />
                    <span className="text-sm">Flip Vertical</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        {status !== "idle" && (
          <ProcessingIndicator
            status={status}
            message="Processing your image..."
            successMessage={`${lastOperation} successfully!`}
            errorMessage="Failed to process image. Please try again."
          />
        )}

        {/* Preview and Download */}
        {processedBlob && processedPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Result Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-3 rounded border" data-testid="display-operation">
                <p className="text-sm font-medium text-gray-700 mb-2" data-testid="text-last-operation">Operation: {lastOperation}</p>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={processedPreview}
                  alt="Processed preview"
                  className="max-w-full h-auto mx-auto"
                  data-testid="preview-image"
                />
              </div>

              <DownloadButton
                onClick={handleDownload}
                className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
                size="lg"
              >
                Download Image
              </DownloadButton>
            </CardContent>
          </Card>
        )}

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>About Image Rotation & Flipping</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Our free online image rotator and flipper allows you to quickly transform your images:
            </p>
            <ul>
              <li><strong>Rotate:</strong> Turn images 90°, 180°, or 270° in either direction</li>
              <li><strong>Flip Horizontal:</strong> Create a mirror image (left becomes right)</li>
              <li><strong>Flip Vertical:</strong> Flip upside down (top becomes bottom)</li>
            </ul>
            <p>
              Perfect for fixing incorrectly oriented photos, creating mirror effects, or preparing
              images for specific layouts.
            </p>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
