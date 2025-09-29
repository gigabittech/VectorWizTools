import { useState } from "react";
import { Paper, Title, Button, TextInput, Group, Stack, Text, Badge, Alert, Tabs } from "@mantine/core";
import { Maximize, Calculator, Monitor, Smartphone, Camera, Film } from "lucide-react";

interface AspectRatioResult {
  ratio: string;
  decimal: number;
  width: number;
  height: number;
  gcd: number;
  category: string;
  commonUses: string[];
}

export default function AspectRatioCalculator() {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [targetWidth, setTargetWidth] = useState("");
  const [targetHeight, setTargetHeight] = useState("");
  const [result, setResult] = useState<AspectRatioResult | null>(null);
  const [resizedDimensions, setResizedDimensions] = useState<{width: number, height: number} | null>(null);

  const commonRatios = [
    { ratio: "16:9", decimal: 1.78, category: "Widescreen", uses: ["HDTV", "YouTube", "Modern displays", "Presentations"] },
    { ratio: "4:3", decimal: 1.33, category: "Standard", uses: ["Old TVs", "Tablets", "Some monitors", "Classic photography"] },
    { ratio: "3:2", decimal: 1.5, category: "Photography", uses: ["35mm film", "DSLR cameras", "Print photos", "Postcards"] },
    { ratio: "1:1", decimal: 1.0, category: "Square", uses: ["Instagram posts", "Profile pictures", "Logos", "CD covers"] },
    { ratio: "9:16", decimal: 0.56, category: "Vertical", uses: ["Mobile screens", "Instagram Stories", "TikTok", "Snapchat"] },
    { ratio: "21:9", decimal: 2.33, category: "Ultrawide", uses: ["Cinema", "Gaming monitors", "Ultrawide displays"] },
    { ratio: "5:4", decimal: 1.25, category: "Monitor", uses: ["Old computer monitors", "Some photography"] },
    { ratio: "16:10", decimal: 1.6, category: "Widescreen", uses: ["MacBook screens", "Some monitors", "Tablets"] },
  ];

  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const calculateAspectRatio = () => {
    const w = parseInt(width);
    const h = parseInt(height);

    if (!w || !h) return;

    const greatestCommonDivisor = gcd(w, h);
    const simplifiedWidth = w / greatestCommonDivisor;
    const simplifiedHeight = h / greatestCommonDivisor;
    const decimal = w / h;

    // Find closest common ratio
    const closest = commonRatios.reduce((prev, curr) => 
      Math.abs(curr.decimal - decimal) < Math.abs(prev.decimal - decimal) ? curr : prev
    );

    setResult({
      ratio: `${simplifiedWidth}:${simplifiedHeight}`,
      decimal: parseFloat(decimal.toFixed(3)),
      width: simplifiedWidth,
      height: simplifiedHeight,
      gcd: greatestCommonDivisor,
      category: closest.category,
      commonUses: closest.uses
    });
  };

  const calculateResizedDimensions = () => {
    const w = parseInt(width);
    const h = parseInt(height);
    const targetW = parseInt(targetWidth);
    const targetH = parseInt(targetHeight);

    if (!w || !h) return;

    let newWidth = 0;
    let newHeight = 0;

    if (targetW && !targetH) {
      // Calculate height based on width
      newWidth = targetW;
      newHeight = Math.round((targetW * h) / w);
    } else if (targetH && !targetW) {
      // Calculate width based on height
      newHeight = targetH;
      newWidth = Math.round((targetH * w) / h);
    } else if (targetW && targetH) {
      // Both provided - check which maintains ratio better
      const ratioByWidth = (targetW * h) / w;
      const ratioByHeight = (targetH * w) / h;
      
      if (ratioByWidth <= targetH) {
        newWidth = targetW;
        newHeight = Math.round(ratioByWidth);
      } else {
        newHeight = targetH;
        newWidth = Math.round(ratioByHeight);
      }
    }

    setResizedDimensions({ width: newWidth, height: newHeight });
  };

  return (
    <div className="space-y-8">
      <Paper withBorder shadow="md" p="xl" data-testid="aspect-ratio-calculator">
        <div className="space-y-6">
          <Title order={3} className="flex items-center space-x-2">
            <Maximize className="h-5 w-5" />
            <span>Aspect Ratio Calculator</span>
          </Title>

          <Tabs defaultValue="calculate" className="space-y-4">
            <Tabs.List>
              <Tabs.Tab value="calculate">Calculate Ratio</Tabs.Tab>
              <Tabs.Tab value="resize">Proportional Resize</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="calculate">
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

                <Button
                  fullWidth
                  size="lg"
                  color="green"
                  onClick={calculateAspectRatio}
                  disabled={!width || !height}
                  data-testid="calculate-ratio"
                >
                  Calculate Aspect Ratio
                </Button>
              </div>
            </Tabs.Panel>

            <Tabs.Panel value="resize">
              <div className="space-y-4">
                <Text size="sm" c="dimmed" mb="md">
                  Enter original dimensions and one target dimension to calculate proportional resize
                </Text>
                
                <Group grow>
                  <TextInput
                    label="Original Width"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="e.g., 1920"
                    type="number"
                  />
                  <TextInput
                    label="Original Height"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g., 1080"
                    type="number"
                  />
                </Group>

                <Group grow>
                  <TextInput
                    label="Target Width (optional)"
                    value={targetWidth}
                    onChange={(e) => setTargetWidth(e.target.value)}
                    placeholder="e.g., 800"
                    type="number"
                    data-testid="target-width-input"
                  />
                  <TextInput
                    label="Target Height (optional)"
                    value={targetHeight}
                    onChange={(e) => setTargetHeight(e.target.value)}
                    placeholder="e.g., 600"
                    type="number"
                    data-testid="target-height-input"
                  />
                </Group>

                <Button
                  fullWidth
                  size="lg"
                  color="blue"
                  onClick={calculateResizedDimensions}
                  disabled={!width || !height || (!targetWidth && !targetHeight)}
                  data-testid="calculate-resize"
                >
                  Calculate Proportional Resize
                </Button>
              </div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </Paper>

      {result && (
        <Paper withBorder shadow="md" p="xl">
          <Title order={3} mb="lg">Aspect Ratio Results</Title>
          <div className="space-y-6" data-testid="aspect-ratio-results">
            <Paper p="lg" className="bg-gray-50 dark:bg-gray-800">
              <Group justify="space-between" align="center" mb="md">
                <div>
                  <Text size="xl" fw={700}>{result.ratio}</Text>
                  <Text size="sm" c="dimmed">Simplified ratio</Text>
                </div>
                <div className="text-right">
                  <Text size="lg" fw={500}>{result.decimal}</Text>
                  <Text size="sm" c="dimmed">Decimal value</Text>
                </div>
              </Group>
              
              <Group gap="xs" mb="md">
                <Badge variant="light" color="blue">{result.category}</Badge>
                <Text size="sm" c="dimmed">
                  Original: {width} × {height} pixels
                </Text>
              </Group>

              <div>
                <Text size="sm" fw={500} mb="xs">Common uses:</Text>
                <Group gap="xs">
                  {result.commonUses.map((use, index) => (
                    <Badge key={index} variant="outline" size="sm">
                      {use}
                    </Badge>
                  ))}
                </Group>
              </div>
            </Paper>
          </div>
        </Paper>
      )}

      {resizedDimensions && (
        <Paper withBorder shadow="md" p="xl">
          <Title order={3} mb="lg">Proportional Resize Results</Title>
          <Paper p="lg" className="bg-green-50 dark:bg-green-950/20" data-testid="resize-results">
            <Group justify="space-between" align="center">
              <div>
                <Text size="xl" fw={700}>
                  {resizedDimensions.width} × {resizedDimensions.height}
                </Text>
                <Text size="sm" c="dimmed">Proportionally resized dimensions</Text>
              </div>
              <Badge variant="light" color="green" size="lg">Aspect Ratio Preserved</Badge>
            </Group>
          </Paper>
        </Paper>
      )}

      <Paper withBorder shadow="md" p="xl">
        <Title order={3} mb="lg">Common Aspect Ratios Reference</Title>
        <Stack gap="md">
          {commonRatios.map((ratio, index) => (
            <Paper key={index} p="md" className="bg-gray-50 dark:bg-gray-800">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Group gap="xs" mb="xs">
                    <Text fw={500}>{ratio.ratio}</Text>
                    <Badge variant="light" color="blue" size="sm">
                      {ratio.category}
                    </Badge>
                    <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                      {ratio.decimal}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    {ratio.uses.map((use, useIndex) => (
                      <Badge key={useIndex} variant="outline" size="xs">
                        {use}
                      </Badge>
                    ))}
                  </Group>
                </div>
                {ratio.ratio === "16:9" && <Monitor className="h-5 w-5 text-blue-600" />}
                {ratio.ratio === "9:16" && <Smartphone className="h-5 w-5 text-green-600" />}
                {ratio.ratio === "3:2" && <Camera className="h-5 w-5 text-purple-600" />}
                {ratio.ratio === "21:9" && <Film className="h-5 w-5 text-orange-600" />}
              </Group>
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Alert icon={<Calculator size={16} />} color="blue">
        <Text size="sm">
          <strong>Tip:</strong> When resizing images, always maintain the aspect ratio to prevent distortion. 
          Use these calculations to find the perfect dimensions for your specific needs.
        </Text>
      </Alert>
    </div>
  );
}