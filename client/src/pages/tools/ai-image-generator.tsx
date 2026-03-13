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
  ArrowLeft,
  Zap,
  CheckCircle2,
  Info,
  Loader2
} from "lucide-react";
import { Paper, Title, Container, Group, Stack, Grid, Text, Badge, Alert, Divider } from "@mantine/core";
import { Link } from "wouter";

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
      const response = await apiRequest("POST", "/tools/api/tools/ai-image-generator", {
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

        // If it's a data URL, we can convert to blob directly or via fetch
        // If it's a remote URL, we might need a proxy or no-referrer
        // If it's a data URL, we use it directly. For remote URLs, we use no-referrer.
        try {
          if (data.imageUrl.startsWith('data:')) {
            // Convert data URL to blob
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

      // Parse error message to show user-friendly message
      let errorMessage = "Failed to generate image. Please try again.";
      let errorTitle = "Generation Failed";

      const errorText = error.message || error.response || String(error);

      // Handle specific error types
      if (errorText.includes("Rate limit exceeded") || errorText.includes("rate limit")) {
        errorTitle = "Rate Limit Exceeded";
        // Extract rate limit details
        const limitMatch = errorText.match(/Limit: (\d+)\/(\w+)/);
        if (limitMatch) {
          errorMessage = `You've exceeded the rate limit of ${limitMatch[1]} images per ${limitMatch[2]}. Please wait a moment and try again.`;
        } else {
          errorMessage = "You've exceeded the rate limit. Please wait a moment and try again.";
        }
      } else if (errorText.includes("insufficient_quota") || errorText.includes("quota")) {
        errorTitle = "Quota Exceeded";
        errorMessage = "Your API quota has been exceeded. Please check your OpenAI account or try again later.";
      } else if (errorText.includes("invalid_api_key") || errorText.includes("API key") || errorText.includes("Invalid API")) {
        errorTitle = "API Key Error";
        errorMessage = "Invalid API key. Please check your OpenAI API key configuration.";
      } else if (errorText.includes("content_policy_violation") || errorText.includes("content policy") || errorText.includes("safety")) {
        errorTitle = "Content Policy Violation";
        errorMessage = "Your prompt may violate content policies. Please modify your prompt and try again.";
      } else if (error.status === 500) {
        errorTitle = "Server Error";
        errorMessage = "An error occurred on the server. Please try again in a moment.";
      } else if (error.status === 400) {
        errorTitle = "Invalid Request";
        errorMessage = errorText || "Your request was invalid. Please check your input and try again.";
      } else if (error.status === 401 || error.status === 403) {
        errorTitle = "Authentication Error";
        errorMessage = "Authentication failed. Please check your API keys.";
      } else if (errorText.includes("network") || errorText.includes("fetch") || errorText.includes("Failed to fetch")) {
        errorTitle = "Network Error";
        errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
      } else if (errorText && !errorText.includes('{') && !errorText.includes('500:')) {
        // Use the error message if it's clean (not JSON or status code)
        errorMessage = errorText;
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
      toast({
        title: "Download Started",
        description: "Your image is being downloaded",
      });
    } else if (generatedImage) {
      // If it's a data URL, download it directly
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
        const proxyResponse = await apiRequest("GET", `/tools/api/tools/ai-image-proxy?url=${encodeURIComponent(generatedImage)}`);
        const blob = await proxyResponse.blob();
        const filename = `ai-generated-${Date.now()}.png`;
        downloadFile(blob, filename);
        toast({
          title: "Download Started",
          description: "Your image is being downloaded",
        });
      } catch (error) {
        window.open(generatedImage, '_blank');
        toast({
          title: "Download",
          description: "Image opened in new tab. Right-click to save.",
        });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Header */}
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
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1">
              <Title order={1} size="h1" mb="md" className="text-white">
                AI Image Generator
              </Title>
              <Text size="lg" className="text-white/90 mb-4 max-w-2xl">
                Transform your ideas into stunning visuals with cutting-edge AI technology.
                Create professional-quality images from simple text descriptions.
              </Text>
              <Group gap="xs" mt="md">
                <Badge
                  size="lg"
                  variant="light"
                  className="text-white border-white/30"
                  style={{ backgroundColor: 'rgba(72, 156, 81, 0.3)' }}
                  leftSection={<Zap className="h-3.5 w-3.5" />}
                >
                  AI Powered
                </Badge>
                <Badge
                  size="lg"
                  variant="light"
                  className="text-white border-white/30"
                  style={{ backgroundColor: 'rgba(72, 156, 81, 0.3)' }}
                  leftSection={<CheckCircle2 className="h-3.5 w-3.5" />}
                >
                  High Quality
                </Badge>
                <Badge
                  size="lg"
                  variant="light"
                  className="text-white border-white/30"
                  style={{ backgroundColor: 'rgba(72, 156, 81, 0.3)' }}
                  leftSection={<Sparkles className="h-3.5 w-3.5" />}
                >
                  Free Tool
                </Badge>
              </Group>
            </div>
          </Group>
        </Container>
      </div>

      <Container size="xl" py="xl">
        <Grid gutter="xl">
          {/* Left Column - Form */}
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
                <Title order={2} size="h3">Generate Image</Title>
              </div>

              <Stack gap="lg">
                {/* Prompt Input */}
                <div className="space-y-3">
                  <Label htmlFor="prompt" className="text-base font-semibold flex items-center gap-2">
                    <span>Image Description</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="Example: A serene mountain landscape at sunset with vibrant orange and pink skies, photorealistic style, cinematic lighting, 4K quality..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                    className="resize-none text-base"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <Text size="xs" c="dimmed" className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Be specific about style, colors, composition, and mood
                    </Text>
                    <Text size="xs" c={prompt.length < 10 ? "red" : "dimmed"}>
                      {prompt.length} / 4000 characters
                    </Text>
                  </div>
                </div>

                <Divider />

                {/* Model Selection */}
                <div className="space-y-3">
                  <Label htmlFor="model" className="text-base font-semibold">
                    AI Model
                  </Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="model" className="h-12">
                      <SelectValue placeholder="Select AI Model" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] min-w-[var(--radix-select-trigger-width)]">
                      {modelOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="py-3"
                          textValue={option.label}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{option.label}</span>
                                {option.badge && (
                                  <Badge size="sm" variant="light" style={{ backgroundColor: '#489c51', color: '#ffffff' }}>
                                    {option.badge}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mb-1">
                                {option.description}
                              </div>
                              {/* <div className="text-xs text-muted-foreground">
                                Cost: {option.cost} per image
                              </div> */}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Size Selection */}
                <div className="space-y-3">
                  <Label htmlFor="size" className="text-base font-semibold">
                    Image Dimensions
                  </Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger id="size" className="h-12">
                      <SelectValue placeholder="Select Image Size" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {sizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} textValue={option.label}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{option.icon}</span>
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* DALL-E 3 Specific Options */}
                {model === "dall-e-3" && (
                  <>
                    <Divider />
                    <Grid gutter="md">
                      <Grid.Col span={6}>
                        <div className="space-y-2">
                          <Label htmlFor="quality" className="text-sm font-semibold">
                            Quality
                          </Label>
                          <Select value={quality} onValueChange={setQuality}>
                            <SelectTrigger id="quality">
                              <SelectValue placeholder="Select Quality" />
                            </SelectTrigger>
                            <SelectContent className="z-[100]">
                              {qualityOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} textValue={option.label}>
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-muted-foreground">{option.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <div className="space-y-2">
                          <Label htmlFor="style" className="text-sm font-semibold">
                            Style
                          </Label>
                          <Select value={style} onValueChange={setStyle}>
                            <SelectTrigger id="style">
                              <SelectValue placeholder="Select Style" />
                            </SelectTrigger>
                            <SelectContent className="z-[100]">
                              {styleOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} textValue={option.label}>
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-muted-foreground">{option.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </Grid.Col>
                    </Grid>
                  </>
                )}

                {/* DALL-E 2 Multiple Images */}
                {model === "dall-e-2" && (
                  <>
                    <Divider />
                    <div className="space-y-3">
                      <Label htmlFor="numberOfImages" className="text-base font-semibold">
                        Number of Variations: <span style={{ color: '#489c51' }}>{numberOfImages[0]}</span>
                      </Label>
                      <Slider
                        id="numberOfImages"
                        min={1}
                        max={10}
                        step={1}
                        value={numberOfImages}
                        onValueChange={setNumberOfImages}
                        className="w-full"
                      />
                      <Text size="xs" c="dimmed">
                        Generate multiple variations of your prompt (1-10 images)
                      </Text>
                    </div>
                  </>
                )}

                <Divider />

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  size="lg"
                  className="w-full h-12 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: '#489c51' }}
                  onMouseEnter={(e: React.MouseEvent) => e.currentTarget instanceof HTMLButtonElement && (e.currentTarget.style.backgroundColor = '#3d8a45')}
                  onMouseLeave={(e: React.MouseEvent) => e.currentTarget instanceof HTMLButtonElement && (e.currentTarget.style.backgroundColor = '#489c51')}
                  disabled={status === "processing" || !prompt.trim() || prompt.length < 10}
                >
                  {status === "processing" ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Image...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Image
                    </>
                  )}
                </Button>

                {status === "error" && (
                  <Alert
                    color="red"
                    title="Generation Failed"
                    icon={<Info className="h-4 w-4" />}
                    className="border-red-200 dark:border-red-800"
                  >
                    Please check your prompt and try again. Make sure the description is clear, appropriate, and follows the guidelines.
                  </Alert>
                )}
              </Stack>
            </Paper>

            {/* Tips Section */}
            <Paper
              withBorder
              shadow="lg"
              p="xl"
              mt="xl"
              className="border-slate-200 dark:border-slate-700"
              style={{ backgroundColor: 'rgba(72, 156, 81, 0.05)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(72, 156, 81, 0.2)' }}>
                  <Settings className="h-5 w-5" style={{ color: '#489c51' }} />
                </div>
                <Title order={3} size="h4">Pro Tips for Better Results</Title>
              </div>
              <Stack gap="sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#489c51' }} />
                  <div>
                    <Text size="sm" fw={500} mb={2}>Be Specific</Text>
                    <Text size="xs" c="dimmed">Include details about style, colors, lighting, composition, and mood</Text>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#489c51' }} />
                  <div>
                    <Text size="sm" fw={500} mb={2}>Use Descriptive Words</Text>
                    <Text size="xs" c="dimmed">Try: "vibrant", "minimalist", "cinematic", "watercolor", "photorealistic"</Text>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#489c51' }} />
                  <div>
                    <Text size="sm" fw={500} mb={2}>Mention Composition</Text>
                    <Text size="xs" c="dimmed">Specify: "close-up", "wide angle", "centered", "rule of thirds", "bird's eye view"</Text>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#489c51' }} />
                  <div>
                    <Text size="sm" fw={500} mb={2}>Specify Art Style</Text>
                    <Text size="xs" c="dimmed">Examples: "digital art", "oil painting", "sketch", "3D render", "anime style"</Text>
                  </div>
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
                <Title order={2} size="h3">Generated Image</Title>
              </div>

              {/* Processing Indicator */}
              {status === "processing" && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: '#489c51' }}>
                      <Loader2 className="h-12 w-12 text-white animate-spin" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full animate-ping" style={{ backgroundColor: '#489c51' }}></div>
                  </div>
                  <Text size="lg" fw={600} mb="xs">Generating Your Image</Text>
                  <Text size="sm" c="dimmed" ta="center" maw={300}>
                    This usually takes 10-30 seconds. Please wait while our AI creates your masterpiece...
                  </Text>
                </div>
              )}

              {/* Idle State */}
              {status === "idle" && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-32 h-32 rounded-2xl flex items-center justify-center mb-6 shadow-lg" style={{ backgroundColor: 'rgba(72, 156, 81, 0.1)' }}>
                    <Sparkles className="h-16 w-16" style={{ color: '#489c51' }} />
                  </div>
                  <Text size="xl" fw={600} mb="xs">Ready to Generate</Text>
                  <Text size="sm" c="dimmed" ta="center" maw={300}>
                    Enter a detailed description above and click "Generate Image" to create your AI artwork
                  </Text>
                </div>
              )}

              {/* Success State */}
              {generatedImage && status === "success" && (
                <Stack gap="lg">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shadow-inner" style={{ borderColor: '#489c51' }}>
                    <img
                      src={generatedImage?.startsWith('data:') || generatedImage?.includes('pollinations.ai') 
                        ? generatedImage 
                        : `${BASE_PATH}/api/tools/ai-image-proxy?url=${encodeURIComponent(generatedImage || '')}`}
                      alt="AI Generated"
                      className="w-full h-full object-contain p-2"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        // If proxy fails, try direct URL as last resort
                        const target = e.currentTarget;
                        if (generatedImage && !target.src.includes(generatedImage)) {
                          target.src = generatedImage;
                        }
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="light" size="lg" style={{ backgroundColor: '#489c51', color: '#ffffff' }}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Generated
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleDownload}
                      className="h-12 text-white shadow-lg hover:shadow-xl transition-all"
                      style={{ backgroundColor: '#489c51' }}
                      onMouseEnter={(e: React.MouseEvent) => e.currentTarget instanceof HTMLButtonElement && (e.currentTarget.style.backgroundColor = '#3d8a45')}
                      onMouseLeave={(e: React.MouseEvent) => e.currentTarget instanceof HTMLButtonElement && (e.currentTarget.style.backgroundColor = '#489c51')}
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      size="lg"
                      className="h-12 border-2"
                    >
                      <RefreshCw className="mr-2 h-5 w-5" />
                      New Image
                    </Button>
                  </div>

                  <Alert
                    title="Success!"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    className="border-slate-200 dark:border-slate-700"
                    style={{ backgroundColor: 'rgba(72, 156, 81, 0.1)', borderColor: '#489c51' }}
                  >
                    Your image has been generated successfully. You can download it or generate a new one with a different prompt.
                  </Alert>
                </Stack>
              )}

              {/* Error State */}
              {status === "error" && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                    <Info className="h-12 w-12 text-red-600 dark:text-red-400" />
                  </div>
                  <Text size="lg" fw={600} mb="xs" c="red">Generation Failed</Text>
                  <Text size="sm" c="dimmed" ta="center" maw={300}>
                    Please check your prompt and try again. Make sure it's clear, appropriate, and follows our guidelines.
                  </Text>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  );
}
