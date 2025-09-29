import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/Navigation";
import { useEffect } from "react";
import ColorExtractor from "@/components/tools/ColorExtractor";
import { Button, Paper, Title, Container, Group, Stack, Grid, Text, List, Badge, ColorSwatch } from "@mantine/core";
import { ArrowLeft, Palette, Eye, CheckCircle, Award, Zap, Download, Paintbrush, Monitor, Printer } from "lucide-react";
import { Link } from "wouter";

export default function ColorExtractorPage() {
  const { isLoading } = useAuth();

  useEffect(() => {
    // Set SEO metadata
    document.title = "Free Color Palette Extractor Tool | Extract Colors from Images | VectorWiz";
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Extract dominant colors, create brand palettes, and analyze color schemes from any image. Perfect for designers, marketers, and brand managers seeking color inspiration.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(metaDescription);
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Free Color Palette Extractor Tool | Extract Colors from Images');
    if (!document.querySelector('meta[property="og:title"]')) {
      document.head.appendChild(ogTitle);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Extract dominant colors and create professional brand palettes from any image instantly.');
    if (!document.querySelector('meta[property="og:description"]')) {
      document.head.appendChild(ogDescription);
    }

    // Structured Data for SEO - Always update for current tool
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Color Palette Extractor",
      "description": "Extract dominant colors and create brand palettes from any image for professional design work",
      "url": "https://vectorwiz.com/tools/color-extractor",
      "applicationCategory": "DesignApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    };

    // Remove existing tool-specific structured data and add new one
    const existingScript = document.getElementById('tool-structured-data');
    if (existingScript) {
      existingScript.remove();
    }
    
    const scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.id = 'tool-structured-data';
    scriptTag.textContent = JSON.stringify(structuredData);
    document.head.appendChild(scriptTag);

    // Additional Open Graph tags
    const ogType = document.querySelector('meta[property="og:type"]') || document.createElement('meta');
    ogType.setAttribute('property', 'og:type');
    ogType.setAttribute('content', 'website');
    if (!document.querySelector('meta[property="og:type"]')) {
      document.head.appendChild(ogType);
    }

    const ogImage = document.querySelector('meta[property="og:image"]') || document.createElement('meta');
    ogImage.setAttribute('property', 'og:image');
    ogImage.setAttribute('content', 'https://vectorwiz.com/og-color-extractor.png');
    if (!document.querySelector('meta[property="og:image"]')) {
      document.head.appendChild(ogImage);
    }

    const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', 'https://vectorwiz.com/tools/color-extractor');
    if (!document.querySelector('meta[property="og:url"]')) {
      document.head.appendChild(ogUrl);
    }

    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', 'https://vectorwiz.com/tools/color-extractor');
    if (!document.querySelector('link[rel="canonical"]')) {
      document.head.appendChild(canonical);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold">V</span>
          </div>
          <Text c="dimmed">Loading color extractor...</Text>
        </div>
      </div>
    );
  }

  const brandColorExamples = [
    { name: "Coca-Cola", primary: "#FF0000", secondary: "#FFFFFF", usage: "High contrast, memorable branding" },
    { name: "Facebook", primary: "#1877F2", secondary: "#42B883", usage: "Trust and reliability" },
    { name: "Spotify", primary: "#1DB954", secondary: "#191414", usage: "Energy and music focus" },
    { name: "Netflix", primary: "#E50914", secondary: "#221F1F", usage: "Entertainment and excitement" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navigation />
      
      <Container size="xl" py="xl" data-testid="color-extractor-page">
        <div className="mb-8">
          <Link href="/tools">
            <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} mb="md" data-testid="back-to-tools">
              Back to Tools
            </Button>
          </Link>
          
          <Group align="flex-start" gap="lg" mb="xl">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Palette className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <Title order={1} size="h1" mb="xs">Free Color Palette Extractor Tool</Title>
              <Text size="lg" c="dimmed" mb="md">
                Extract dominant colors, create brand palettes, and analyze color schemes from any image. 
                Perfect for designers, marketers, and brand managers.
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="purple">Color Analysis</Badge>
                <Badge variant="light" color="blue">Brand Colors</Badge>
                <Badge variant="light" color="green">Export Ready</Badge>
              </Group>
            </div>
          </Group>
        </div>

        <ColorExtractor />

        {/* Color Theory Guide */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg" ta="center">Understanding Color Psychology in Design</Title>
          <Text ta="center" c="dimmed" mb="xl" maw={600} mx="auto">
            Colors evoke emotions and influence decisions. Understanding color psychology helps create more effective 
            designs and stronger brand connections with your audience.
          </Text>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="lg" className="bg-red-50 dark:bg-red-950/20 h-full">
                <Group gap="sm" mb="md">
                  <ColorSwatch color="#EF4444" size={20} />
                  <Title order={3} c="red">Warm Colors</Title>
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
              <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20 h-full">
                <Group gap="sm" mb="md">
                  <ColorSwatch color="#3B82F6" size={20} />
                  <Title order={3} c="blue">Cool Colors</Title>
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
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Famous Brand Color Strategies</Title>
          <Grid gutter="lg">
            {brandColorExamples.map((brand, index) => (
              <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800 h-full">
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
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Professional Color Applications</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  <Title order={3} c="blue">Web Design</Title>
                </Group>
                <List size="sm" spacing="sm">
                  <List.Item>Primary brand color for CTAs and headers</List.Item>
                  <List.Item>Secondary colors for accents and highlights</List.Item>
                  <List.Item>Neutral colors for text and backgrounds</List.Item>
                  <List.Item>Accessibility-compliant color contrast</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50 dark:bg-green-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Printer className="h-5 w-5 text-green-600" />
                  <Title order={3} c="green">Print Materials</Title>
                </Group>
                <List size="sm" spacing="sm">
                  <List.Item>CMYK color matching for print accuracy</List.Item>
                  <List.Item>Pantone color specifications for consistency</List.Item>
                  <List.Item>Brand colors across all marketing materials</List.Item>
                  <List.Item>Color variations for different print methods</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50 dark:bg-purple-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Paintbrush className="h-5 w-5 text-purple-600" />
                  <Title order={3} c="purple">Brand Identity</Title>
                </Group>
                <List size="sm" spacing="sm">
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
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Color Palette Export Options</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
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
                <Text size="sm">Perfect for web developers and CSS frameworks</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                <Title order={4} size="h5" mb="sm">SASS Variables</Title>
                <Text size="xs" c="dimmed" mb="md" style={{ fontFamily: 'monospace' }}>
                  $primary: #1a365d;
                  <br />
                  $accent: #10b981;
                  <br />
                  $neutral: #374151;
                </Text>
                <Text size="sm">Ideal for SASS/SCSS preprocessor workflows</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
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
                <Text size="sm">Universal format for any application or tool</Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Professional Services */}
        <Paper withBorder shadow="md" p="xl" mt="xl" className="text-center">
          <Title order={2} mb="md">Professional Brand Color Consulting</Title>
          <Text size="lg" c="dimmed" mb="xl" maw={600} mx="auto">
            Need help creating a cohesive brand color strategy? Our design experts can help you develop 
            a complete color system that works across all your marketing materials.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="lg" color="green" data-testid="brand-consultation-cta">
              Get Brand Color Consultation
            </Button>
            <Button component={Link} href="/tools/logo-dimensions" variant="outline" size="lg">
              Check Logo Dimensions
            </Button>
          </Group>
        </Paper>
      </Container>
    </div>
  );
}