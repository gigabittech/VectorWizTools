import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/Navigation";
import { useEffect } from "react";
import AspectRatioCalculator from "@/components/tools/AspectRatioCalculator";
import { Button, Paper, Title, Container, Group, Stack, Grid, Text, List, Badge } from "@mantine/core";
import { ArrowLeft, Maximize, Monitor, Smartphone, Camera, CheckCircle, Award, Globe } from "lucide-react";
import { Link } from "wouter";

export default function AspectRatioCalculatorPage() {
  const { isLoading } = useAuth();

  useEffect(() => {
    // Set SEO metadata
    document.title = "Free Aspect Ratio Calculator Tool | Resize Images Proportionally | VectorWiz";
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Calculate aspect ratios and resize images proportionally. Perfect for responsive design, photography, video editing, and maintaining consistent dimensions across platforms.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(metaDescription);
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Free Aspect Ratio Calculator | Resize Images Proportionally');
    if (!document.querySelector('meta[property="og:title"]')) {
      document.head.appendChild(ogTitle);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Calculate aspect ratios and resize images proportionally for responsive design and photography.');
    if (!document.querySelector('meta[property="og:description"]')) {
      document.head.appendChild(ogDescription);
    }

    // Structured Data for SEO - Always update for current tool
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Aspect Ratio Calculator",
      "description": "Calculate aspect ratios and resize images proportionally for responsive design",
      "url": "https://vectorwiz.com/tools/aspect-ratio-calculator",
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
    ogImage.setAttribute('content', 'https://vectorwiz.com/og-aspect-ratio.png');
    if (!document.querySelector('meta[property="og:image"]')) {
      document.head.appendChild(ogImage);
    }

    const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', 'https://vectorwiz.com/tools/aspect-ratio-calculator');
    if (!document.querySelector('meta[property="og:url"]')) {
      document.head.appendChild(ogUrl);
    }

    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', 'https://vectorwiz.com/tools/aspect-ratio-calculator');
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
          <Text c="dimmed">Loading aspect ratio calculator...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navigation />
      
      <Container size="xl" py="xl" data-testid="aspect-ratio-calculator-page">
        <div className="mb-8">
          <Link href="/tools">
            <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} mb="md" data-testid="back-to-tools">
              Back to Tools
            </Button>
          </Link>
          
          <Group align="flex-start" gap="lg" mb="xl">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
              <Maximize className="h-8 w-8 text-teal-600" />
            </div>
            <div>
              <Title order={1} size="h1" mb="xs">Free Aspect Ratio Calculator Tool</Title>
              <Text size="lg" c="dimmed" mb="md">
                Calculate aspect ratios and resize images proportionally. Perfect for responsive design, 
                photography, video editing, and maintaining consistent dimensions across platforms.
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="teal">Proportional Scaling</Badge>
                <Badge variant="light" color="blue">No Distortion</Badge>
                <Badge variant="light" color="green">Multiple Formats</Badge>
              </Group>
            </div>
          </Group>
        </div>

        <AspectRatioCalculator />

        {/* Aspect Ratio Applications */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg" ta="center">Aspect Ratio Applications Across Industries</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <Title order={3} c="blue">Web Design</Title>
                </Group>
                <Text size="sm" mb="md">Responsive layouts and image optimization</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Responsive image scaling</List.Item>
                  <List.Item>Hero banner dimensions</List.Item>
                  <List.Item>Thumbnail generation</List.Item>
                  <List.Item>Social media previews</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50 dark:bg-green-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Camera className="h-5 w-5 text-green-600" />
                  <Title order={3} c="green">Photography</Title>
                </Group>
                <Text size="sm" mb="md">Print sizing and composition planning</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Print size calculations</List.Item>
                  <List.Item>Crop planning for different formats</List.Item>
                  <List.Item>Frame and mat sizing</List.Item>
                  <List.Item>Portfolio consistency</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50 dark:bg-purple-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Monitor className="h-5 w-5 text-purple-600" />
                  <Title order={3} c="purple">Video & Media</Title>
                </Group>
                <Text size="sm" mb="md">Screen formats and video production</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Video resolution planning</List.Item>
                  <List.Item>Multi-platform content creation</List.Item>
                  <List.Item>Display calibration</List.Item>
                  <List.Item>Streaming optimization</List.Item>
                </List>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Common Aspect Ratios Deep Dive */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Understanding Common Aspect Ratios</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="blue">Display Standards</Title>
              <Stack gap="md">
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Group justify="space-between" align="center" mb="xs">
                    <Text fw={500} size="sm">16:9 (Widescreen)</Text>
                    <Monitor size={16} className="text-blue-600" />
                  </Group>
                  <Text size="xs" c="dimmed">HDTV, YouTube, modern laptops, gaming</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Group justify="space-between" align="center" mb="xs">
                    <Text fw={500} size="sm">4:3 (Standard)</Text>
                    <Monitor size={16} className="text-gray-600" />
                  </Group>
                  <Text size="xs" c="dimmed">Classic TV, older monitors, iPad</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Group justify="space-between" align="center" mb="xs">
                    <Text fw={500} size="sm">21:9 (Ultrawide)</Text>
                    <Monitor size={16} className="text-purple-600" />
                  </Group>
                  <Text size="xs" c="dimmed">Cinema, gaming monitors, productivity</Text>
                </Paper>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="green">Mobile & Photography</Title>
              <Stack gap="md">
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Group justify="space-between" align="center" mb="xs">
                    <Text fw={500} size="sm">9:16 (Vertical)</Text>
                    <Smartphone size={16} className="text-green-600" />
                  </Group>
                  <Text size="xs" c="dimmed">Mobile screens, Instagram Stories, TikTok</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Group justify="space-between" align="center" mb="xs">
                    <Text fw={500} size="sm">3:2 (Photography)</Text>
                    <Camera size={16} className="text-orange-600" />
                  </Group>
                  <Text size="xs" c="dimmed">35mm film, DSLR sensors, print photos</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                  <Group justify="space-between" align="center" mb="xs">
                    <Text fw={500} size="sm">1:1 (Square)</Text>
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  </Group>
                  <Text size="xs" c="dimmed">Instagram posts, profile pictures, logos</Text>
                </Paper>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Proportional Scaling Best Practices */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Proportional Scaling Best Practices</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md">Do's ✅</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Always maintain original aspect ratio when scaling</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Calculate one dimension from the other</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Test how images look at target dimensions</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Create multiple sizes for responsive design</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Consider viewing distance and context</Text>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md">Don'ts ❌</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✕</span>
                  </div>
                  <Text size="sm">Never stretch images to fit arbitrary dimensions</Text>
                </Group>
                <Group gap="xs">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✕</span>
                  </div>
                  <Text size="sm">Avoid manually guessing proportional dimensions</Text>
                </Group>
                <Group gap="xs">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✕</span>
                  </div>
                  <Text size="sm">Don't ignore platform-specific requirements</Text>
                </Group>
                <Group gap="xs">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✕</span>
                  </div>
                  <Text size="sm">Skip testing at different screen densities</Text>
                </Group>
                <Group gap="xs">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✕</span>
                  </div>
                  <Text size="sm">Force unsuitable aspect ratios for content type</Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Professional Services CTA */}
        <Paper withBorder shadow="md" p="xl" mt="xl" className="text-center">
          <Title order={2} mb="md">Professional Image Resizing Service</Title>
          <Text size="lg" c="dimmed" mb="xl" maw={600} mx="auto">
            Need bulk image resizing or complex aspect ratio conversions? Our team can process 
            thousands of images while maintaining perfect proportions and quality.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="lg" color="green" data-testid="image-resizing-cta">
              Get Professional Resizing
            </Button>
            <Button component={Link} href="/tools/print-size-calculator" variant="outline" size="lg">
              Calculate Print Sizes
            </Button>
          </Group>
        </Paper>
      </Container>
    </div>
  );
}