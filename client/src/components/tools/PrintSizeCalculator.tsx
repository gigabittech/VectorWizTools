import { useState } from "react";
import { Paper, Title, Button, Select, TextInput, Group, Stack, Text, Badge, Alert, Tabs } from "@mantine/core";
import { Ruler, Calculator, AlertCircle, CheckCircle, Printer } from "lucide-react";

interface PrintResult {
  maxWidth: number;
  maxHeight: number;
  recommendedDPI: number;
  quality: string;
  suitableFor: string[];
  color: string;
}

export default function PrintSizeCalculator() {
  const [imageWidth, setImageWidth] = useState("");
  const [imageHeight, setImageHeight] = useState("");
  const [targetDPI, setTargetDPI] = useState("300");
  const [units, setUnits] = useState("inches");
  const [results, setResults] = useState<PrintResult[]>([]);

  const dpiOptions = [
    { value: "72", label: "72 DPI (Web/Digital)" },
    { value: "150", label: "150 DPI (Draft/Large Format)" },
    { value: "300", label: "300 DPI (High Quality Print)" },
    { value: "600", label: "600 DPI (Professional Print)" },
  ];

  const unitOptions = [
    { value: "inches", label: "Inches" },
    { value: "cm", label: "Centimeters" },
    { value: "mm", label: "Millimeters" },
  ];

  const printSizes = [
    { name: "Business Card", width: 3.5, height: 2, minDPI: 300 },
    { name: "Postcard (4×6)", width: 6, height: 4, minDPI: 300 },
    { name: "Letter (8.5×11)", width: 11, height: 8.5, minDPI: 300 },
    { name: "A4 (210×297mm)", width: 11.7, height: 8.3, minDPI: 300 },
    { name: "Poster (18×24)", width: 24, height: 18, minDPI: 150 },
    { name: "Banner (36×48)", width: 48, height: 36, minDPI: 100 },
  ];

  const calculatePrintSize = () => {
    const w = parseInt(imageWidth);
    const h = parseInt(imageHeight);
    const dpi = parseInt(targetDPI);

    if (!w || !h || !dpi) return;

    const maxWidthInches = w / dpi;
    const maxHeightInches = h / dpi;

    const convertFromInches = (inches: number) => {
      switch (units) {
        case "cm": return inches * 2.54;
        case "mm": return inches * 25.4;
        default: return inches;
      }
    };

    const calculations: PrintResult[] = [
      {
        maxWidth: convertFromInches(maxWidthInches),
        maxHeight: convertFromInches(maxHeightInches),
        recommendedDPI: dpi,
        quality: dpi >= 300 ? "Excellent" : dpi >= 150 ? "Good" : "Fair",
        suitableFor: getSuitableApplications(dpi),
        color: dpi >= 300 ? "green" : dpi >= 150 ? "blue" : "orange"
      }
    ];

    setResults(calculations);
  };

  const getSuitableApplications = (dpi: number): string[] => {
    if (dpi >= 600) return ["Professional printing", "Fine art", "Medical imaging", "Technical drawings"];
    if (dpi >= 300) return ["Business cards", "Brochures", "Magazines", "High-quality prints"];
    if (dpi >= 150) return ["Posters", "Large format prints", "Banners", "Trade show displays"];
    return ["Digital displays", "Web graphics", "Email attachments"];
  };

  const checkPrintSizeCompatibility = () => {
    if (!imageWidth || !imageHeight) return [];

    const w = parseInt(imageWidth);
    const h = parseInt(imageHeight);

    return printSizes.map(size => {
      const requiredWidth = size.width * size.minDPI;
      const requiredHeight = size.height * size.minDPI;
      const compatible = w >= requiredWidth && h >= requiredHeight;
      const actualDPI = Math.min(w / size.width, h / size.height);

      return {
        ...size,
        compatible,
        actualDPI: Math.round(actualDPI),
        quality: actualDPI >= 300 ? "Excellent" : actualDPI >= 150 ? "Good" : "Poor"
      };
    });
  };

  const compatibilityResults = checkPrintSizeCompatibility();

  return (
    <div className="space-y-8">
      <Paper withBorder shadow="md" p="xl" data-testid="print-size-calculator">
        <div className="space-y-6">
          <Title order={3} className="flex items-center space-x-2">
            <Ruler className="h-5 w-5" />
            <span>Calculate Print Dimensions</span>
          </Title>

          <div className="space-y-4">
            <Group grow>
              <TextInput
                label="Image Width (pixels)"
                value={imageWidth}
                onChange={(e) => setImageWidth(e.target.value)}
                placeholder="e.g., 3000"
                type="number"
                data-testid="image-width-input"
              />
              <TextInput
                label="Image Height (pixels)"
                value={imageHeight}
                onChange={(e) => setImageHeight(e.target.value)}
                placeholder="e.g., 2000"
                type="number"
                data-testid="image-height-input"
              />
            </Group>

            <Group grow>
              <Select
                label="Target DPI"
                value={targetDPI}
                onChange={(value) => setTargetDPI(value || "300")}
                data={dpiOptions}
                data-testid="target-dpi-select"
              />
              <Select
                label="Units"
                value={units}
                onChange={(value) => setUnits(value || "inches")}
                data={unitOptions}
                data-testid="units-select"
              />
            </Group>

            <Button
              fullWidth
              size="lg"
              color="green"
              onClick={calculatePrintSize}
              disabled={!imageWidth || !imageHeight}
              data-testid="calculate-print-size"
            >
              Calculate Maximum Print Size
            </Button>
          </div>
        </div>
      </Paper>

      {results.length > 0 && (
        <Tabs defaultValue="print-size" className="space-y-6">
          <Tabs.List>
            <Tabs.Tab value="print-size">Print Size Results</Tabs.Tab>
            <Tabs.Tab value="compatibility">Format Compatibility</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="print-size">
            <Paper withBorder shadow="md" p="xl">
              <Title order={3} mb="lg">Maximum Print Dimensions</Title>
              <Stack gap="lg" data-testid="print-size-results">
                {results.map((result, index) => (
                  <Paper key={index} p="lg" className="bg-gray-50 dark:bg-gray-800">
                    <Group justify="space-between" align="center" mb="md">
                      <div>
                        <Text size="xl" fw={700}>
                          {result.maxWidth.toFixed(1)} × {result.maxHeight.toFixed(1)} {units}
                        </Text>
                        <Text size="sm" c="dimmed">
                          At {result.recommendedDPI} DPI
                        </Text>
                      </div>
                      <Badge variant="light" color={result.color} size="lg">
                        {result.quality} Quality
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" mb="sm">Suitable for:</Text>
                    <Group gap="xs">
                      {result.suitableFor.map((application, appIndex) => (
                        <Badge key={appIndex} variant="outline" size="sm">
                          {application}
                        </Badge>
                      ))}
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="compatibility">
            <Paper withBorder shadow="md" p="xl">
              <Title order={3} mb="lg">Standard Print Format Compatibility</Title>
              <Stack gap="md" data-testid="compatibility-results">
                {compatibilityResults.map((format, index) => (
                  <Paper key={index} p="md" className={`${
                    format.compatible ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
                  }`}>
                    <Group justify="space-between" align="center">
                      <div>
                        <Group gap="xs" mb="xs">
                          <Text fw={500}>{format.name}</Text>
                          <Text size="sm" c="dimmed">
                            ({format.width}″ × {format.height}″)
                          </Text>
                          {format.compatible ? (
                            <CheckCircle size={16} className="text-green-600" />
                          ) : (
                            <AlertCircle size={16} className="text-red-600" />
                          )}
                        </Group>
                        <Text size="sm" c="dimmed">
                          Actual DPI: {format.actualDPI} | Quality: {format.quality}
                        </Text>
                      </div>
                      <Badge 
                        variant="light" 
                        color={format.compatible ? "green" : "red"}
                      >
                        {format.compatible ? "Compatible" : "Too Small"}
                      </Badge>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      )}

      <Alert icon={<Printer size={16} />} color="blue">
        <Text size="sm">
          <strong>Pro Tip:</strong> For the best print quality, always aim for 300 DPI or higher. 
          For large format prints viewed from a distance, 150 DPI may be acceptable.
        </Text>
      </Alert>
    </div>
  );
}