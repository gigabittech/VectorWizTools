import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/Navigation";
import { useEffect } from "react";
import FileSizeCalculator from "@/components/tools/FileSizeCalculator";
import { Button, Paper, Title, Container, Group, Stack, Grid, Text, List, Badge } from "@mantine/core";
import { ArrowLeft, HardDrive, Calculator, CheckCircle, Award, Zap, Monitor, Printer } from "lucide-react";
import { Link } from "wouter";

export default function FileSizeCalculatorPage() {
  const { isLoading } = useAuth();

  useEffect(() => {
    // Set SEO metadata
    document.title = "Free File Size Calculator Tool | Calculate Image File Sizes | VectorWiz";
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Calculate estimated file sizes for different image formats and compression settings. Perfect for planning storage needs and optimizing web performance with accurate size estimates.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(metaDescription);
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Free File Size Calculator Tool | Calculate Image File Sizes');
    if (!document.querySelector('meta[property="og:title"]')) {
      document.head.appendChild(ogTitle);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Calculate estimated file sizes for different formats and optimize web performance.');
    if (!document.querySelector('meta[property="og:description"]')) {
      document.head.appendChild(ogDescription);
    }

    // Structured Data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "File Size Calculator",
      "description": "Calculate estimated file sizes for different image formats and compression settings",
      "url": "https://vectorwiz.com/tools/file-size-calculator",
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
    ogImage.setAttribute('content', 'https://vectorwiz.com/og-file-size.png');
    if (!document.querySelector('meta[property="og:image"]')) {
      document.head.appendChild(ogImage);
    }

    const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', 'https://vectorwiz.com/tools/file-size-calculator');
    if (!document.querySelector('meta[property="og:url"]')) {
      document.head.appendChild(ogUrl);
    }

    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', 'https://vectorwiz.com/tools/file-size-calculator');
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
          <Text c="dimmed">Loading file size calculator...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navigation />
      
      <Container size="xl" py="xl" data-testid="file-size-calculator-page">
        <div className="mb-8">
          <Link href="/tools">
            <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} mb="md" data-testid="back-to-tools">
              Back to Tools
            </Button>
          </Link>
          
          <Group align="flex-start" gap="lg" mb="xl">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <HardDrive className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <Title order={1} size="h1" mb="xs">Free File Size Calculator Tool</Title>
              <Text size="lg" c="dimmed" mb="md">
                Calculate estimated file sizes for different image formats and compression settings. 
                Perfect for planning storage needs and optimizing web performance.
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="orange">Size Estimation</Badge>
                <Badge variant="light" color="blue">Multiple Formats</Badge>
                <Badge variant="light" color="green">Optimization Tips</Badge>
              </Group>
            </div>
          </Group>
        </div>

        <FileSizeCalculator />

        {/* File Size Optimization Guide */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg" ta="center">File Size Optimization Strategies</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  <Title order={3} c="blue">Web Optimization</Title>
                </Group>
                <List size="sm" spacing="sm">
                  <List.Item>Use WebP for modern browsers (30% smaller)</List.Item>
                  <List.Item>Optimize JPEG quality (80-85% for photos)</List.Item>
                  <List.Item>Use PNG for graphics with transparency</List.Item>
                  <List.Item>Implement responsive images with srcset</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50 dark:bg-green-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Printer className="h-5 w-5 text-green-600" />
                  <Title order={3} c="green">Print Planning</Title>
                </Group>
                <List size="sm" spacing="sm">
                  <List.Item>Calculate storage for high-DPI print files</List.Item>
                  <List.Item>Plan batch processing requirements</List.Item>
                  <List.Item>Estimate upload/download times</List.Item>
                  <List.Item>Budget for cloud storage costs</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50 dark:bg-purple-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <Title order={3} c="purple">Performance Tips</Title>
                </Group>
                <List size="sm" spacing="sm">
                  <List.Item>Compress images before uploading</List.Item>
                  <List.Item>Use progressive JPEG for large photos</List.Item>
                  <List.Item>Implement lazy loading for images</List.Item>
                  <List.Item>Consider CDN for global delivery</List.Item>
                </List>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Professional Services CTA */}
        <Paper withBorder shadow="md" p="xl" mt="xl" className="text-center">
          <Title order={2} mb="md">Need Professional File Optimization?</Title>
          <Text size="lg" c="dimmed" mb="xl" maw={600} mx="auto">
            Our experts can help optimize your entire image library for web performance, 
            storage efficiency, and loading speed across all devices.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="lg" color="green" data-testid="optimization-service-cta">
              Get Professional Optimization
            </Button>
            <Button component={Link} href="/tools/format-converter" variant="outline" size="lg">
              Convert File Formats
            </Button>
          </Group>
        </Paper>
      </Container>
    </div>
  );
}