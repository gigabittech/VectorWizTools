import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import FormatConverter from "@/components/tools/FormatConverter";
import { Button, Paper, Title, Container, Group, Stack, Grid, Text, List, Badge, Anchor } from "@mantine/core";
import { ArrowLeft, FileImage, Repeat, CheckCircle, Award, Zap, Download, Upload, Globe, Printer } from "lucide-react";
import { Link } from "wouter";

export default function FormatConverterPage() {
  const { isLoading } = useAuth();

  useEffect(() => {
    // Set SEO metadata
    document.title = "Free Image Format Converter Tool | Convert SVG, PNG, JPG, WebP | VectorWiz";
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Convert between SVG, PNG, JPG, WebP, PDF, and EPS formats instantly. Professional quality image format conversion tool for web graphics, print materials, and vector illustrations.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(metaDescription);
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Free Image Format Converter Tool | Convert SVG, PNG, JPG, WebP');
    if (!document.querySelector('meta[property="og:title"]')) {
      document.head.appendChild(ogTitle);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Convert between SVG, PNG, JPG, WebP, PDF, and EPS formats instantly with professional quality results.');
    if (!document.querySelector('meta[property="og:description"]')) {
      document.head.appendChild(ogDescription);
    }

    // Structured Data for SEO - Always update for current tool
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Image Format Converter",
      "description": "Convert between SVG, PNG, JPG, WebP, PDF, and EPS formats instantly with professional quality",
      "url": "https://vectorwiz.com/tools/format-converter",
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
    ogImage.setAttribute('content', 'https://vectorwiz.com/og-format-converter.png');
    if (!document.querySelector('meta[property="og:image"]')) {
      document.head.appendChild(ogImage);
    }

    const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', 'https://vectorwiz.com/tools/format-converter');
    if (!document.querySelector('meta[property="og:url"]')) {
      document.head.appendChild(ogUrl);
    }

    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', 'https://vectorwiz.com/tools/format-converter');
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
          <Text c="dimmed">Loading format converter...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      
      <Container size="xl" py="xl" data-testid="format-converter-page">
        <div className="mb-8">
          <Link href="/tools">
            <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} mb="md" data-testid="back-to-tools">
              Back to Tools
            </Button>
          </Link>
          
          <Group align="flex-start" gap="lg" mb="xl">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Repeat className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <Title order={1} size="h1" mb="xs">Free Image Format Converter Tool</Title>
              <Text size="lg" c="dimmed" mb="md">
                Convert between SVG, PNG, JPG, WebP, PDF, and EPS formats instantly. Professional quality conversion 
                for web graphics, print materials, and vector illustrations.
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="blue">Multiple Formats</Badge>
                <Badge variant="light" color="green">Instant Conversion</Badge>
                <Badge variant="light" color="purple">Professional Quality</Badge>
              </Group>
            </div>
          </Group>
        </div>

        <FormatConverter />

        {/* Comprehensive Format Guide */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg" ta="center">Complete Image Format Conversion Guide</Title>
          <Text ta="center" c="dimmed" mb="xl" maw={600} mx="auto">
            Understanding when and how to convert between different image formats can dramatically improve 
            your web performance, print quality, and design workflow efficiency.
          </Text>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="lg" className="bg-green-50 dark:bg-green-950/20 h-full">
                <Group gap="sm" mb="md">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <Title order={3} c="green">Vector Formats (Scalable)</Title>
                </Group>
                <Text size="sm" mb="lg">
                  Mathematical-based graphics that maintain quality at any size. Perfect for logos, icons, and illustrations.
                </Text>
                <Stack gap="md">
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge variant="light" color="green" size="sm">SVG</Badge>
                      <Text size="sm" fw={500}>Scalable Vector Graphics</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Best for: Web icons, logos, simple illustrations</Text>
                  </div>
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge variant="light" color="green" size="sm">PDF</Badge>
                      <Text size="sm" fw={500}>Portable Document Format</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Best for: Print documents, professional presentations</Text>
                  </div>
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge variant="light" color="green" size="sm">EPS</Badge>
                      <Text size="sm" fw={500}>Encapsulated PostScript</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Best for: Professional printing, design workflows</Text>
                  </div>
                </Stack>
              </Paper>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20 h-full">
                <Group gap="sm" mb="md">
                  <FileImage className="h-6 w-6 text-blue-600" />
                  <Title order={3} c="blue">Raster Formats (Pixel-Based)</Title>
                </Group>
                <Text size="sm" mb="lg">
                  Pixel-grid based images ideal for photographs and complex color gradients with millions of colors.
                </Text>
                <Stack gap="md">
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge variant="light" color="blue" size="sm">PNG</Badge>
                      <Text size="sm" fw={500}>Portable Network Graphics</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Best for: Logos with transparency, web graphics</Text>
                  </div>
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge variant="light" color="blue" size="sm">JPG</Badge>
                      <Text size="sm" fw={500}>Joint Photographic Experts Group</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Best for: Photographs, complex images, web optimization</Text>
                  </div>
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge variant="light" color="blue" size="sm">WebP</Badge>
                      <Text size="sm" fw={500}>Modern Web Format</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Best for: Modern web applications, faster loading</Text>
                  </div>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Conversion Best Practices */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Format Conversion Best Practices</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <Title order={3} c="blue">Web Optimization</Title>
                </Group>
                <List size="sm" spacing="sm">
                  <List.Item>SVG for icons and logos (infinite scaling)</List.Item>
                  <List.Item>WebP for modern browsers (superior compression)</List.Item>
                  <List.Item>PNG for images requiring transparency</List.Item>
                  <List.Item>JPG for photographs (smaller file sizes)</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50 dark:bg-green-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Printer className="h-5 w-5 text-green-600" />
                  <Title order={3} c="green">Print Production</Title>
                </Group>
                <List size="sm" spacing="sm">
                  <List.Item>PDF for multi-page documents and presentations</List.Item>
                  <List.Item>EPS for professional design workflows</List.Item>
                  <List.Item>High-resolution PNG for detailed graphics</List.Item>
                  <List.Item>Vector formats for scalable print materials</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50 dark:bg-purple-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Award className="h-5 w-5 text-purple-600" />
                  <Title order={3} c="purple">Quality Preservation</Title>
                </Group>
                <List size="sm" spacing="sm">
                  <List.Item>Always keep original vector files when possible</List.Item>
                  <List.Item>Use high quality settings for final outputs</List.Item>
                  <List.Item>Consider lossy vs lossless compression needs</List.Item>
                  <List.Item>Test converted files in intended applications</List.Item>
                </List>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Common Conversion Scenarios */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Common Conversion Scenarios & Solutions</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="blue">Design to Web Workflow</Title>
              <Stack gap="md">
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Text fw={500} size="sm" mb="xs">Logo for Website</Text>
                  <Text size="xs" c="dimmed">AI/EPS → SVG (scalable) + PNG (fallback)</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Text fw={500} size="sm" mb="xs">Product Photos</Text>
                  <Text size="xs" c="dimmed">RAW/TIFF → JPG (compressed) + WebP (modern)</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Text fw={500} size="sm" mb="xs">UI Icons</Text>
                  <Text size="xs" c="dimmed">Sketch/Figma → SVG (icons) + PNG (sprites)</Text>
                </Paper>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="green">Print Production Workflow</Title>
              <Stack gap="md">
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Text fw={500} size="sm" mb="xs">Business Cards</Text>
                  <Text size="xs" c="dimmed">SVG/AI → PDF (print-ready) + EPS (backup)</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Text fw={500} size="sm" mb="xs">Large Format Banners</Text>
                  <Text size="xs" c="dimmed">Vector → PDF (scalable) + High-res PNG</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Text fw={500} size="sm" mb="xs">Brochures & Catalogs</Text>
                  <Text size="xs" c="dimmed">InDesign → PDF (final) + JPG (web preview)</Text>
                </Paper>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Professional Services */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Need Professional Vector Conversion?</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Text size="lg" mb="md">
                While our format converter handles standard conversions, some projects require professional attention:
              </Text>
              <List spacing="sm" size="sm" icon={<CheckCircle size={16} className="text-green-500" />}>
                <List.Item>Converting complex raster logos to perfect vector graphics</List.Item>
                <List.Item>Color-matching and brand consistency across formats</List.Item>
                <List.Item>Technical drawings and CAD file conversions</List.Item>
                <List.Item>Large batch processing with quality control</List.Item>
                <List.Item>Custom optimization for specific use cases</List.Item>
              </List>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="md">
                <Button component={Link} href="/order/new" size="lg" color="green" fullWidth data-testid="professional-conversion-cta">
                  Get Professional Conversion
                </Button>
                <Button component={Link} href="/tools/vector-checker" variant="outline" size="lg" fullWidth>
                  Check File Format First
                </Button>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Technical Information */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Technical Specifications & Limits</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md">Supported Input Formats</Title>
              <Group gap="xs" mb="md">
                <Badge variant="light" color="green">SVG</Badge>
                <Badge variant="light" color="green">AI</Badge>
                <Badge variant="light" color="green">EPS</Badge>
                <Badge variant="light" color="green">PDF</Badge>
                <Badge variant="light" color="blue">PNG</Badge>
                <Badge variant="light" color="blue">JPG</Badge>
                <Badge variant="light" color="blue">WebP</Badge>
                <Badge variant="light" color="blue">GIF</Badge>
              </Group>
              <Text size="sm" c="dimmed">Maximum file size: 50MB per file</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md">Quality Settings</Title>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">High Quality</Text>
                  <Text size="xs" c="dimmed">95-100% (Print Ready)</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Medium Quality</Text>
                  <Text size="xs" c="dimmed">75-85% (Web Optimized)</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Low Quality</Text>
                  <Text size="xs" c="dimmed">50-65% (Smallest Size)</Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>
      </Container>
    </div>
  );
}