
import { useState } from "react";
import ProcessingIndicator, { ProcessingStatus } from "@/components/tools/shared/ProcessingIndicator";
import { BASE_PATH, apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/fileUtils";
import {
  Sparkles,
  Download,
  RefreshCw,
  Image as ImageIcon,
  Wand2,
  Settings,
  Zap,
  CheckCircle2,
  Info,
  Loader2
} from "lucide-react";
import { Paper, Title, Container, Group, Stack, Grid, Text, Badge, Alert, Divider } from "@mantine/core";
import ToolLayout from "@/components/tools/shared/ToolLayout";

export default function AIImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [model, setModel] = useState("free-model");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("standard");
  const [style, setStyle] = useState("vivid");
  const [numberOfImages, setNumberOfImages] = useState([1]);
  const { toast } = useToast();

  const modelOptions = [
    { value: "free-model", label: "Free Model (Pollinations AI)", description: "Truly free generation, no API key needed", badge: "Best for Free", cost: "Free" },
    { value: "gemini", label: "Google Gemini (Imagen 3)", description: "Requires Gemini Paid/Billing enabled", badge: "Premium", cost: "Free/Paid" },
    { value: "dall-e-3", label: "DALL-E 3", description: "Highest quality, most detailed", cost: "$0.04-0.08" },
    { value: "dall-e-2", label: "DALL-E 2", description: "Fast and cost-effective", badge: "Budget", cost: "$0.02" },
    { value: "stable-diffusion", label: "Stable Diffusion", description: "Standard free model", badge: "Free", cost: "Free" },
  ];

  const sizeOptions = [
    { value: "1024x1024", label: "Square (1024×1024)", icon: "⬜" },
    { value: "1792x1024", label: "Landscape (1792×1024)", icon: "⬛" },
    { value: "1024x1792", label: "Portrait (1024×1792)", icon: "⬛" },
  ];

  const qualityOptions = [
    { value: "standard", label: "Standard", description: "Fast generation, good quality" },
    { value: "hd", label: "HD", description: "Higher quality, longer generation time" },
  ];

  const styleOptions = [
    { value: "vivid", label: "Vivid", description: "More hyper-real and dramatic" },
    { value: "natural", label: "Natural", description: "More natural and realistic" },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description of the image you want to generate",
        variant: "destructive",
      });
      return;
    }

    if (prompt.length < 10) {
      toast({
        title: "Prompt Too Short",
        description: "Please provide a more detailed description (at least 10 characters)",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");
    setGeneratedImage(null);
    setImageBlob(null);

    try {
      const response = await apiRequest("POST", "/api/tools/ai-image-generator", {
        prompt: prompt.trim(),
        model,
        size,
        quality: model === "dall-e-3" ? quality : undefined,
        style: model === "dall-e-3" ? style : undefined,
        n: numberOfImages[0],
      });

      const data = await response.json();

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);

        try {
          if (data.imageUrl.startsWith('data:')) {
            const response = await fetch(data.imageUrl);
            const blob = await response.blob();
            setImageBlob(blob);
          } else {
            const imageResponse = await fetch(data.imageUrl, { referrerPolicy: 'no-referrer' });
            if (imageResponse.ok) {
              const blob = await imageResponse.blob();
              setImageBlob(blob);
            } else {
              setImageBlob(null);
            }
          }
        } catch (fetchError) {
          console.warn("Image fetch/blob error:", fetchError);
          setImageBlob(null);
        }

        setStatus("success");
        toast({
          title: "Success",
          description: "Image generated successfully!",
        });
      } else if (data.images && data.images.length > 0) {
        const firstImage = data.images[0];
        setGeneratedImage(firstImage.url);

        try {
          const imageResponse = await fetch(firstImage.url);
          if (imageResponse.ok) {
            const blob = await imageResponse.blob();
            setImageBlob(blob);
          } else {
            setImageBlob(null);
          }
        } catch (fetchError) {
          console.warn("Image fetch error:", fetchError);
          setImageBlob(null);
        }

        setStatus("success");
      } else {
        throw new Error("No image received from server");
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      setStatus("error");

      let errorMessage = "Failed to generate image. Please try again.";
      let errorTitle = "Generation Failed";
      const errorText = error.message || error.response || String(error);

      if (errorText.includes("Rate limit exceeded") || errorText.includes("rate limit")) {
        errorTitle = "Rate Limit Exceeded";
        errorMessage = "You've exceeded the rate limit. Please wait a moment and try again.";
      } else if (errorText.includes("insufficient_quota") || errorText.includes("quota")) {
        errorTitle = "Quota Exceeded";
        errorMessage = "Your API quota has been exceeded. Please check your OpenAI account.";
      } else if (errorText.includes("invalid_api_key")) {
        errorTitle = "API Key Error";
        errorMessage = "Invalid API key detection.";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (imageBlob) {
      const filename = `ai-generated-${Date.now()}.png`;
      downloadFile(imageBlob, filename);
    } else if (generatedImage) {
      if (generatedImage.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `ai-generated-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      try {
        const proxyResponse = await apiRequest("GET", `/api/tools/ai-image-proxy?url=${encodeURIComponent(generatedImage)}`);
        const blob = await proxyResponse.blob();
        downloadFile(blob, `ai-generated-${Date.now()}.png`);
      } catch (error) {
        window.open(generatedImage, '_blank');
      }
    }
  };

  const handleReset = () => {
    setPrompt("");
    setGeneratedImage(null);
    setImageBlob(null);
    setStatus("idle");
  };

  return (
    <ToolLayout
      toolId="ai-image-generator"
      title="AI Image Generator"
      description="Transform your ideas into stunning visuals with cutting-edge AI technology. Create professional-quality images from simple text descriptions."
      category="Image Tools"
      howToSteps={[
        { name: "Describe", text: "Enter a detailed text description of the image you want to create." },
        { name: "Settings", text: "Select your preferred AI model, image dimensions, and quality settings." },
        { name: "Generate", text: "Click 'Generate Image' and wait for our AI to craft your visual." },
        { name: "Download", text: "Save your favorite generated images directly to your device." }
      ]}
    >
      <Container size="xl" py="xl">
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper withBorder shadow="lg" p="xl" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#489c51' }}>
                  <Wand2 className="h-5 w-5 text-white" />
                </div>
                <Title order={2} size="h3">Generate Image</Title>
              </div>

              <Stack gap="lg">
                <div className="space-y-3">
                  <Label htmlFor="prompt" className="text-base font-semibold flex items-center gap-2">
                    <span>Image Description</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="Example: A serene mountain landscape at sunset with vibrant orange and pink skies..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                    className="resize-none text-base"
                  />
                </div>

                <Divider />

                <div className="space-y-3">
                  <Label htmlFor="model" className="text-base font-semibold">AI Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="model" className="h-12">
                      <SelectValue placeholder="Select AI Model" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {modelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="py-3">
                          <span className="font-semibold">{option.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="size" className="text-base font-semibold">Image Dimensions</Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger id="size" className="h-12">
                      <SelectValue placeholder="Select Image Size" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {sizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerate}
                  size="lg"
                  className="w-full h-12 text-base font-semibold text-white shadow-lg"
                  style={{ backgroundColor: '#489c51' }}
                  disabled={status === "processing" || !prompt.trim() || prompt.length < 10}
                >
                  {status === "processing" ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="mr-2 h-5 w-5" />Generate Image</>
                  )}
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper withBorder shadow="lg" p="xl" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#09183a' }}>
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <Title order={2} size="h3">Generated Image</Title>
              </div>

              {status === "processing" && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 text-[#489c51] animate-spin mb-4" />
                  <Text size="lg" fw={600}>Generating Your Image</Text>
                </div>
              )}

              {status === "idle" && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Sparkles className="h-16 w-16 text-[#489c51] opacity-20 mb-4" />
                  <Text size="xl" fw={600}>Ready to Generate</Text>
                </div>
              )}

              {generatedImage && status === "success" && (
                <Stack gap="lg">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 bg-slate-50" style={{ borderColor: '#489c51' }}>
                    <img
                      src={generatedImage?.startsWith('data:') || generatedImage?.includes('pollinations.ai')
                        ? generatedImage
                        : `${BASE_PATH}/api/tools/ai-image-proxy?url=${encodeURIComponent(generatedImage || '')}`}
                      alt="AI Generated"
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleDownload} className="h-12 text-white" style={{ backgroundColor: '#489c51' }}>
                      <Download className="mr-2 h-5 w-5" /> Download
                    </Button>
                    <Button onClick={handleReset} variant="outline" className="h-12 border-2">
                      <RefreshCw className="mr-2 h-5 w-5" /> New Image
                    </Button>
                  </div>
                </Stack>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </ToolLayout>
  );
}
