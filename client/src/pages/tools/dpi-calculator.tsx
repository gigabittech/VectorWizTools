import { useState } from "react";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import { Paper, Title, TextInput, Button, Badge, Group, Stack, Grid, Text, List } from "@mantine/core";
import { Calculator, Printer, Monitor, Award, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function DPICalculator() {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [printWidth, setPrintWidth] = useState("");
  const [printHeight, setPrintHeight] = useState("");
  const [results, setResults] = useState<{
    dpiX: number;
    dpiY: number;
    needsVector: boolean;
    quality: string;
  } | null>(null);

  const calculateDPI = () => {
    const pixelW = parseFloat(width);
    const pixelH = parseFloat(height);
    const printW = parseFloat(printWidth);
    const printH = parseFloat(printHeight);

    if (pixelW && pixelH && printW && printH) {
      const dpiX = pixelW / printW;
      const dpiY = pixelH / printH;
      const avgDPI = (dpiX + dpiY) / 2;

      let quality = "Poor";
      let needsVector = true;

      if (avgDPI >= 300) {
        quality = "Excellent";
        needsVector = false;
      } else if (avgDPI >= 150) {
        quality = "Good";
        needsVector = false;
      } else if (avgDPI >= 72) {
        quality = "Fair";
        needsVector = true;
      }

      setResults({
        dpiX: Math.round(dpiX),
        dpiY: Math.round(dpiY),
        needsVector,
        quality,
      });
    }
  };

  return (
    <ToolLayout
      toolId="dpi-calculator"
      title="Free DPI Calculator Tool"
      description="Calculate image resolution and determine if your graphics need vectorization for professional printing."
      category="Image Tools"
      keywords={["dpi calculator", "image resolution", "print quality test", "pixels to inches", "printing standards", "resolution checker"]}
      howToSteps={[
        { name: "Enter Pixel Dimensions", text: "Input the width and height of your image in pixels." },
        { name: "Enter Print Size", text: "Specify the intended physical size of your print in inches." },
        { name: "Calculate", text: "Click the calculate button to get your image's DPI (Dots Per Inch)." },
        { name: "Check Quality", text: "Review the quality assessment and see if vectorization is recommended." },
      ]}
    >
      <div className="space-y-8">
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper withBorder shadow="md" p="xl" radius="lg" data-testid="dpi-calculator">
              <Title order={3} mb="lg" className="text-xl font-bold">Image & Print Dimensions</Title>
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Image Width (pixels)"
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="e.g., 1920"
                      data-testid="image-width"
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Image Height (pixels)"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g., 1080"
                      data-testid="image-height"
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Print Width (inches)"
                      type="number"
                      step={0.1}
                      value={printWidth}
                      onChange={(e) => setPrintWidth(e.target.value)}
                      placeholder="e.g., 8.5"
                      data-testid="print-width"
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Print Height (inches)"
                      type="number"
                      step={0.1}
                      value={printHeight}
                      onChange={(e) => setPrintHeight(e.target.value)}
                      placeholder="e.g., 11"
                      data-testid="print-height"
                    />
                  </Grid.Col>
                </Grid>

                <Button
                  onClick={calculateDPI}
                  fullWidth
                  size="md"
                  radius="xl"
                  color="green"
                  data-testid="calculate-dpi"
                  leftSection={<Calculator size={18} />}
                >
                  Calculate DPI
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper withBorder shadow="md" p="xl" radius="lg">
              <Title order={3} mb="lg" className="text-xl font-bold">Results</Title>
              {results ? (
                <Stack gap="lg" data-testid="dpi-results">
                  <Grid>
                    <Grid.Col span={6}>
                      <Paper p="md" className="text-center bg-gray-50 dark:bg-gray-800" radius="md">
                        <Text size="xl" fw={700} data-testid="dpi-x-result">{results.dpiX}</Text>
                        <Text size="sm" c="dimmed">DPI (Width)</Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Paper p="md" className="text-center bg-gray-50 dark:bg-gray-800" radius="md">
                        <Text size="xl" fw={700} data-testid="dpi-y-result">{results.dpiY}</Text>
                        <Text size="sm" c="dimmed">DPI (Height)</Text>
                      </Paper>
                    </Grid.Col>
                  </Grid>

                  <div className="text-center">
                    <Badge
                      size="lg"
                      variant="filled"
                      color={
                        results.quality === "Excellent" ? "green" :
                          results.quality === "Good" ? "blue" :
                            results.quality === "Fair" ? "orange" :
                              "red"
                      }
                      data-testid="quality-badge"
                    >
                      {results.quality} Quality
                    </Badge>
                  </div>

                  {results.needsVector && (
                    <Paper p="md" className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" radius="md">
                      <Title order={4} size="h5" c="red" mb="xs">Vectorization Recommended</Title>
                      <Text size="sm" c="red" mb="md">
                        Your image resolution is too low for high-quality printing. Consider vectorizing for scalable, crisp results.
                      </Text>
                      <Button component={Link} href="/order/new" color="green" size="sm" radius="xl" data-testid="start-vector-order">
                        Start Vector Order
                      </Button>
                    </Paper>
                  )}
                </Stack>
              ) : (
                <div className="text-center py-8">
                  <Text c="dimmed">Enter dimensions above to calculate DPI</Text>
                </div>
              )}
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Comprehensive SEO Content */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" className="text-2xl font-bold">Complete DPI Guidelines & Print Quality Standards</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50/50 dark:bg-green-950/20 h-full" radius="md">
                <Group gap="xs" mb="md">
                  <Award className="h-5 w-5 text-green-600" />
                  <Title order={4} size="h5" c="green">300+ DPI</Title>
                </Group>
                <Text size="sm" fw={500}>
                  Excellent for professional printing, magazines, marketing materials, business cards, and high-end brochures.
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50/50 dark:bg-blue-950/20 h-full" radius="md">
                <Group gap="xs" mb="md">
                  <Printer className="h-5 w-5 text-blue-600" />
                  <Title order={4} size="h5" c="blue">150-300 DPI</Title>
                </Group>
                <Text size="sm" fw={500}>
                  Good for general printing, posters, large format displays, banners, and most commercial printing.
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-orange-50/50 dark:bg-orange-950/20 h-full" radius="md">
                <Group gap="xs" mb="md">
                  <Monitor className="h-5 w-5 text-orange-600" />
                  <Title order={4} size="h5" c="orange">72-150 DPI</Title>
                </Group>
                <Text size="sm" fw={500}>
                  Fair for web use and digital displays but may appear pixelated when printed.
                </Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* What is DPI Section */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" className="text-2xl font-bold">What is DPI and Why Does It Matter?</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                <Text>
                  <strong>DPI (Dots Per Inch)</strong> is a measure of printing resolution that determines how many individual dots of ink
                  a printer can place within a one-inch square. Higher DPI means more detail and sharper print quality.
                </Text>
                <Text>
                  Our free DPI calculator helps you determine if your images have sufficient resolution for professional printing
                  or if you need vector conversion services to achieve crisp, scalable graphics.
                </Text>
                <List spacing="xs" size="sm" center icon={<CheckCircle size={16} className="text-green-500" />}>
                  <List.Item>Calculate exact DPI from pixel dimensions</List.Item>
                  <List.Item>Determine print quality before production</List.Item>
                  <List.Item>Identify when vectorization is needed</List.Item>
                  <List.Item>Save time and money on reprints</List.Item>
                </List>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} size="h4" mb="md">Common Print Applications</Title>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Badge variant="light" color="blue">Business Cards</Badge>
                  <Text size="sm" c="dimmed">300+ DPI recommended</Text>
                </Group>
                <Group justify="space-between">
                  <Badge variant="light" color="green">Brochures</Badge>
                  <Text size="sm" c="dimmed">300+ DPI for text</Text>
                </Group>
                <Group justify="space-between">
                  <Badge variant="light" color="purple">Banners</Badge>
                  <Text size="sm" c="dimmed">100-150 DPI</Text>
                </Group>
                <Group justify="space-between">
                  <Badge variant="light" color="orange">T-Shirts</Badge>
                  <Text size="sm" c="dimmed">150-300 DPI</Text>
                </Group>
                <Group justify="space-between">
                  <Badge variant="light" color="red">Billboards</Badge>
                  <Text size="sm" c="dimmed">25-72 DPI</Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* When to Vectorize Section */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" className="text-2xl font-bold">When Should You Vectorize Your Graphics?</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} size="h4" mb="md" c="red.7">Vectorization Recommended When:</Title>
              <List spacing="sm" size="sm" center icon={<CheckCircle size={16} className="text-red-500" />}>
                <List.Item>DPI is below 150 for intended print size</List.Item>
                <List.Item>You need to scale graphics to multiple sizes</List.Item>
                <List.Item>Creating logos or brand elements</List.Item>
                <List.Item>Preparing graphics for large format printing</List.Item>
                <List.Item>Working with simple graphics, logos, or text</List.Item>
                <List.Item>Need editable vector elements</List.Item>
              </List>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} size="h4" mb="md" c="green.7">Benefits of Vector Graphics:</Title>
              <List spacing="sm" size="sm" center icon={<CheckCircle size={16} className="text-green-500" />}>
                <List.Item>Infinite scalability without quality loss</List.Item>
                <List.Item>Smaller file sizes for simple graphics</List.Item>
                <List.Item>Perfect crisp edges at any resolution</List.Item>
                <List.Item>Editable individual elements and colors</List.Item>
                <List.Item>Professional print quality guaranteed</List.Item>
                <List.Item>Compatible with all design software</List.Item>
              </List>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* CTA Section */}
        <Paper withBorder shadow="md" p="xl" radius="lg" className="text-center bg-gray-50/50">
          <Title order={2} mb="md" className="text-2xl font-bold">Need Professional Vector Conversion?</Title>
          <Text size="md" c="dimmed" mb="xl" maw={600} mx="auto">
            If your DPI calculation shows you need vectorization, our expert designers can convert your graphics
            into crisp, scalable vectors perfect for any application.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="md" color="green" radius="xl">
              Get Vector Conversion Quote
            </Button>
            <Button component={Link} href="/vector-checker" variant="outline" size="md" radius="xl">
              Check Vector Format
            </Button>
          </Group>
        </Paper>
      </div>
    </ToolLayout>
  );
}
