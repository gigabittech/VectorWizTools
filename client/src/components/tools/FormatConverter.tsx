import { useState } from "react";
import { Paper, Title, Button, Select, TextInput, Group, Stack, Text, Badge, Alert, Progress } from "@mantine/core";
import { Upload, Download, FileImage, AlertCircle, CheckCircle } from "lucide-react";

interface ConversionResult {
  originalFormat: string;
  targetFormat: string;
  originalSize: string;
  convertedSize: string;
  downloadUrl: string;
  quality: string;
}

export default function FormatConverter() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("");
  const [quality, setQuality] = useState<string>("high");
  const [isConverting, setIsConverting] = useState(false);
  const [results, setResults] = useState<ConversionResult[]>([]);

  const supportedFormats = [
    { value: "svg", label: "SVG (Vector Graphics)", type: "vector" },
    { value: "png", label: "PNG (Transparent Background)", type: "raster" },
    { value: "jpg", label: "JPG/JPEG (Compressed)", type: "raster" },
    { value: "webp", label: "WebP (Modern Web Format)", type: "raster" },
    { value: "pdf", label: "PDF (Print Ready)", type: "vector" },
    { value: "eps", label: "EPS (Professional Print)", type: "vector" },
  ];

  const qualityOptions = [
    { value: "high", label: "High Quality (Best for Print)" },
    { value: "medium", label: "Medium Quality (Balanced)" },
    { value: "low", label: "Low Quality (Smallest Size)" },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const simulateConversion = async () => {
    if (!targetFormat || selectedFiles.length === 0) return;

    setIsConverting(true);
    setResults([]);

    // Simulate conversion process
    for (let i = 0; i < selectedFiles.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const file = selectedFiles[i];
      const originalFormat = file.name.split('.').pop()?.toUpperCase() || "UNKNOWN";
      const originalSize = `${(file.size / 1024).toFixed(1)} KB`;
      
      // Simulate conversion result
      const mockResult: ConversionResult = {
        originalFormat,
        targetFormat: targetFormat.toUpperCase(),
        originalSize,
        convertedSize: `${(file.size * 0.8 / 1024).toFixed(1)} KB`,
        downloadUrl: `#download-${file.name}`,
        quality: quality === "high" ? "Excellent" : quality === "medium" ? "Good" : "Fair"
      };

      setResults(prev => [...prev, mockResult]);
    }

    setIsConverting(false);
  };

  const getFormatBadgeColor = (format: string) => {
    const formatData = supportedFormats.find(f => f.value === format.toLowerCase());
    return formatData?.type === "vector" ? "green" : "blue";
  };

  return (
    <div className="space-y-8">
      <Paper withBorder shadow="md" p="xl" data-testid="format-converter">
        <div className="space-y-6">
          <Title order={3} className="flex items-center space-x-2">
            <FileImage className="h-5 w-5" />
            <span>Convert Image Formats</span>
          </Title>

          <div className="space-y-4">
            <div>
              <Text size="sm" fw={500} mb="xs">Select Files to Convert</Text>
              <input
                type="file"
                multiple
                accept="image/*,.svg,.eps,.pdf"
                onChange={handleFileSelect}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors"
                data-testid="file-input"
              />
              {selectedFiles.length > 0 && (
                <Text size="xs" c="dimmed" mt="xs">
                  {selectedFiles.length} file(s) selected
                </Text>
              )}
            </div>

            <Select
              label="Target Format"
              placeholder="Choose output format"
              value={targetFormat}
              onChange={(value) => setTargetFormat(value || "")}
              data={supportedFormats.map(f => ({ 
                value: f.value, 
                label: f.label,
                group: f.type === "vector" ? "Vector Formats" : "Raster Formats"
              }))}
              data-testid="target-format-select"
            />

            <Select
              label="Quality Settings"
              value={quality}
              onChange={(value) => setQuality(value || "high")}
              data={qualityOptions}
              data-testid="quality-select"
            />

            <Button
              fullWidth
              size="lg"
              color="green"
              onClick={simulateConversion}
              loading={isConverting}
              disabled={!targetFormat || selectedFiles.length === 0}
              data-testid="convert-files"
            >
              {isConverting ? "Converting Files..." : `Convert to ${targetFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </Paper>

      {isConverting && (
        <Paper withBorder shadow="md" p="xl">
          <Title order={4} mb="md">Converting Files...</Title>
          <Progress value={(results.length / selectedFiles.length) * 100} mb="sm" />
          <Text size="sm" c="dimmed">
            Processed {results.length} of {selectedFiles.length} files
          </Text>
        </Paper>
      )}

      {results.length > 0 && (
        <Paper withBorder shadow="md" p="xl">
          <Title order={3} mb="lg">Conversion Results</Title>
          <Stack gap="md" data-testid="conversion-results">
            {results.map((result, index) => (
              <Paper key={index} p="md" className="bg-gray-50 dark:bg-gray-800">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge variant="light" color={getFormatBadgeColor(result.originalFormat)}>
                        {result.originalFormat}
                      </Badge>
                      <Text size="sm">→</Text>
                      <Badge variant="light" color={getFormatBadgeColor(result.targetFormat)}>
                        {result.targetFormat}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Size: {result.originalSize} → {result.convertedSize}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Quality: {result.quality}
                    </Text>
                  </div>
                  <Button size="sm" variant="outline" data-testid={`download-${index}`}>
                    <Download size={16} className="mr-1" />
                    Download
                  </Button>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      {!isConverting && selectedFiles.length === 0 && (
        <Alert icon={<AlertCircle size={16} />} color="blue">
          <Text size="sm">
            <strong>Pro Tip:</strong> For best results with logo conversions, consider our professional vectorization service 
            for pixel-perfect results that scale infinitely.
          </Text>
        </Alert>
      )}
    </div>
  );
}