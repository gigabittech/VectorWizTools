import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/Navigation";
import { useEffect } from "react";
import PrintSizeCalculator from "@/components/tools/PrintSizeCalculator";
import { Button, Paper, Title, Container, Group, Stack, Grid, Text, List, Badge } from "@mantine/core";
import { ArrowLeft, Ruler, Printer, CheckCircle, Award, Zap, Camera, FileText } from "lucide-react";
import { Link } from "wouter";

export default function PrintSizeCalculatorPage() {
  const { isLoading } = useAuth();

  useEffect(() => {
    // Set SEO metadata
    document.title = "Free Print Size Calculator Tool | Calculate Maximum Print Dimensions | VectorWiz";
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Calculate maximum print dimensions from image resolution. Determine optimal sizes for business cards, posters, banners, and professional printing projects with DPI optimization.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(metaDescription);
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Free Print Size Calculator | Calculate Maximum Print Dimensions');
    if (!document.querySelector('meta[property="og:title"]')) {
      document.head.appendChild(ogTitle);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Calculate maximum print dimensions from image resolution for professional printing projects.');
    if (!document.querySelector('meta[property="og:description"]')) {
      document.head.appendChild(ogDescription);
    }

    // Structured Data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Print Size Calculator",
      "description": "Calculate maximum print dimensions from image resolution with DPI optimization",
      "url": "https://vectorwiz.com/tools/print-size-calculator",
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
    ogImage.setAttribute('content', 'https://vectorwiz.com/og-print-calculator.png');
    if (!document.querySelector('meta[property="og:image"]')) {
      document.head.appendChild(ogImage);
    }

    const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', 'https://vectorwiz.com/tools/print-size-calculator');
    if (!document.querySelector('meta[property="og:url"]')) {
      document.head.appendChild(ogUrl);
    }

    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', 'https://vectorwiz.com/tools/print-size-calculator');
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
          <Text c="dimmed">Loading print size calculator...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navigation />
      
      <Container size="xl" py="xl" data-testid="print-size-calculator-page">
        <div className="mb-8">
          <Link href="/tools">
            <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} mb="md" data-testid="back-to-tools">
              Back to Tools
            </Button>
          </Link>
          
          <Group align="flex-start" gap="lg" mb="xl">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Ruler className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <Title order={1} size="h1" mb="xs">Free Print Size Calculator Tool</Title>
              <Text size="lg" c="dimmed" mb="md">
                Calculate maximum print dimensions from your image resolution. Determine optimal sizes 
                for business cards, posters, banners, and professional printing projects.
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="green">Print Planning</Badge>
                <Badge variant="light" color="blue">DPI Optimization</Badge>
                <Badge variant="light" color="purple">Professional Quality</Badge>
              </Group>
            </div>
          </Group>
        </div>

        <PrintSizeCalculator />

        {/* Print Quality Standards */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg" ta="center">Professional Print Quality Standards</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50 dark:bg-green-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Award className="h-5 w-5 text-green-600" />
                  <Title order={3} c="green">High-End Printing</Title>
                </Group>
                <Text size="sm" mb="md">300+ DPI for professional results</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Business cards and brochures</List.Item>
                  <List.Item>Magazine and book printing</List.Item>
                  <List.Item>Fine art reproductions</List.Item>
                  <List.Item>Marketing materials</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Printer className="h-5 w-5 text-blue-600" />
                  <Title order={3} c="blue">Large Format</Title>
                </Group>
                <Text size="sm" mb="md">150-300 DPI for viewing distance</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Posters and displays</List.Item>
                  <List.Item>Trade show graphics</List.Item>
                  <List.Item>Banners and signs</List.Item>
                  <List.Item>Vehicle wraps</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50 dark:bg-purple-950/20 h-full">
                <Group gap="sm" mb="md">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <Title order={3} c="purple">Digital & Web</Title>
                </Group>
                <Text size="sm" mb="md">72-150 DPI for screen display</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Website images</List.Item>
                  <List.Item>Email newsletters</List.Item>
                  <List.Item>Social media graphics</List.Item>
                  <List.Item>Digital presentations</List.Item>
                </List>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Print Preparation Checklist */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Pre-Press Preparation Checklist</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md">Before Printing</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Verify resolution meets minimum DPI requirements</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Check color mode (RGB for digital, CMYK for print)</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Confirm final dimensions and crop areas</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Include bleed area for full-bleed prints</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Test print on similar paper/material</Text>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md">Quality Assurance</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Review colors on calibrated monitor</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Check text readability at final size</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Verify all fonts are embedded or outlined</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Confirm paper type and finish requirements</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Get client approval on proof prints</Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Professional Services CTA */}
        <Paper withBorder shadow="md" p="xl" mt="xl" className="text-center">
          <Title order={2} mb="md">Professional Print Preparation Service</Title>
          <Text size="lg" c="dimmed" mb="xl" maw={600} mx="auto">
            Let our experts prepare your graphics for professional printing. We ensure optimal 
            resolution, color accuracy, and print-ready files for any project size.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="lg" color="green" data-testid="print-prep-service-cta">
              Get Print Preparation Service
            </Button>
            <Button component={Link} href="/tools/dpi-calculator" variant="outline" size="lg">
              Check DPI First
            </Button>
          </Group>
        </Paper>
      </Container>
    </div>
  );
}