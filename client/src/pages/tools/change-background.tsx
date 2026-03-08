import { useState, useRef } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ImageIcon,
  Eraser,
  Sparkles,
  Download,
  Trash2,
  Loader2,
  Palette,
  Eye,
  Settings2
} from "lucide-react";
import { removeBackground } from "@imgly/background-removal";
import { downloadFile } from "@/lib/fileUtils";
import {
  Container,
  Paper,
  Title,
  Text,
  Stack,
  Group,
  Slider,
  Tabs,
  Badge,
  Alert,
  Box,
  SimpleGrid,
  LoadingOverlay
} from "@mantine/core";

export default function ChangeBackground() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [blurAmount, setBlurAmount] = useState(15);
  const [activeTab, setActiveTab] = useState<string | null>("transparent");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPG, PNG, WebP).",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setProcessedUrl(null);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processImage = async (mode: "transparent" | "blur" | "remove") => {
    if (!file) return;

    setProcessing(true);
    setProcessedUrl(null);

    try {
      const foregroundBlob = await removeBackground(file, {
        progress: (key, current, total) => {
          // Progress logging if needed
        }
      });

      if (mode === "blur") {
        const resultBlob = await applyBlurBackground(file, foregroundBlob, blurAmount);
        setProcessedUrl(URL.createObjectURL(resultBlob));
      } else {
        // Transparent and Remove are handled same way (AI background removal)
        setProcessedUrl(URL.createObjectURL(foregroundBlob));
      }

      toast({
        title: "Success!",
        description: `Background ${mode === "blur" ? "blurred" : "removed"} successfully.`,
      });
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing Failed",
        description: "An error occurred while processing the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const applyBlurBackground = async (originalFile: File, foregroundBlob: Blob, amount: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const originalImg = new Image();
      const foregroundImg = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      let imagesLoaded = 0;
      const onImageLoad = () => {
        imagesLoaded++;
        if (imagesLoaded === 2) {
          canvas.width = originalImg.width;
          canvas.height = originalImg.height;

          // Step 1: Draw blurred background
          ctx.filter = `blur(${amount}px)`;
          ctx.drawImage(originalImg, 0, 0);

          // Step 2: Draw foreground clearly on top
          ctx.filter = "none";
          ctx.drawImage(foregroundImg, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create result blob"));
          }, "image/png");
        }
      };

      originalImg.onload = onImageLoad;
      foregroundImg.onload = onImageLoad;
      originalImg.onerror = reject;
      foregroundImg.onerror = reject;

      originalImg.src = URL.createObjectURL(originalFile);
      foregroundImg.src = URL.createObjectURL(foregroundBlob);
    });
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const suffix = activeTab === "blur" ? "blurred" : "no-bg";
    const fileName = file ? `${file.name.split(".")[0]}_${suffix}.png` : `processed_image.png`;

    fetch(processedUrl)
      .then(res => res.blob())
      .then(blob => downloadFile(blob, fileName));
  };

  return (
    <ToolLayout
      title="Change Background"
      description="Professional AI-powered background removal and blurring tool. Create transparent backgrounds or depth-of-field effects in seconds."
      category="Image Tools"
      keywords={["change background", "remove background", "blur background", "transparent background", "ai image editor"]}
      howToSteps={[
        { name: "Upload", text: "Choose an image file from your device." },
        { name: "Select Mode", text: "Pick 'Transparent', 'Blur', or 'Remove' mode." },
        { name: "Process", text: "Wait for AI to analyze and edit your image." },
        { name: "Download", text: "Get your high-quality result in PNG format." },
      ]}
    >
      <Container size="xl" py="xl">
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
          {/* Controls Section */}
          <Stack gap="lg">
            <Paper withBorder shadow="sm" p="xl" radius="md">
              <Group justify="space-between" mb="lg">
                <Title order={3} className="flex items-center gap-2">
                  <Palette className="w-6 h-6 text-[#0B9F47]" />
                  Tool Settings
                </Title>
                {file && (
                  <Button variant="ghost" size="sm" onClick={reset} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 mr-2" /> Reset
                  </Button>
                )}
              </Group>

              <Stack gap="md">
                {!file ? (
                  <Box
                    className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-[#0B9F47] hover:bg-[#0B9F47]/5 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <Text fw={600} size="lg">Click to upload your image</Text>
                    <Text size="sm" c="dimmed">Supports PNG, JPG, WebP (Max 10MB)</Text>
                  </Box>
                ) : (
                  <Stack gap="xl">
                    <Tabs value={activeTab} onChange={(val) => setActiveTab(val)} variant="pills" radius="md" color="green">
                      <Tabs.List grow>
                        <Tabs.Tab value="transparent" leftSection={<Eraser className="w-4 h-4" />}>
                          Transparent
                        </Tabs.Tab>
                        <Tabs.Tab value="blur" leftSection={<Sparkles className="w-4 h-4" />}>
                          Blur
                        </Tabs.Tab>
                        <Tabs.Tab value="remove" leftSection={<Settings2 className="w-4 h-4" />}>
                          Remove
                        </Tabs.Tab>
                      </Tabs.List>

                      <Tabs.Panel value="transparent" pt="xl">
                        <Alert color="blue" variant="light" radius="md" mb="md">
                          Removes the background completely. Best for product photos and stickers.
                        </Alert>
                        <Button
                          size="lg"
                          className="bg-[#0B9F47] hover:bg-[#087F39] text-white"
                          onClick={() => processImage("transparent")}
                          disabled={processing}
                        >
                          {processing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Eraser className="w-5 h-5 mr-2" />}
                          Make Background Transparent
                        </Button>
                      </Tabs.Panel>

                      <Tabs.Panel value="blur" pt="xl">
                        <Stack gap="md">
                          <Box>
                            <Group justify="space-between" mb="xs">
                              <Text size="sm" fw={500}>Blur Intensity</Text>
                              <Badge color="green">{blurAmount}px</Badge>
                            </Group>
                            <Slider
                              value={blurAmount}
                              onChange={setBlurAmount}
                              min={0}
                              max={50}
                              label={(value) => `${value}px`}
                              color="green"
                            />
                          </Box>
                          <Alert color="blue" variant="light" radius="md">
                            Keeps the subject sharp while blurring the background for a professional portrait look.
                          </Alert>
                          <Button
                            size="lg"
                            className="bg-[#0B9F47] hover:bg-[#087F39] text-white"
                            onClick={() => processImage("blur")}
                            disabled={processing}
                          >
                            {processing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                            Apply Background Blur
                          </Button>
                        </Stack>
                      </Tabs.Panel>

                      <Tabs.Panel value="remove" pt="xl">
                        <Alert color="blue" variant="light" radius="md" mb="md">
                          Advanced AI detection to isolate the main subject from the background.
                        </Alert>
                        <Button
                          size="lg"
                          className="bg-[#0B9F47] hover:bg-[#087F39] text-white"
                          onClick={() => processImage("remove")}
                          disabled={processing}
                        >
                          {processing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Eraser className="w-5 h-5 mr-2" />}
                          Remove Background
                        </Button>
                      </Tabs.Panel>
                    </Tabs>
                  </Stack>
                )}
              </Stack>
            </Paper>

            <Paper withBorder p="md" radius="md" className="bg-blue-50/50">
              <Text size="sm" fw={600} mb="xs">Tips for best results:</Text>
              <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                <li>Use images with clear subjects and good lighting</li>
                <li>Ensure subjects are fully in the frame</li>
                <li>Avoid overly complex backgrounds if possible</li>
                <li>Higher resolution images work better but take longer to process</li>
              </ul>
            </Paper>
          </Stack>

          {/* Preview Section */}
          <Paper withBorder shadow="sm" p="xl" radius="md" pos="relative">
            <LoadingOverlay visible={processing} zIndex={1000} overlayProps={{ blur: 2 }} loaderProps={{ color: 'green', type: 'bars' }} />
            <Title order={3} mb="lg" className="flex items-center gap-2">
              <Eye className="w-6 h-6 text-[#0B9F47]" />
              Preview Area
            </Title>

            <Stack gap="md" align="center" justify="center" h="100%" mih={400}>
              {!previewUrl ? (
                <Stack align="center" gap="xs" c="dimmed">
                  <ImageIcon className="w-16 h-16 opacity-20" />
                  <Text>Upload an image to see preview</Text>
                </Stack>
              ) : (
                <Stack gap="md" w="100%">
                  <Box className="relative border rounded-xl overflow-hidden bg-slate-100 group shadow-inner">
                    <img
                      src={processedUrl || previewUrl}
                      alt="Preview"
                      className="max-w-full h-auto max-h-[500px] mx-auto block object-contain"
                      style={processedUrl && activeTab !== "blur" ? {
                        backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAACENnwnAAAAGUlEQVQYV2NkYGD4z0ABYBxVSFUBCwAAwG8b6o6nM0wAAAAASUVORK5CYII=")`,
                        backgroundRepeat: "repeat"
                      } : {}}
                    />
                    {processedUrl && (
                      <Badge
                        color="green"
                        variant="filled"
                        className="absolute top-4 right-4"
                      >
                        Processed
                      </Badge>
                    )}
                  </Box>

                  {processedUrl && (
                    <Button
                      fullWidth
                      size="lg"
                      className="bg-[#09183a] hover:bg-[#1a2b4a] text-white mt-4 shadow-lg"
                      onClick={handleDownload}
                    >
                      <Download className="w-5 h-5 mr-2" /> Download Result
                    </Button>
                  )}
                </Stack>
              )}
            </Stack>
          </Paper>
        </SimpleGrid>
      </Container>
    </ToolLayout>
  );
}


