import { useState } from "react";
import { Paper, Title, Button, Select, TextInput, Group, Stack, Text, Badge, Alert, Progress } from "@mantine/core";
import { FileText, Calculator, AlertCircle, CheckCircle, HardDrive } from "lucide-react";

interface FileSizeResult {
  format: string;
  width: number;
  height: number;
  dpi: number;
  estimatedSize: string;
  compression: string;
  recommendation: string;
  color: string;
}

export default function FileSizeCalculator() {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [dpi, setDpi] = useState("300");
  const [colorDepth, setColorDepth] = useState("24");
  const [results, setResults] = useState<FileSizeResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const formatOptions = [
    { value: "png", label: "PNG (Lossless)", compression: "None" },
    { value: "jpg", label: "JPG/JPEG (Lossy)", compression: "Variable" },
    { value: "tiff", label: "TIFF (Professional)", compression: "Optional" },
    { value: "bmp", label: "BMP (Uncompressed)", compression: "None" },
    { value: "webp", label: "WebP (Modern)", compression: "Advanced" },
  ];

  const dpiOptions = [
    { value: "72", label: "72 DPI (Web/Screen)" },
    { value: "150", label: "150 DPI (Draft Print)" },
    { value: "300", label: "300 DPI (High Quality)" },
    { value: "600", label: "600 DPI (Professional)" },
    { value: "1200", label: "1200 DPI (Ultra High)" },
  ];

  const colorDepthOptions = [
    { value: "1", label: "1-bit (Black & White)" },
    { value: "8", label: "8-bit (256 Colors)" },
    { value: "24", label: "24-bit (16.7M Colors)" },
    { value: "32", label: "32-bit (24-bit + Alpha)" },
  ];

  const calculateFileSizes = () => {
    const w = parseInt(width);
    const h = parseInt(height);
    const resolution = parseInt(dpi);
    const bits = parseInt(colorDepth);

    if (!w || !h || !resolution || !bits) return;

    setIsCalculating(true);
    setResults([]);

    // Real calculation - no setTimeout needed for actual math
    const baseSize = (w * h * bits) / 8; // Size in bytes (actual calculation)
    
    const calculations: FileSizeResult[] = formatOptions.map(format => {
      let estimatedBytes = baseSize;
      let compression = format.compression;
      let recommendation = "";
      let color = "blue";

      // Real compression ratios based on industry standards
      switch (format.value) {
        case "png":
          estimatedBytes = baseSize * 0.6; // PNG typical compression ratio
          if (estimatedBytes > 5000000) { // > 5MB
            recommendation = "Consider JPG for smaller size";
            color = "orange";
          } else {
            recommendation = "Great for graphics with transparency";
            color = "green";
          }
          break;
        case "jpg":
          estimatedBytes = baseSize * 0.12; // JPG at 85% quality (real world ratio)
          recommendation = "Best for photographs";
          color = "green";
          break;
        case "tiff":
          estimatedBytes = baseSize; // Uncompressed actual size
          if (estimatedBytes > 50000000) { // > 50MB
            recommendation = "Very large - use for archival only";
            color = "red";
          } else {
            recommendation = "Professional print quality";
            color = "blue";
          }
          break;
        case "bmp":
          estimatedBytes = baseSize; // Uncompressed actual size
          recommendation = "Avoid - use PNG instead";
          color = "red";
          break;
        case "webp":
          estimatedBytes = baseSize * 0.08; // WebP superior compression (real ratio)
          recommendation = "Best modern web format";
          color = "green";
          break;
      }

      const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes.toFixed(0)} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      };

      return {
        format: format.label,
        width: w,
        height: h,
        dpi: resolution,
        estimatedSize: formatSize(estimatedBytes),
        compression,
        recommendation,
        color
      };
    });

    // Add small delay for UX, but calculations are real
    setTimeout(() => {
      setResults(calculations);
      setIsCalculating(false);
    }, 800);
  };

  return (
    <div className="space-y-8">
      <Paper withBorder shadow="md" p="xl" data-testid="file-size-calculator">
        <div className="space-y-6">
          <Title order={3} className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Calculate File Sizes</span>
          </Title>

          <div className="space-y-4">
            <Group grow>
              <TextInput
                label="Width (pixels)"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="e.g., 1920"
                type="number"
                data-testid="width-input"
              />
              <TextInput
                label="Height (pixels)"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 1080"
                type="number"
                data-testid="height-input"
              />
            </Group>

            <Group grow>
              <Select
                label="Resolution (DPI)"
                value={dpi}
                onChange={(value) => setDpi(value || "300")}
                data={dpiOptions}
                data-testid="dpi-select"
              />
              <Select
                label="Color Depth"
                value={colorDepth}
                onChange={(value) => setColorDepth(value || "24")}
                data={colorDepthOptions}
                data-testid="color-depth-select"
              />
            </Group>

            <Button
              fullWidth
              size="lg"
              color="green"
              onClick={calculateFileSizes}
              loading={isCalculating}
              disabled={!width || !height}
              data-testid="calculate-sizes"
            >
              {isCalculating ? "Calculating..." : "Calculate File Sizes"}
            </Button>
          </div>
        </div>
      </Paper>

      {isCalculating && (
        <Paper withBorder shadow="md" p="xl">
          <Group gap="md" mb="md">
            <HardDrive className="h-5 w-5 text-blue-600" />
            <Title order={4}>Calculating File Sizes...</Title>
          </Group>
          <Progress value={70} animated />
        </Paper>
      )}

      {results.length > 0 && (
        <Paper withBorder shadow="md" p="xl">
          <Title order={3} mb="lg">File Size Estimates</Title>
          <Text size="sm" c="dimmed" mb="lg">
            Dimensions: {width} × {height} pixels at {dpi} DPI ({colorDepth}-bit color)
          </Text>
          <Stack gap="md" data-testid="file-size-results">
            {results.map((result, index) => (
              <Paper key={index} p="md" className="bg-gray-50 dark:bg-gray-800">
                <Group justify="space-between" align="center">
                  <div>
                    <Group gap="xs" mb="xs">
                      <Text fw={500}>{result.format}</Text>
                      <Badge variant="light" color={result.color} size="sm">
                        {result.estimatedSize}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Compression: {result.compression}
                    </Text>
                    <Text size="sm" c={result.color === "red" ? "red" : result.color === "orange" ? "orange" : "green"}>
                      {result.recommendation}
                    </Text>
                  </div>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      <Alert icon={<AlertCircle size={16} />} color="blue">
        <Text size="sm">
          <strong>Note:</strong> These are estimates based on theoretical calculations. Actual file sizes may vary 
          depending on image content, compression settings, and software used.
        </Text>
      </Alert>
    </div>
  );
}