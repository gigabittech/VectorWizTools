import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import VectorSimplifier from "@/components/tools/VectorSimplifier";
import { Button, Paper, Title, Container, Group, Stack, Grid, Text, List, Badge } from "@mantine/core";
import { ArrowLeft, Zap, Settings, CheckCircle, Award, Globe, FileText, Download } from "lucide-react";
import { Link } from "wouter";

export default function VectorSimplifierPage() {
  const { isLoading } = useAuth();

  useEffect(() => {
    // Set SEO metadata
    document.title = "Free Vector Simplification Tool | Optimize SVG Files | VectorWiz";
    
    // Meta description  
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Optimize SVG files and vector graphics for web performance. Reduce file sizes, simplify paths, and improve loading speed without sacrificing visual quality.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(metaDescription);
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Free Vector Simplification Tool | Optimize SVG Files');
    if (!document.querySelector('meta[property="og:title"]')) {
      document.head.appendChild(ogTitle);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Optimize SVG files for web performance by reducing file sizes without quality loss.');
    if (!document.querySelector('meta[property="og:description"]')) {
      document.head.appendChild(ogDescription);
    }

    // Structured Data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication", 
      "name": "Vector Simplification Tool",
      "description": "Optimize SVG files and vector graphics for web performance with intelligent simplification",
      "url": "https://vectorwiz.com/tools/vector-simplifier",
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
    ogImage.setAttribute('content', 'https://vectorwiz.com/og-vector-optimizer.png');
    if (!document.querySelector('meta[property="og:image"]')) {
      document.head.appendChild(ogImage);
    }

    const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', 'https://vectorwiz.com/tools/vector-simplifier');
    if (!document.querySelector('meta[property="og:url"]')) {
      document.head.appendChild(ogUrl);
    }

    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', 'https://vectorwiz.com/tools/vector-simplifier');
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
          <Text c="dimmed">Loading vector simplifier...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      
      <Container size="xl" py="xl" data-testid="vector-simplifier-page">
        <div className="mb-8">
          <Link href="/tools">
            <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} mb="md" data-testid="back-to-tools">
              Back to Tools
            </Button>
          </Link>
          
          <Group align="flex-start" gap="lg" mb="xl">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <Title order={1} size="h1" mb="xs">Free Vector Simplification Tool</Title>
              <Text size="lg" c="dimmed" mb="md">
                Optimize SVG files and vector graphics for web performance. Reduce file sizes, simplify paths, 
                and improve loading speed without sacrificing visual quality.
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="yellow">File Optimization</Badge>
                <Badge variant="light" color="blue">Web Performance</Badge>
                <Badge variant="light" color="green">Quality Preservation</Badge>
              </Group>
            </div>
          </Group>
        </div>

        <VectorSimplifier />

        {/* Vector Optimization Benefits */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg" ta="center">Why Optimize Vector Graphics?</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <Title order={3} c="blue">Web Performance</Title>
                </Group>
                <Text size="sm" mb="md">Faster loading, better user experience</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Reduced bandwidth usage</List.Item>
                  <List.Item>Faster page load times</List.Item>
                  <List.Item>Improved SEO rankings</List.Item>
                  <List.Item>Better mobile performance</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50 dark:bg-green-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Settings className="h-5 w-5 text-green-600" />
                  <Title order={3} c="green">Technical Benefits</Title>
                </Group>
                <Text size="sm" mb="md">Cleaner code, easier maintenance</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Simplified SVG code structure</List.Item>
                  <List.Item>Fewer DOM nodes to render</List.Item>
                  <List.Item>Reduced server storage costs</List.Item>
                  <List.Item>Faster CSS animations</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50 dark:bg-purple-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Award className="h-5 w-5 text-purple-600" />
                  <Title order={3} c="purple">Design Quality</Title>
                </Group>
                <Text size="sm" mb="md">Maintain visual fidelity</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Intelligent path optimization</List.Item>
                  <List.Item>Preserve important details</List.Item>
                  <List.Item>Remove redundant elements</List.Item>
                  <List.Item>Clean up design artifacts</List.Item>
                </List>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Optimization Strategies */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Vector Optimization Strategies</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="blue">Automated Optimizations</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Remove unnecessary metadata and comments</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Simplify path data and reduce decimal precision</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Merge overlapping paths and shapes</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Remove hidden or zero-opacity elements</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Optimize color values and gradients</Text>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="green">Best Practices</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Always backup original files before optimization</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Test optimized files in target applications</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Start with conservative settings</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Compare visual quality at different zoom levels</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Monitor file size vs. quality trade-offs</Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Professional Services CTA */}
        <Paper withBorder shadow="md" p="xl" mt="xl" className="text-center">
          <Title order={2} mb="md">Professional Vector Optimization Service</Title>
          <Text size="lg" c="dimmed" mb="xl" maw={600} mx="auto">
            Need bulk optimization or custom vector cleaning? Our experts can optimize entire 
            icon libraries and illustration sets while maintaining perfect quality.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="lg" color="green" data-testid="vector-optimization-cta">
              Get Professional Optimization
            </Button>
            <Button component={Link} href="/tools/format-converter" variant="outline" size="lg">
              Convert Vector Formats
            </Button>
          </Group>
        </Paper>
      </Container>
    </div>
  );
}