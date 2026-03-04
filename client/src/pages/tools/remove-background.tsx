import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paper, Title, Container, Group, Stack, Grid, Text, Alert, Loader } from "@mantine/core";
import { downloadFile } from "@/lib/fileUtils";
import { Image as ImageIcon, Eraser, Download, ArrowLeft, Wand2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { removeBackground } from "@imgly/background-removal";
import ToolLayout from "@/components/tools/shared/ToolLayout";

export default function RemoveBackgroundTool() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      toast({
        title: "Invalid File",
        description: "Please select a valid image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB.");
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    setError(null);
    setProcessedUrl(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!imageFile) {
      setError("Please select an image first.");
      return;
    }

    setProcessing(true);
    setError(null);
    setProcessedUrl(null);

    try {
      // Use AI to remove background (pass File directly)
      const blob = await removeBackground(imageFile, {
        model: "medium", // "small" | "medium" | "large"
      });

      // Create object URL for preview
      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);

      toast({
        title: "Background Removed!",
        description: "Your image background has been successfully removed.",
      });
    } catch (err: any) {
      console.error("Background removal error:", err);
      const errorMessage = err?.message || "Failed to remove background. Please try again.";
      setError(errorMessage);
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!processedUrl) return;

    try {
      const response = await fetch(processedUrl);
      const blob = await response.blob();
      const filename = `removed-background-${Date.now()}.png`;
      downloadFile(blob, filename);

      toast({
        title: "Download Started",
        description: "Your image is being downloaded",
      });
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Download Failed",
        description: "Failed to download image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    setProcessedUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <ToolLayout
      title="Remove Objects From Photo"
      description="Erase unwanted objects from your photos. Select areas to remove and let the tool fill them in."
      category="Image Tools"
      keywords={["remove objects", "erase objects", "photo editing", "object removal", "inpainting"]}
      howToSteps={[
        { name: "Upload Photo", text: "Upload an image with objects you want to remove" },
        { name: "Highlight", text: "Use the brush to cover the object completely" },
        { name: "Remove", text: "Click Remove Objects to process" },
        { name: "Download", text: "Download your edited image" },
      ]}
    >
      <Container size="xl" py="xl">
        <Grid gutter="xl">
          {/* Left Column - Upload */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper
              withBorder
              shadow="lg"
              p="xl"
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#489c51' }}>
                  <Wand2 className="h-5 w-5 text-white" />
                </div>
                <Title order={2} size="h3">Upload Image</Title>
              </div>

              <Stack gap="lg">
                <div className="space-y-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  <Text size="xs" c="dimmed">
                    Supported formats: JPG, PNG, WebP (Max 10MB)
                  </Text>
                </div>

                {imageUrl && (
                  <div className="space-y-2">
                    <Text size="sm" fw={500}>Original Image</Text>
                    <div className="relative w-full rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                      <img
                        src={imageUrl}
                        alt="Original"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={processImage}
                    disabled={!imageFile || processing}
                    className="flex-1 h-12 text-white"
                    style={{ backgroundColor: '#489c51' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d8a45'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#489c51'}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Eraser className="mr-2 h-5 w-5" />
                        Remove Background
                      </>
                    )}
                  </Button>
                  {imageUrl && (
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="h-12"
                    >
                      Reset
                    </Button>
                  )}
                </div>

                {error && (
                  <Alert color="red" title="Error" icon={<Eraser className="h-4 w-4" />}>
                    {error}
                  </Alert>
                )}

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <Text size="sm" fw={500} mb="xs">How it works:</Text>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Upload an image (JPG, PNG, or WebP)</li>
                    <li>Click "Remove Background" to process</li>
                    <li>AI automatically detects and removes the background</li>
                    <li>Download your image with transparent background</li>
                  </ul>
                </div>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Right Column - Preview */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper
              withBorder
              shadow="lg"
              p="xl"
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#09183a' }}>
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <Title order={2} size="h3">Preview & Download</Title>
              </div>

              <Stack gap="lg">
                {processing && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: '#489c51' }}>
                        <Loader2 className="h-12 w-12 text-white animate-spin" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full animate-ping" style={{ backgroundColor: '#489c51' }}></div>
                    </div>
                    <Text size="lg" fw={600} mb="xs">Processing Your Image</Text>
                    <Text size="sm" c="dimmed" ta="center" maw={300}>
                      AI is analyzing your image and removing the background. This usually takes 5-15 seconds...
                    </Text>
                  </div>
                )}

                {!processing && !processedUrl && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-32 h-32 rounded-2xl flex items-center justify-center mb-6 shadow-lg" style={{ backgroundColor: 'rgba(72, 156, 81, 0.1)' }}>
                      <ImageIcon className="h-16 w-16" style={{ color: '#489c51' }} />
                    </div>
                    <Text size="xl" fw={600} mb="xs">Ready to Process</Text>
                    <Text size="sm" c="dimmed" ta="center" maw={300}>
                      Upload an image and click "Remove Background" to see the result here
                    </Text>
                  </div>
                )}

                {processedUrl && !processing && (
                  <Stack gap="lg">
                    <div className="relative w-full rounded-lg overflow-hidden border-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shadow-inner" style={{ borderColor: '#489c51' }}>
                      <img
                        src={processedUrl}
                        alt="Background Removed"
                        className="w-full h-auto max-h-96 object-contain"
                        style={{
                          backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAACENnwnAAAAGUlEQVQYV2NkYGD4z0ABYBxVSFUBCwAAwG8b6o6nM0wAAAAASUVORK5CYII=")`,
                          backgroundRepeat: 'repeat',
                        }}
                      />
                    </div>

                    <Button
                      onClick={handleDownload}
                      className="w-full h-12 text-white shadow-lg hover:shadow-xl transition-all"
                      style={{ backgroundColor: '#489c51' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d8a45'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#489c51'}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download PNG
                    </Button>

                    <Alert
                      color="green"
                      title="Success!"
                      icon={<Eraser className="h-4 w-4" />}
                      className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20"
                      style={{ backgroundColor: 'rgba(72, 156, 81, 0.1)' }}
                    >
                      Background removed successfully! Download your image with transparent background.
                    </Alert>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </ToolLayout>
  );
}
