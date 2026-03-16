import ToolLayout from "@/components/tools/shared/ToolLayout";
import ColorExtractor from "@/components/tools/ColorExtractor";
import { Paper, Title, Text, Grid, Stack, Group, Badge, ColorSwatch, Button, List } from "@mantine/core";
import { Palette, Monitor, Printer, Paintbrush, CheckCircle, Award } from "lucide-react";
import { Link } from "wouter";

export default function ColorExtractorPage() {
  const brandColorExamples = [
    { name: "Coca-Cola", primary: "#FF0000", secondary: "#FFFFFF", usage: "High contrast, memorable branding" },
    { name: "Facebook", primary: "#1877F2", secondary: "#42B883", usage: "Trust and reliability" },
    { name: "Spotify", primary: "#1DB954", secondary: "#191414", usage: "Energy and music focus" },
    { name: "Netflix", primary: "#E50914", secondary: "#221F1F", usage: "Entertainment and excitement" },
  ];

  return (
    <ToolLayout
      title="Free Color Palette Extractor Tool"
      description="Extract dominant colors, create brand palettes, and analyze color schemes from any image. Perfect for designers, marketers, and brand managers seeking color inspiration."
      category="Image Tools"
      keywords={["color extractor", "palette generator", "brand colors", "color analysis", "extract colors from image", "color psychology"]}
      howToSteps={[
        { name: "Upload Image", text: "Select and upload the image you want to extract colors from." },
        { name: "Analyze Colors", text: "The tool will automatically identify the dominant and accent colors." },
        { name: "Create Palette", text: "Review the generated color palette and adjust selections if needed." },
        { name: "Export Colors", text: "Copy color codes (HEX, RGB) or export the palette for your design software." },
      ]}
    >
      <div className="space-y-8">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <ColorExtractor />
        </div>

        {/* Color Theory Guide */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" ta="center" className="text-2xl md:text-3xl font-bold">Understanding Color Psychology in Design</Title>
          <Text ta="center" c="dimmed" mb="xl" maw={600} mx="auto">
            Colors evoke emotions and influence decisions. Understanding color psychology helps create more effective
            designs and stronger brand connections with your audience.
          </Text>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="lg" className="bg-red-50/50 dark:bg-red-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <ColorSwatch color="#EF4444" size={20} />
                  <Title order={3} size="h4" c="red">Warm Colors</Title>
                </Group>
                <Text size="sm" mb="md">
                  Energetic, passionate, and attention-grabbing. Create urgency and excitement.
                </Text>
                <Stack gap="xs">
                  <Group gap="xs">
                    <ColorSwatch color="#EF4444" size={16} />
                    <Text size="sm">Red - Power, passion, urgency</Text>
                  </Group>
                  <Group gap="xs">
                    <ColorSwatch color="#F59E0B" size={16} />
                    <Text size="sm">Orange - Creativity, enthusiasm, warmth</Text>
                  </Group>
                  <Group gap="xs">
                    <ColorSwatch color="#EAB308" size={16} />
                    <Text size="sm">Yellow - Optimism, clarity, energy</Text>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="lg" className="bg-blue-50/50 dark:bg-blue-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <ColorSwatch color="#3B82F6" size={20} />
                  <Title order={3} size="h4" c="blue">Cool Colors</Title>
                </Group>
                <Text size="sm" mb="md">
                  Calming, trustworthy, and professional. Build trust and reliability.
                </Text>
                <Stack gap="xs">
                  <Group gap="xs">
                    <ColorSwatch color="#10B981" size={16} />
                    <Text size="sm">Green - Growth, harmony, freshness</Text>
                  </Group>
                  <Group gap="xs">
                    <ColorSwatch color="#3B82F6" size={16} />
                    <Text size="sm">Blue - Trust, stability, professionalism</Text>
                  </Group>
                  <Group gap="xs">
                    <ColorSwatch color="#8B5CF6" size={16} />
                    <Text size="sm">Purple - Luxury, creativity, wisdom</Text>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Brand Color Examples */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" className="text-2xl font-bold">Famous Brand Color Strategies</Title>
          <Grid gutter="lg">
            {brandColorExamples.map((brand, index) => (
              <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800 h-full" radius="md">
                  <Group gap="xs" mb="md">
                    <ColorSwatch color={brand.primary} size={24} />
                    <ColorSwatch color={brand.secondary} size={24} />
                    <Text fw={500} size="sm">{brand.name}</Text>
                  </Group>
                  <Text size="xs" c="dimmed">{brand.usage}</Text>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </Paper>

        {/* Color Applications */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" className="text-2xl font-bold">Professional Color Applications</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50/50 dark:bg-blue-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  <Title order={3} size="h4" c="blue">Web Design</Title>
                </Group>
                <List size="sm" spacing="xs" center>
                  <List.Item>Primary brand color for CTAs and headers</List.Item>
                  <List.Item>Secondary colors for accents and highlights</List.Item>
                  <List.Item>Neutral colors for text and backgrounds</List.Item>
                  <List.Item>Accessibility-compliant color contrast</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50/50 dark:bg-green-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Printer className="h-5 w-5 text-green-600" />
                  <Title order={3} size="h4" c="green">Print Materials</Title>
                </Group>
                <List size="sm" spacing="xs" center>
                  <List.Item>CMYK color matching for print accuracy</List.Item>
                  <List.Item>Pantone color specifications for consistency</List.Item>
                  <List.Item>Brand colors across all marketing materials</List.Item>
                  <List.Item>Color variations for different print methods</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50/50 dark:bg-purple-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Paintbrush className="h-5 w-5 text-purple-600" />
                  <Title order={3} size="h4" c="purple">Brand Identity</Title>
                </Group>
                <List size="sm" spacing="xs" center>
                  <List.Item>Logo color variations and applications</List.Item>
                  <List.Item>Brand guidelines and style standards</List.Item>
                  <List.Item>Social media and digital applications</List.Item>
                  <List.Item>Packaging and product design colors</List.Item>
                </List>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Export Formats */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" className="text-2xl font-bold">Color Palette Export Options</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" className="bg-gray-50 dark:bg-gray-800" radius="md">
                <Title order={4} size="h5" mb="sm">CSS Variables</Title>
                <Text size="xs" c="dimmed" mb="md" style={{ fontFamily: 'monospace' }}>
                  :root {"{"}
                  <br />
                  &nbsp;&nbsp;--primary: #1a365d;
                  <br />
                  &nbsp;&nbsp;--accent: #10b981;
                  <br />
                  {"}"}
                </Text>
                <Text size="sm" fw={500}>Perfect for web developers and CSS frameworks</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" className="bg-gray-50 dark:bg-gray-800" radius="md">
                <Title order={4} size="h5" mb="sm">SASS Variables</Title>
                <Text size="xs" c="dimmed" mb="md" style={{ fontFamily: 'monospace' }}>
                  $primary: #1a365d;
                  <br />
                  $accent: #10b981;
                  <br />
                  $neutral: #374151;
                </Text>
                <Text size="sm" fw={500}>Ideal for SASS/SCSS preprocessor workflows</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" className="bg-gray-50 dark:bg-gray-800" radius="md">
                <Title order={4} size="h5" mb="sm">JSON Format</Title>
                <Text size="xs" c="dimmed" mb="md" style={{ fontFamily: 'monospace' }}>
                  [{"{"}
                  <br />
                  &nbsp;&nbsp;"name": "Deep Navy",
                  <br />
                  &nbsp;&nbsp;"hex": "#1a365d"
                  <br />
                  {"}"}]
                </Text>
                <Text size="sm" fw={500}>Universal format for any application or tool</Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Professional Services */}
        <Paper withBorder shadow="md" p="xl" radius="lg" className="text-center bg-gray-50/50">
          <Title order={2} mb="md" className="text-2xl font-bold">Professional Brand Color Consulting</Title>
          <Text size="md" c="dimmed" mb="xl" maw={600} mx="auto">
            Need help creating a cohesive brand color strategy? Our design experts can help you develop
            a complete color system that works across all your marketing materials.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="md" color="green" radius="xl">
              Get Brand Color Consultation
            </Button>
            <Button component={Link} href="/logo-dimensions" variant="outline" size="md" radius="xl">
              Check Logo Dimensions
            </Button>
          </Group>
        </Paper>
      </div>
    </ToolLayout>
  );
}
