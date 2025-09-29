import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/Navigation";
import { useEffect } from "react";
import FontToVector from "@/components/tools/FontToVector";
import { Button, Paper, Title, Container, Group, Stack, Grid, Text, List, Badge } from "@mantine/core";
import { ArrowLeft, Type, FileText, CheckCircle, Award, Zap, Palette, Download } from "lucide-react";
import { Link } from "wouter";

export default function FontToVectorPage() {
  const { isLoading } = useAuth();

  useEffect(() => {
    // Set SEO metadata
    document.title = "Free Font to Vector Converter Tool | Text to Vector Graphics | VectorWiz";
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Convert text and fonts into editable vector graphics. Perfect for logo creation, sign making, and ensuring font independence across all platforms and devices.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(metaDescription);
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Free Font to Vector Converter | Text to Vector Graphics');
    if (!document.querySelector('meta[property="og:title"]')) {
      document.head.appendChild(ogTitle);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Convert text and fonts into editable vector graphics for professional design work.');
    if (!document.querySelector('meta[property="og:description"]')) {
      document.head.appendChild(ogDescription);
    }

    // Structured Data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Font to Vector Converter",
      "description": "Convert text and fonts into editable vector graphics for logo creation and professional design",
      "url": "https://vectorwiz.com/tools/font-to-vector",
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
    ogImage.setAttribute('content', 'https://vectorwiz.com/og-font-converter.png');
    if (!document.querySelector('meta[property="og:image"]')) {
      document.head.appendChild(ogImage);
    }

    const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', 'https://vectorwiz.com/tools/font-to-vector');
    if (!document.querySelector('meta[property="og:url"]')) {
      document.head.appendChild(ogUrl);
    }

    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', 'https://vectorwiz.com/tools/font-to-vector');
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
          <Text c="dimmed">Loading font to vector converter...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navigation />
      
      <Container size="xl" py="xl" data-testid="font-to-vector-page">
        <div className="mb-8">
          <Link href="/tools">
            <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} mb="md" data-testid="back-to-tools">
              Back to Tools
            </Button>
          </Link>
          
          <Group align="flex-start" gap="lg" mb="xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <Type className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <Title order={1} size="h1" mb="xs">Free Font to Vector Converter Tool</Title>
              <Text size="lg" c="dimmed" mb="md">
                Convert text and fonts into editable vector graphics. Perfect for logo creation, 
                sign making, and ensuring font independence across all platforms and devices.
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="red">Text to Vector</Badge>
                <Badge variant="light" color="blue">Font Independence</Badge>
                <Badge variant="light" color="green">Editable Paths</Badge>
              </Group>
            </div>
          </Group>
        </div>

        <FontToVector />

        {/* Font to Vector Applications */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg" ta="center">Professional Applications for Vector Text</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20 h-full">
                <Group gap="sm" mb="md">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <Title order={3} c="blue">Logo & Branding</Title>
                </Group>
                <Text size="sm" mb="md">Create scalable brand elements</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Company logos with custom typography</List.Item>
                  <List.Item>Brand wordmarks and slogans</List.Item>
                  <List.Item>Marketing campaign headlines</List.Item>
                  <List.Item>Trademark-ready text elements</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50 dark:bg-green-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Palette className="h-5 w-5 text-green-600" />
                  <Title order={3} c="green">Manufacturing</Title>
                </Group>
                <Text size="sm" mb="md">Physical production and cutting</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Vinyl cutting and signage</List.Item>
                  <List.Item>Laser engraving and etching</List.Item>
                  <List.Item>CNC routing and milling</List.Item>
                  <List.Item>3D printing text elements</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50 dark:bg-purple-950/20 h-full">
                <Group gap="sm" mb="md">
                  <Download className="h-5 w-5 text-purple-600" />
                  <Title order={3} c="purple">Design Workflow</Title>
                </Group>
                <Text size="sm" mb="md">Professional design integration</Text>
                <List size="sm" spacing="sm">
                  <List.Item>Font-independent file sharing</List.Item>
                  <List.Item>Custom lettering and typography</List.Item>
                  <List.Item>Illustration integration</List.Item>
                  <List.Item>Print production workflows</List.Item>
                </List>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Font Selection Guidelines */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Font Selection for Vector Conversion</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="green">Best Font Types ✅</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm"><strong>Sans-serif fonts</strong> - Clean, geometric shapes</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm"><strong>Simple serifs</strong> - Clear, well-defined serifs</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm"><strong>Bold weights</strong> - Stronger vector paths</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm"><strong>High x-height</strong> - Better readability when small</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm"><strong>Open letterforms</strong> - Clear negative space</Text>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="orange">Challenging Fonts ⚠️</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <Text size="sm"><strong>Script fonts</strong> - Complex curves and connections</Text>
                </Group>
                <Group gap="xs">
                  <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <Text size="sm"><strong>Decorative fonts</strong> - Intricate details may be lost</Text>
                </Group>
                <Group gap="xs">
                  <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <Text size="sm"><strong>Thin weights</strong> - May become invisible at small sizes</Text>
                </Group>
                <Group gap="xs">
                  <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <Text size="sm"><strong>Condensed fonts</strong> - Narrow letterforms may merge</Text>
                </Group>
                <Group gap="xs">
                  <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <Text size="sm"><strong>Small text sizes</strong> - Details lost in conversion</Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Vector Text Benefits */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Benefits of Vector Text Over Font Files</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="blue">Technical Advantages</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">No font licensing issues or restrictions</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Consistent appearance across all devices</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">No missing font errors in design files</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Editable paths for custom modifications</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Perfect for manufacturing and production</Text>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="green">Creative Benefits</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <Award size={16} className="text-blue-500" />
                  <Text size="sm">Customize individual letterforms and spacing</Text>
                </Group>
                <Group gap="xs">
                  <Award size={16} className="text-blue-500" />
                  <Text size="sm">Apply gradients and complex fills to text</Text>
                </Group>
                <Group gap="xs">
                  <Award size={16} className="text-blue-500" />
                  <Text size="sm">Create unique decorative text effects</Text>
                </Group>
                <Group gap="xs">
                  <Award size={16} className="text-blue-500" />
                  <Text size="sm">Integrate text seamlessly with illustrations</Text>
                </Group>
                <Group gap="xs">
                  <Award size={16} className="text-blue-500" />
                  <Text size="sm">Archive designs without font dependencies</Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Professional Services CTA */}
        <Paper withBorder shadow="md" p="xl" mt="xl" className="text-center">
          <Title order={2} mb="md">Professional Typography & Logo Services</Title>
          <Text size="lg" c="dimmed" mb="xl" maw={600} mx="auto">
            Need custom lettering or complex typography conversion? Our designers can create 
            unique vector wordmarks and handle challenging font conversions with perfect results.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="lg" color="green" data-testid="typography-service-cta">
              Get Custom Typography
            </Button>
            <Button component={Link} href="/tools/logo-dimensions" variant="outline" size="lg">
              Logo Size Guide
            </Button>
          </Group>
        </Paper>
      </Container>
    </div>
  );
}