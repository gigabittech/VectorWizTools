import { useState, useRef } from "react";
import { Paper, Title, Button, Group, Stack, Text, Badge, Alert, ColorSwatch } from "@mantine/core";
import { Upload, Palette, Copy, Download, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtractedColor {
  hex: string;
  rgb: string;
  hsl: string;
  name: string;
  percentage: number;
}

interface ColorPalette {
  dominant: ExtractedColor[];
  accent: ExtractedColor[];
  neutral: ExtractedColor[];
}

export default function ColorExtractor() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setColorPalette(null);
    }
  };

  const extractColors = async () => {
    if (!selectedImage || !imagePreview) return;

    setIsExtracting(true);

    // Simulate color extraction process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock color extraction results
    const mockPalette: ColorPalette = {
      dominant: [
        { hex: "#1a365d", rgb: "rgb(26, 54, 93)", hsl: "hsl(215, 56%, 23%)", name: "Deep Navy", percentage: 35 },
        { hex: "#2b77e6", rgb: "rgb(43, 119, 230)", hsl: "hsl(216, 79%, 54%)", name: "Bright Blue", percentage: 25 },
        { hex: "#4fd1c7", rgb: "rgb(79, 209, 199)", hsl: "hsl(175, 59%, 56%)", name: "Turquoise", percentage: 20 },
      ],
      accent: [
        { hex: "#10b981", rgb: "rgb(16, 185, 129)", hsl: "hsl(160, 84%, 39%)", name: "Emerald Green", percentage: 8 },
        { hex: "#f59e0b", rgb: "rgb(245, 158, 11)", hsl: "hsl(38, 92%, 50%)", name: "Amber", percentage: 6 },
        { hex: "#ef4444", rgb: "rgb(239, 68, 68)", hsl: "hsl(0, 84%, 60%)", name: "Red", percentage: 4 },
      ],
      neutral: [
        { hex: "#374151", rgb: "rgb(55, 65, 81)", hsl: "hsl(220, 19%, 27%)", name: "Cool Gray", percentage: 2 },
        { hex: "#9ca3af", rgb: "rgb(156, 163, 175)", hsl: "hsl(220, 13%, 65%)", name: "Light Gray", percentage: 1 },
      ],
    };

    setColorPalette(mockPalette);
    setIsExtracting(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    });
  };

  const exportPalette = (format: 'css' | 'sass' | 'json') => {
    if (!colorPalette) return;

    const allColors = [...colorPalette.dominant, ...colorPalette.accent, ...colorPalette.neutral];
    let exportContent = "";

    switch (format) {
      case 'css':
        exportContent = ":root {\n" + 
          allColors.map((color, index) => `  --color-${index + 1}: ${color.hex};`).join('\n') + 
          "\n}";
        break;
      case 'sass':
        exportContent = allColors.map((color, index) => `$color-${index + 1}: ${color.hex};`).join('\n');
        break;
      case 'json':
        exportContent = JSON.stringify(allColors.map(color => ({
          name: color.name,
          hex: color.hex,
          rgb: color.rgb,
          hsl: color.hsl
        })), null, 2);
        break;
    }

    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-palette.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ColorCard = ({ color }: { color: ExtractedColor }) => (
    <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
      <Group gap="md">
        <ColorSwatch color={color.hex} size={40} />
        <div className="flex-1">
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm">{color.name}</Text>
            <Badge variant="light" color="blue" size="sm">{color.percentage}%</Badge>
          </Group>
          <Stack gap="xs">
            <Group gap="xs">
              <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>{color.hex}</Text>
              <Button size="xs" variant="subtle" onClick={() => copyToClipboard(color.hex, 'HEX')}>
                <Copy size={12} />
              </Button>
            </Group>
            <Group gap="xs">
              <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>{color.rgb}</Text>
              <Button size="xs" variant="subtle" onClick={() => copyToClipboard(color.rgb, 'RGB')}>
                <Copy size={12} />
              </Button>
            </Group>
            <Group gap="xs">
              <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>{color.hsl}</Text>
              <Button size="xs" variant="subtle" onClick={() => copyToClipboard(color.hsl, 'HSL')}>
                <Copy size={12} />
              </Button>
            </Group>
          </Stack>
        </div>
      </Group>
    </Paper>
  );

  return (
    <div className="space-y-8">
      <Paper withBorder shadow="md" p="xl" data-testid="color-extractor">
        <div className="space-y-6">
          <Title order={3} className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Extract Color Palette</span>
          </Title>

          <div className="space-y-4">
            <div>
              <Text size="sm" fw={500} mb="xs">Upload Image</Text>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors"
                data-testid="image-input"
              />
            </div>

            {imagePreview && (
              <div className="text-center">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                  data-testid="image-preview"
                />
              </div>
            )}

            {selectedImage && (
              <Button
                fullWidth
                size="lg"
                color="green"
                onClick={extractColors}
                loading={isExtracting}
                data-testid="extract-colors"
              >
                {isExtracting ? "Extracting Colors..." : "Extract Color Palette"}
              </Button>
            )}
          </div>
        </div>
      </Paper>

      {isExtracting && (
        <Paper withBorder shadow="md" p="xl">
          <Group gap="md">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center animate-pulse">
              <Palette className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <Text fw={500}>Analyzing Color Distribution...</Text>
              <Text size="sm" c="dimmed">Processing image and extracting dominant colors</Text>
            </div>
          </Group>
        </Paper>
      )}

      {colorPalette && (
        <div className="space-y-6">
          <Paper withBorder shadow="md" p="xl">
            <Group justify="space-between" align="center" mb="lg">
              <Title order={3}>Extracted Color Palette</Title>
              <Group gap="xs">
                <Button size="sm" variant="outline" onClick={() => exportPalette('css')} data-testid="export-css">
                  <Download size={14} className="mr-1" />
                  CSS
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportPalette('sass')} data-testid="export-sass">
                  <Download size={14} className="mr-1" />
                  SASS
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportPalette('json')} data-testid="export-json">
                  <Download size={14} className="mr-1" />
                  JSON
                </Button>
              </Group>
            </Group>

            <div className="space-y-6" data-testid="color-palette-results">
              <div>
                <Title order={4} mb="md" c="blue">Dominant Colors</Title>
                <Stack gap="md">
                  {colorPalette.dominant.map((color, index) => (
                    <ColorCard key={`dominant-${index}`} color={color} />
                  ))}
                </Stack>
              </div>

              <div>
                <Title order={4} mb="md" c="green">Accent Colors</Title>
                <Stack gap="md">
                  {colorPalette.accent.map((color, index) => (
                    <ColorCard key={`accent-${index}`} color={color} />
                  ))}
                </Stack>
              </div>

              <div>
                <Title order={4} mb="md" c="gray">Neutral Colors</Title>
                <Stack gap="md">
                  {colorPalette.neutral.map((color, index) => (
                    <ColorCard key={`neutral-${index}`} color={color} />
                  ))}
                </Stack>
              </div>
            </div>
          </Paper>

          <Alert icon={<CheckCircle size={16} />} color="green">
            <Text size="sm">
              <strong>Professional Tip:</strong> For brand consistency across all your marketing materials, 
              consider our logo vectorization service to ensure these colors are perfectly preserved in scalable formats.
            </Text>
          </Alert>
        </div>
      )}

      {!selectedImage && (
        <Alert icon={<AlertCircle size={16} />} color="blue">
          <Text size="sm">
            <strong>How it works:</strong> Upload any image to extract its color palette. Perfect for brand analysis, 
            design inspiration, or creating consistent color schemes from existing graphics.
          </Text>
        </Alert>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}