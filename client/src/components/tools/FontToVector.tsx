import { useState } from "react";
import { Paper, Title, Button, TextInput, Select, Group, Stack, Text, Badge, Alert, Textarea } from "@mantine/core";
import { Type, Download, Palette, AlertCircle, CheckCircle, FileText } from "lucide-react";

interface FontConversionResult {
  text: string;
  font: string;
  outputFormat: string;
  estimatedSize: string;
  downloadUrl: string;
  features: string[];
}

export default function FontToVector() {
  const [inputText, setInputText] = useState("");
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [fontSize, setFontSize] = useState("72");
  const [outputFormat, setOutputFormat] = useState("svg");
  const [strokeWidth, setStrokeWidth] = useState("0");
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<FontConversionResult | null>(null);

  const fontOptions = [
    { value: "Arial", label: "Arial" },
    { value: "Helvetica", label: "Helvetica" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Georgia", label: "Georgia" },
    { value: "Verdana", label: "Verdana" },
    { value: "Impact", label: "Impact" },
    { value: "Comic Sans MS", label: "Comic Sans MS" },
    { value: "Trebuchet MS", label: "Trebuchet MS" },
    { value: "Courier New", label: "Courier New (Monospace)" },
  ];

  const formatOptions = [
    { value: "svg", label: "SVG (Web Optimized)" },
    { value: "ai", label: "Adobe Illustrator (AI)" },
    { value: "eps", label: "EPS (Print Ready)" },
    { value: "pdf", label: "PDF (Universal)" },
  ];

  const fontSizeOptions = [
    { value: "12", label: "12pt (Small)" },
    { value: "18", label: "18pt (Body Text)" },
    { value: "24", label: "24pt (Heading)" },
    { value: "36", label: "36pt (Large Heading)" },
    { value: "48", label: "48pt (Display)" },
    { value: "72", label: "72pt (Poster)" },
    { value: "96", label: "96pt (Large Display)" },
    { value: "144", label: "144pt (Extra Large)" },
  ];

  const convertToVector = async () => {
    if (!inputText.trim()) return;

    setIsConverting(true);

    // Simulate conversion process
    await new Promise(resolve => setTimeout(resolve, 2000));

    const estimatedSizeKB = Math.max(1, inputText.length * 0.5 + parseInt(fontSize) * 0.1);
    
    const features = ["Scalable text", "Editable paths", "No font dependencies"];
    if (strokeWidth !== "0") features.push("Custom stroke");
    if (outputFormat === "svg") features.push("Web compatible");
    if (outputFormat === "ai" || outputFormat === "eps") features.push("Professional editing");

    const mockResult: FontConversionResult = {
      text: inputText,
      font: selectedFont,
      outputFormat: outputFormat.toUpperCase(),
      estimatedSize: `${estimatedSizeKB.toFixed(1)} KB`,
      downloadUrl: `#download-${outputFormat}`,
      features
    };

    setResult(mockResult);
    setIsConverting(false);
  };

  const presetTexts = [
    "Company Logo",
    "Brand Name",
    "Your Text Here",
    "SALE 50% OFF",
    "Welcome",
    "Thank You",
    "Coming Soon",
    "Made with ❤️"
  ];

  return (
    <div className="space-y-8">
      <Paper withBorder shadow="md" p="xl" data-testid="font-to-vector">
        <div className="space-y-6">
          <Title order={3} className="flex items-center space-x-2">
            <Type className="h-5 w-5" />
            <span>Convert Text to Vector</span>
          </Title>

          <div className="space-y-4">
            <div>
              <Textarea
                label="Text to Convert"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter your text here..."
                minRows={3}
                maxRows={6}
                data-testid="text-input"
              />
              <Group gap="xs" mt="xs">
                <Text size="xs" c="dimmed">Quick presets:</Text>
                {presetTexts.slice(0, 4).map((preset, index) => (
                  <Button
                    key={index}
                    size="xs"
                    variant="subtle"
                    onClick={() => setInputText(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </Group>
            </div>

            <Group grow>
              <Select
                label="Font Family"
                value={selectedFont}
                onChange={(value) => setSelectedFont(value || "Arial")}
                data={fontOptions}
                data-testid="font-select"
              />
              <Select
                label="Font Size"
                value={fontSize}
                onChange={(value) => setFontSize(value || "72")}
                data={formatOptions}
                data-testid="font-size-select"
              />
            </Group>

            <Group grow>
              <Select
                label="Output Format"
                value={outputFormat}
                onChange={(value) => setOutputFormat(value || "svg")}
                data={formatOptions}
                data-testid="output-format-select"
              />
              <TextInput
                label="Stroke Width (optional)"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(e.target.value)}
                placeholder="0"
                type="number"
                min="0"
                max="10"
                step="0.5"
                data-testid="stroke-width-input"
              />
            </Group>

            <Button
              fullWidth
              size="lg"
              color="green"
              onClick={convertToVector}
              loading={isConverting}
              disabled={!inputText.trim()}
              data-testid="convert-font"
            >
              {isConverting ? "Converting to Vector..." : "Convert Text to Vector"}
            </Button>
          </div>
        </div>
      </Paper>

      {isConverting && (
        <Paper withBorder shadow="md" p="xl">
          <Group gap="md">
            <Type className="h-5 w-5 text-blue-600 animate-pulse" />
            <div>
              <Text fw={500}>Converting Text to Vector Paths...</Text>
              <Text size="sm" c="dimmed">
                Creating editable vector outlines from "{inputText.slice(0, 20)}..."
              </Text>
            </div>
          </Group>
        </Paper>
      )}

      {result && (
        <Paper withBorder shadow="md" p="xl">
          <Title order={3} mb="lg">Conversion Results</Title>
          <div className="space-y-6" data-testid="conversion-results">
            <Paper p="lg" className="bg-gray-50 dark:bg-gray-800">
              <Group justify="space-between" align="center" mb="md">
                <div>
                  <Text size="lg" fw={500} mb="xs">"{result.text}"</Text>
                  <Text size="sm" c="dimmed">
                    {result.font} → {result.outputFormat} ({result.estimatedSize})
                  </Text>
                </div>
                <Badge variant="light" color="green" size="lg">
                  Vector Ready
                </Badge>
              </Group>

              <div>
                <Text size="sm" fw={500} mb="xs">Features:</Text>
                <Group gap="xs">
                  {result.features.map((feature, index) => (
                    <Badge key={index} variant="outline" size="sm">
                      {feature}
                    </Badge>
                  ))}
                </Group>
              </div>
            </Paper>

            <Group justify="center">
              <Button
                leftSection={<Download size={16} />}
                color="green"
                size="lg"
                data-testid="download-vector-text"
              >
                Download Vector Text
              </Button>
            </Group>
          </div>
        </Paper>
      )}

      <Paper withBorder shadow="md" p="xl">
        <Title order={3} mb="lg">Text to Vector Applications</Title>
        <Stack gap="lg">
          <div>
            <Group gap="sm" mb="md">
              <FileText className="h-5 w-5 text-blue-600" />
              <Title order={4}>Logo Creation</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Convert company names and slogans into scalable vector logos that work perfectly 
              at any size, from business cards to billboards.
            </Text>
          </div>
          <div>
            <Group gap="sm" mb="md">
              <Palette className="h-5 w-5 text-green-600" />
              <Title order={4}>Sign Making</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Create vector text for vinyl cutting, laser engraving, and CNC machines. 
              Perfect for custom signs and promotional materials.
            </Text>
          </div>
          <div>
            <Group gap="sm" mb="md">
              <Type className="h-5 w-5 text-purple-600" />
              <Title order={4}>Font Independence</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Share designs without worrying about font availability. Vector text ensures 
              consistent appearance across all devices and software.
            </Text>
          </div>
        </Stack>
      </Paper>

      <Paper withBorder shadow="md" p="xl">
        <Title order={3} mb="lg">Best Practices for Text Vectorization</Title>
        <Stack gap="sm">
          <Group gap="xs">
            <CheckCircle size={16} className="text-green-500" />
            <Text size="sm">Use larger font sizes for better detail preservation</Text>
          </Group>
          <Group gap="xs">
            <CheckCircle size={16} className="text-green-500" />
            <Text size="sm">Choose fonts with clear, distinct letterforms</Text>
          </Group>
          <Group gap="xs">
            <CheckCircle size={16} className="text-green-500" />
            <Text size="sm">Avoid overly decorative fonts for optimal conversion</Text>
          </Group>
          <Group gap="xs">
            <CheckCircle size={16} className="text-green-500" />
            <Text size="sm">Test readability at small sizes before finalizing</Text>
          </Group>
          <Group gap="xs">
            <CheckCircle size={16} className="text-green-500" />
            <Text size="sm">Keep original text layers for future edits</Text>
          </Group>
        </Stack>
      </Paper>

      <Alert icon={<AlertCircle size={16} />} color="blue">
        <Text size="sm">
          <strong>Note:</strong> Vector text conversion creates outlined paths that can't be edited as text. 
          Always keep your original text version for future modifications.
        </Text>
      </Alert>
    </div>
  );
}