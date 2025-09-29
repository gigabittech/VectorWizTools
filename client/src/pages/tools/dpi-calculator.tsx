import { useState } from "react";
import { Paper, Title, TextInput, Button, Badge, Container, Group, Stack, Grid, Text, List, Anchor } from "@mantine/core";
import { Calculator, ArrowLeft, Printer, Monitor, Smartphone, Award, CheckCircle } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      
      <Container size="xl" py="xl">
        <div className="mb-8">
          <Link href="/tools">
            <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} mb="md" data-testid="back-to-tools">
              Back to Tools
            </Button>
          </Link>
          
          <Group align="flex-start" gap="lg" mb="xl">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <Title order={1} size="h1" mb="xs">Free DPI Calculator Tool</Title>
              <Text size="lg" c="dimmed" mb="md">
                Calculate image resolution and determine if your graphics need vectorization for professional printing
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="blue">Free Tool</Badge>
                <Badge variant="light" color="green">Instant Results</Badge>
                <Badge variant="light" color="purple">Print Ready</Badge>
              </Group>
            </div>
          </Group>
        </div>

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper withBorder shadow="md" p="xl" data-testid="dpi-calculator">
              <Title order={3} mb="lg">Image & Print Dimensions</Title>
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
                  size="lg"
                  color="green" 
                  data-testid="calculate-dpi"
                >
                  Calculate DPI
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper withBorder shadow="md" p="xl">
              <Title order={3} mb="lg">Results</Title>
              {results ? (
                <Stack gap="lg" data-testid="dpi-results">
                  <Grid>
                    <Grid.Col span={6}>
                      <Paper p="md" className="text-center bg-gray-50 dark:bg-gray-800">
                        <Text size="xl" fw={700} data-testid="dpi-x-result">{results.dpiX}</Text>
                        <Text size="sm" c="dimmed">DPI (Width)</Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Paper p="md" className="text-center bg-gray-50 dark:bg-gray-800">
                        <Text size="xl" fw={700} data-testid="dpi-y-result">{results.dpiY}</Text>
                        <Text size="sm" c="dimmed">DPI (Height)</Text>
                      </Paper>
                    </Grid.Col>
                  </Grid>

                  <div className="text-center">
                    <Badge 
                      size="lg"
                      variant="light"
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
                    <Paper p="md" className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <Title order={4} size="h5" c="red" mb="xs">Vectorization Recommended</Title>
                      <Text size="sm" c="red" mb="md">
                        Your image resolution is too low for high-quality printing. Consider vectorizing for scalable, crisp results.
                      </Text>
                      <Button component={Link} href="/order/new" color="green" size="sm" data-testid="start-vector-order">
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
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Complete DPI Guidelines & Print Quality Standards</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50 dark:bg-green-950/20">
                <Group gap="xs" mb="md">
                  <Award className="h-5 w-5 text-green-600" />
                  <Title order={4} c="green">300+ DPI</Title>
                </Group>
                <Text size="sm" c="green">
                  Excellent for professional printing, magazines, marketing materials, business cards, and high-end brochures
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20">
                <Group gap="xs" mb="md">
                  <Printer className="h-5 w-5 text-blue-600" />
                  <Title order={4} c="blue">150-300 DPI</Title>
                </Group>
                <Text size="sm" c="blue">
                  Good for general printing, posters, large format displays, banners, and most commercial printing
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-orange-50 dark:bg-orange-950/20">
                <Group gap="xs" mb="md">
                  <Monitor className="h-5 w-5 text-orange-600" />
                  <Title order={4} c="orange">72-150 DPI</Title>
                </Group>
                <Text size="sm" c="orange">
                  Fair for web use and digital displays but may appear pixelated when printed
                </Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* What is DPI Section */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">What is DPI and Why Does It Matter?</Title>
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
                <List spacing="xs" size="sm" icon={<CheckCircle size={16} className="text-green-500" />}>
                  <List.Item>Calculate exact DPI from pixel dimensions</List.Item>
                  <List.Item>Determine print quality before production</List.Item>
                  <List.Item>Identify when vectorization is needed</List.Item>
                  <List.Item>Save time and money on reprints</List.Item>
                </List>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md">Common Print Applications</Title>
              <Stack gap="xs">
                <Group>
                  <Badge variant="light" color="blue">Business Cards</Badge>
                  <Text size="sm" c="dimmed">300+ DPI recommended</Text>
                </Group>
                <Group>
                  <Badge variant="light" color="green">Brochures</Badge>
                  <Text size="sm" c="dimmed">300+ DPI for text, 150+ for images</Text>
                </Group>
                <Group>
                  <Badge variant="light" color="purple">Banners</Badge>
                  <Text size="sm" c="dimmed">100-150 DPI (viewed from distance)</Text>
                </Group>
                <Group>
                  <Badge variant="light" color="orange">T-Shirts</Badge>
                  <Text size="sm" c="dimmed">150-300 DPI, vector preferred</Text>
                </Group>
                <Group>
                  <Badge variant="light" color="red">Billboards</Badge>
                  <Text size="sm" c="dimmed">25-72 DPI (large viewing distance)</Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* When to Vectorize Section */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">When Should You Vectorize Your Graphics?</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="red">Vectorization Recommended When:</Title>
              <List spacing="md" size="sm">
                <List.Item>DPI is below 150 for intended print size</List.Item>
                <List.Item>You need to scale graphics to multiple sizes</List.Item>
                <List.Item>Creating logos or brand elements</List.Item>
                <List.Item>Preparing graphics for large format printing</List.Item>
                <List.Item>Working with simple graphics, logos, or text</List.Item>
                <List.Item>Need editable vector elements</List.Item>
              </List>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="green">Benefits of Vector Graphics:</Title>
              <List spacing="md" size="sm">
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
        <Paper withBorder shadow="md" p="xl" mt="xl" className="text-center">
          <Title order={2} mb="md">Need Professional Vector Conversion?</Title>
          <Text size="lg" c="dimmed" mb="xl" maw={600} mx="auto">
            If your DPI calculation shows you need vectorization, our expert designers can convert your graphics 
            into crisp, scalable vectors perfect for any application.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="lg" color="green" data-testid="start-order-cta">
              Get Vector Conversion Quote
            </Button>
            <Button component={Link} href="/tools/vector-checker" variant="outline" size="lg">
              Check Vector Format
            </Button>
          </Group>
        </Paper>
      </Container>
    </div>
  );
}
