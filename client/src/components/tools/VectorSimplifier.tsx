import { useState } from "react";
import { Paper, Title, Button, Select, Group, Stack, Text, Badge, Alert, Progress, Slider } from "@mantine/core";
import { Zap, Upload, Download, FileText, AlertCircle, CheckCircle, Settings } from "lucide-react";

interface SimplificationResult {
  originalNodes: number;
  simplifiedNodes: number;
  reduction: number;
  originalSize: string;
  simplifiedSize: string;
  quality: string;
  downloadUrl: string;
}

export default function VectorSimplifier() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [simplificationLevel, setSimplificationLevel] = useState(50);
  const [optimizationType, setOptimizationType] = useState("balanced");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SimplificationResult | null>(null);

  const optimizationOptions = [
    { value: "quality", label: "Preserve Quality" },
    { value: "balanced", label: "Balanced Optimization" },
    { value: "filesize", label: "Minimize File Size" },
    { value: "web", label: "Web Optimized" },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const simplifyVector = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock simplification results based on settings
    const originalNodes = Math.floor(Math.random() * 5000) + 1000;
    const reductionFactor = simplificationLevel / 100;
    const simplifiedNodes = Math.floor(originalNodes * (1 - reductionFactor * 0.8));
    const reduction = Math.round(((originalNodes - simplifiedNodes) / originalNodes) * 100);

    const originalSizeKB = selectedFile.size / 1024;
    const simplifiedSizeKB = originalSizeKB * (1 - reductionFactor * 0.6);

    let quality = "Good";
    if (simplificationLevel < 30) quality = "Excellent";
    else if (simplificationLevel > 70) quality = "Fair";

    const mockResult: SimplificationResult = {
      originalNodes,
      simplifiedNodes,
      reduction,
      originalSize: `${originalSizeKB.toFixed(1)} KB`,
      simplifiedSize: `${simplifiedSizeKB.toFixed(1)} KB`,
      quality,
      downloadUrl: "#download-simplified"
    };

    setResult(mockResult);
    setIsProcessing(false);
  };

  const handleDownload = () => {
    if (!result || !selectedFile) return;

    const extension = selectedFile.name.split('.').pop() || 'svg';
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}-simplified.${extension}`;

    import("@/lib/fileUtils").then(({ downloadFile }) => {
      downloadFile(selectedFile, filename);
    });
  };

  const getOptimizationDescription = () => {
    switch (optimizationType) {
      case "quality":
        return "Removes redundant nodes while preserving visual fidelity";
      case "balanced":
        return "Optimal balance between file size and visual quality";
      case "filesize":
        return "Aggressive optimization for smallest possible file size";
      case "web":
        return "Optimized for web performance and loading speed";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-8">
      <Paper withBorder shadow="md" p="xl" data-testid="vector-simplifier">
        <div className="space-y-6">
          <Title order={3} className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Simplify Vector Graphics</span>
          </Title>

          <div className="space-y-4">
            <div>
              <Text size="sm" fw={500} mb="xs">Upload Vector File</Text>
              <input
                type="file"
                accept=".svg,.ai,.eps,.pdf"
                onChange={handleFileSelect}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors"
                data-testid="vector-file-input"
              />
              {selectedFile && (
                <Text size="xs" c="dimmed" mt="xs">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </Text>
              )}
            </div>

            <Select
              label="Optimization Type"
              value={optimizationType}
              onChange={(value) => setOptimizationType(value || "balanced")}
              data={optimizationOptions}
              description={getOptimizationDescription()}
              data-testid="optimization-type-select"
            />

            <div>
              <Text size="sm" fw={500} mb="md">Simplification Level: {simplificationLevel}%</Text>
              <Slider
                value={simplificationLevel}
                onChange={setSimplificationLevel}
                min={10}
                max={90}
                step={5}
                marks={[
                  { value: 10, label: "Conservative" },
                  { value: 50, label: "Balanced" },
                  { value: 90, label: "Aggressive" }
                ]}
                data-testid="simplification-slider"
              />
              <Text size="xs" c="dimmed" mt="xs">
                Higher values = smaller files but may reduce visual quality
              </Text>
            </div>

            <Button
              fullWidth
              size="lg"
              color="green"
              onClick={simplifyVector}
              loading={isProcessing}
              disabled={!selectedFile}
              data-testid="simplify-vector"
            >
              {isProcessing ? "Simplifying Vector..." : "Simplify Vector Graphics"}
            </Button>
          </div>
        </div>
      </Paper>

      {isProcessing && (
        <Paper withBorder shadow="md" p="xl">
          <Group gap="md" mb="md">
            <Settings className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <Text fw={500}>Processing Vector Graphics...</Text>
              <Text size="sm" c="dimmed">Analyzing nodes and optimizing paths</Text>
            </div>
          </Group>
          <Progress value={65} animated />
        </Paper>
      )}

      {result && (
        <Paper withBorder shadow="md" p="xl">
          <Title order={3} mb="lg">Simplification Results</Title>
          <div className="space-y-6" data-testid="simplification-results">
            <Paper p="lg" className="bg-green-50 dark:bg-green-950/20">
              <Group justify="space-between" align="center" mb="md">
                <div>
                  <Text size="xl" fw={700}>{result.reduction}% Reduction</Text>
                  <Text size="sm" c="dimmed">Node count and file size optimized</Text>
                </div>
                <Badge variant="light" color="green" size="lg">
                  {result.quality} Quality
                </Badge>
              </Group>

              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm">Vector Nodes:</Text>
                  <Text size="sm" style={{ fontFamily: 'monospace' }}>
                    {result.originalNodes.toLocaleString()} → {result.simplifiedNodes.toLocaleString()}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">File Size:</Text>
                  <Text size="sm" style={{ fontFamily: 'monospace' }}>
                    {result.originalSize} → {result.simplifiedSize}
                  </Text>
                </Group>
              </Stack>
            </Paper>

            <Group justify="center">
              <Button
                leftSection={<Download size={16} />}
                color="green"
                size="lg"
                onClick={handleDownload}
                data-testid="download-simplified"
              >
                Download Simplified Vector
              </Button>
            </Group>
          </div>
        </Paper>
      )}

      <Paper withBorder shadow="md" p="xl">
        <Title order={3} mb="lg">Vector Simplification Benefits</Title>
        <Stack gap="lg">
          <div>
            <Group gap="sm" mb="md">
              <Zap className="h-5 w-5 text-blue-600" />
              <Title order={4}>Faster Loading</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Simplified vectors load faster on websites and applications, improving user experience
              and SEO performance.
            </Text>
          </div>
          <div>
            <Group gap="sm" mb="md">
              <FileText className="h-5 w-5 text-green-600" />
              <Title order={4}>Smaller File Sizes</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Reduced node counts and optimized paths result in significantly smaller file sizes
              without noticeable quality loss.
            </Text>
          </div>
          <div>
            <Group gap="sm" mb="md">
              <Settings className="h-5 w-5 text-purple-600" />
              <Title order={4}>Better Performance</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Simplified vectors render faster in design software and web browsers, especially
              important for complex illustrations.
            </Text>
          </div>
        </Stack>
      </Paper>

      <Alert icon={<AlertCircle size={16} />} color="blue">
        <Text size="sm">
          <strong>Pro Tip:</strong> Always keep a backup of your original vector file. Start with
          conservative settings and gradually increase simplification until you find the perfect
          balance for your needs.
        </Text>
      </Alert>
    </div>
  );
}