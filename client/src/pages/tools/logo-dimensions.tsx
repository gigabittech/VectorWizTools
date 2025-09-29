import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/Navigation";
import { useEffect } from "react";
import LogoDimensions from "@/components/tools/LogoDimensions";
import { Button, Paper, Title, Container, Group, Stack, Grid, Text, List, Badge } from "@mantine/core";
import { ArrowLeft, Monitor, Smartphone, FileText, CheckCircle, Award, Zap, Share2, Globe } from "lucide-react";
import { Link } from "wouter";

export default function LogoDimensionsPage() {
  const { isLoading } = useAuth();

  useEffect(() => {
    // Set SEO metadata
    document.title = "Free Logo Dimension Guide | Logo Sizes for All Platforms | VectorWiz";
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Complete logo dimension guide for social media, business materials, web graphics, and print. Get exact sizes for Facebook, Instagram, LinkedIn, business cards, and more.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(metaDescription);
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Free Logo Dimension Guide | Logo Sizes for All Platforms');
    if (!document.querySelector('meta[property="og:title"]')) {
      document.head.appendChild(ogTitle);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Complete reference for logo sizes across all platforms with exact dimensions and specifications.');
    if (!document.querySelector('meta[property="og:description"]')) {
      document.head.appendChild(ogDescription);
    }

    // Structured Data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Logo Dimension Guide",
      "description": "Complete reference for logo sizes across social media, business materials, and web platforms",
      "url": "https://vectorwiz.com/tools/logo-dimensions",
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
    ogImage.setAttribute('content', 'https://vectorwiz.com/og-logo-guide.png');
    if (!document.querySelector('meta[property="og:image"]')) {
      document.head.appendChild(ogImage);
    }

    const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', 'https://vectorwiz.com/tools/logo-dimensions');
    if (!document.querySelector('meta[property="og:url"]')) {
      document.head.appendChild(ogUrl);
    }

    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', 'https://vectorwiz.com/tools/logo-dimensions');
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
          <Text c="dimmed">Loading logo dimensions guide...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navigation />
      
      <Container size="xl" py="xl" data-testid="logo-dimensions-page">
        <div className="mb-8">
          <Link href="/tools">
            <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} mb="md" data-testid="back-to-tools">
              Back to Tools
            </Button>
          </Link>
          
          <Group align="flex-start" gap="lg" mb="xl">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Monitor className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <Title order={1} size="h1" mb="xs">Free Logo Dimension Generator & Guide</Title>
              <Text size="lg" c="dimmed" mb="md">
                Complete reference for logo sizes across all platforms. Get exact dimensions for social media, 
                business materials, web graphics, and print applications.
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="purple">All Platforms</Badge>
                <Badge variant="light" color="blue">Exact Dimensions</Badge>
                <Badge variant="light" color="green">Download Guides</Badge>
              </Group>
            </div>
          </Group>
        </div>

        <LogoDimensions />

        {/* Logo Strategy Guide */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg" ta="center">Logo Design Strategy for Multi-Platform Success</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <Title order={3} c="blue">Responsive Design</Title>
                </Group>
                <Text size="sm" mb="md">Design for scalability across all platforms</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Test readability at smallest required size</List.Item>
                  <List.Item>Create horizontal and vertical versions</List.Item>
                  <List.Item>Design icon-only version for small spaces</List.Item>
                  <List.Item>Ensure high contrast for accessibility</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50 dark:bg-green-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Share2 className="h-5 w-5 text-green-600" />
                  <Title order={3} c="green">Social Media Optimization</Title>
                </Group>
                <Text size="sm" mb="md">Maximize impact across social platforms</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Create platform-specific variations</List.Item>
                  <List.Item>Consider circular cropping for profiles</List.Item>
                  <List.Item>Use bold, simple designs for small displays</List.Item>
                  <List.Item>Test appearance in dark and light modes</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50 dark:bg-purple-950/20 h-full">
                <Group gap="sm" mb="md">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <Title order={3} c="purple">Brand Consistency</Title>
                </Group>
                <Text size="sm" mb="md">Maintain unified brand identity</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Document logo usage guidelines</List.Item>
                  <List.Item>Create templates for common applications</List.Item>
                  <List.Item>Provide clear spacing requirements</List.Item>
                  <List.Item>Define acceptable color variations</List.Item>
                </List>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Platform-Specific Tips */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Platform-Specific Optimization Tips</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="blue">Social Media Best Practices</Title>
              <Stack gap="md">
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Text fw={500} size="sm" mb="xs">Facebook & Instagram</Text>
                  <Text size="xs" c="dimmed">High contrast needed for mobile viewing</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Text fw={500} size="sm" mb="xs">LinkedIn</Text>
                  <Text size="xs" c="dimmed">Professional appearance, avoid overly casual designs</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Text fw={500} size="sm" mb="xs">Twitter/X</Text>
                  <Text size="xs" c="dimmed">Simple, recognizable at very small sizes</Text>
                </Paper>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="green">Business Applications</Title>
              <Stack gap="md">
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Text fw={500} size="sm" mb="xs">Business Cards</Text>
                  <Text size="xs" c="dimmed">Vector format essential for crisp printing</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Text fw={500} size="sm" mb="xs">Email Signatures</Text>
                  <Text size="xs" c="dimmed">Small file size, web-optimized PNG format</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Text fw={500} size="sm" mb="xs">Presentations</Text>
                  <Text size="xs" c="dimmed">Transparent background for versatility</Text>
                </Paper>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Professional Services CTA */}
        <Paper withBorder shadow="md" p="xl" mt="xl" className="text-center">
          <Title order={2} mb="md">Professional Logo Package Creation</Title>
          <Text size="lg" c="dimmed" mb="xl" maw={600} mx="auto">
            Need a complete logo package with all dimensions and formats? Our designers create 
            comprehensive logo sets optimized for every platform and application.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="lg" color="green" data-testid="logo-package-cta">
              Get Complete Logo Package
            </Button>
            <Button component={Link} href="/tools/vector-checker" variant="outline" size="lg">
              Check Logo Format
            </Button>
          </Group>
        </Paper>
      </Container>
    </div>
  );
}