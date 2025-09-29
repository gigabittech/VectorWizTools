import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import BeforeAfterSlider from "@/components/tools/BeforeAfterSlider";
import { Paper, Title, Button, Grid, Text, Badge, Group, Container } from "@mantine/core";
import { Calculator, Clock, Search, Eye, Plus, Repeat, Palette, HardDrive, Ruler, Monitor, Zap, Maximize, Type } from "lucide-react";
import { Link } from "wouter";

export default function Tools() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Tools page is publicly accessible - no authentication check needed

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold">V</span>
          </div>
          <p className="text-muted-foreground">Loading tools...</p>
        </div>
      </div>
    );
  }

  // Tools work for both authenticated and guest users

  return (
    <div className="bg-gradient-to-br from-background to-muted">
      
      <Container size="xl" py="xl" data-testid="tools-page">
        <div className="mb-8">
          <Group justify="space-between" align="flex-start" mb="xl">
            <div>
              <Title order={1} size="h1" mb="xs">Professional Vector Tools</Title>
              <Text size="lg" c="dimmed">
                Free tools to help you prepare and optimize your vector graphics projects
              </Text>
            </div>
            
            <Button 
              component={Link}
              href="/order/new"
              color="green"
              size="lg"
              leftSection={<Plus size={16} />}
              data-testid="start-new-order"
            >
              Start New Order
            </Button>
          </Group>
        </div>

        {/* Available Tools Grid */}
        <div className="mb-16">
          <Title order={2} mb="xl" ta="center">Professional Vector Tools</Title>
          <Grid gutter="lg">

            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Paper withBorder shadow="md" p="xl" className="h-full hover:shadow-lg transition-shadow">
                <Group gap="sm" mb="md">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Calculator className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <Title order={3} size="h4">DPI Calculator</Title>
                    <Badge variant="light" color="blue" size="sm">Free Tool</Badge>
                  </div>
                </Group>
                <Text size="sm" c="dimmed" mb="lg">
                  Calculate optimal DPI for print projects and determine if vectorization is needed for professional quality.
                </Text>
                <Button component={Link} href="/tools/dpi-calculator" fullWidth color="blue" data-testid="dpi-calculator-link">
                  Use DPI Calculator
                </Button>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Paper withBorder shadow="md" p="xl" className="h-full hover:shadow-lg transition-shadow">
                <Group gap="sm" mb="md">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <Title order={3} size="h4">Turnaround Estimator</Title>
                    <Badge variant="light" color="purple" size="sm">Instant Results</Badge>
                  </div>
                </Group>
                <Text size="sm" c="dimmed" mb="lg">
                  Get accurate delivery estimates based on service type, complexity, and current queue status.
                </Text>
                <Button component={Link} href="/tools/turnaround-estimator" fullWidth color="purple" data-testid="turnaround-estimator-link">
                  Get Time Estimate
                </Button>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Paper withBorder shadow="md" p="xl" className="h-full hover:shadow-lg transition-shadow">
                <Group gap="sm" mb="md">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <Search className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <Title order={3} size="h4">Vector Checker</Title>
                    <Badge variant="light" color="emerald" size="sm">Upload & Analyze</Badge>
                  </div>
                </Group>
                <Text size="sm" c="dimmed" mb="lg">
                  Upload files to instantly verify if they're true vectors or raster images and get recommendations.
                </Text>
                <Button component={Link} href="/tools/vector-checker" fullWidth color="green" data-testid="vector-checker-link">
                  Check File Format
                </Button>
              </Paper>
            </Grid.Col>
          </Grid>
        </div>

        {/* Additional Professional Tools */}
        <div className="mb-16">
          <Title order={2} mb="xl" ta="center">Additional Professional Tools</Title>
          <Grid gutter="lg">
            
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Paper withBorder shadow="md" p="xl" className="h-full hover:shadow-lg transition-shadow">
                <Group gap="sm" mb="md">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Repeat className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <Title order={3} size="h4">Format Converter</Title>
                    <Badge variant="light" color="blue" size="sm">Multiple Formats</Badge>
                  </div>
                </Group>
                <Text size="sm" c="dimmed" mb="lg">
                  Convert between SVG, PNG, JPG, WebP, PDF, and EPS formats instantly with professional quality.
                </Text>
                <Button component={Link} href="/tools/format-converter" fullWidth color="blue" data-testid="format-converter-link">
                  Convert Formats
                </Button>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Paper withBorder shadow="md" p="xl" className="h-full hover:shadow-lg transition-shadow">
                <Group gap="sm" mb="md">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Palette className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <Title order={3} size="h4">Color Extractor</Title>
                    <Badge variant="light" color="purple" size="sm">Brand Colors</Badge>
                  </div>
                </Group>
                <Text size="sm" c="dimmed" mb="lg">
                  Extract dominant colors from images and create professional color palettes for your brand.
                </Text>
                <Button component={Link} href="/tools/color-extractor" fullWidth color="purple" data-testid="color-extractor-link">
                  Extract Colors
                </Button>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Paper withBorder shadow="md" p="xl" className="h-full hover:shadow-lg transition-shadow">
                <Group gap="sm" mb="md">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <HardDrive className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <Title order={3} size="h4">File Size Calculator</Title>
                    <Badge variant="light" color="orange" size="sm">Size Planning</Badge>
                  </div>
                </Group>
                <Text size="sm" c="dimmed" mb="lg">
                  Calculate estimated file sizes for different formats and compression settings.
                </Text>
                <Button component={Link} href="/tools/file-size-calculator" fullWidth color="orange" data-testid="file-size-calculator-link">
                  Calculate Sizes
                </Button>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Paper withBorder shadow="md" p="xl" className="h-full hover:shadow-lg transition-shadow">
                <Group gap="sm" mb="md">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <Ruler className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <Title order={3} size="h4">Print Size Calculator</Title>
                    <Badge variant="light" color="green" size="sm">Print Ready</Badge>
                  </div>
                </Group>
                <Text size="sm" c="dimmed" mb="lg">
                  Calculate maximum print dimensions and check compatibility with standard formats.
                </Text>
                <Button component={Link} href="/tools/print-size-calculator" fullWidth color="green" data-testid="print-size-calculator-link">
                  Calculate Print Size
                </Button>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Paper withBorder shadow="md" p="xl" className="h-full hover:shadow-lg transition-shadow">
                <Group gap="sm" mb="md">
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                    <Monitor className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <Title order={3} size="h4">Logo Dimensions</Title>
                    <Badge variant="light" color="pink" size="sm">All Platforms</Badge>
                  </div>
                </Group>
                <Text size="sm" c="dimmed" mb="lg">
                  Complete guide for logo sizes across social media, business materials, and web platforms.
                </Text>
                <Button component={Link} href="/tools/logo-dimensions" fullWidth color="pink" data-testid="logo-dimensions-link">
                  Get Logo Sizes
                </Button>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Paper withBorder shadow="md" p="xl" className="h-full hover:shadow-lg transition-shadow">
                <Group gap="sm" mb="md">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <Title order={3} size="h4">Vector Simplifier</Title>
                    <Badge variant="light" color="yellow" size="sm">Optimization</Badge>
                  </div>
                </Group>
                <Text size="sm" c="dimmed" mb="lg">
                  Optimize SVG files for web performance by reducing file sizes without quality loss.
                </Text>
                <Button component={Link} href="/tools/vector-simplifier" fullWidth color="yellow" data-testid="vector-simplifier-link">
                  Simplify Vectors
                </Button>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Paper withBorder shadow="md" p="xl" className="h-full hover:shadow-lg transition-shadow">
                <Group gap="sm" mb="md">
                  <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                    <Maximize className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <Title order={3} size="h4">Aspect Ratio Calculator</Title>
                    <Badge variant="light" color="teal" size="sm">Proportional</Badge>
                  </div>
                </Group>
                <Text size="sm" c="dimmed" mb="lg">
                  Calculate aspect ratios and resize images proportionally for any platform or use case.
                </Text>
                <Button component={Link} href="/tools/aspect-ratio-calculator" fullWidth color="teal" data-testid="aspect-ratio-calculator-link">
                  Calculate Ratios
                </Button>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Paper withBorder shadow="md" p="xl" className="h-full hover:shadow-lg transition-shadow">
                <Group gap="sm" mb="md">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                    <Type className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <Title order={3} size="h4">Font to Vector</Title>
                    <Badge variant="light" color="red" size="sm">Text Conversion</Badge>
                  </div>
                </Group>
                <Text size="sm" c="dimmed" mb="lg">
                  Convert text and fonts into editable vector graphics for logo creation and sign making.
                </Text>
                <Button component={Link} href="/tools/font-to-vector" fullWidth color="red" data-testid="font-to-vector-link">
                  Convert Text
                </Button>
              </Paper>
            </Grid.Col>
          </Grid>
        </div>

        {/* Professional Services */}
        <Paper withBorder shadow="md" p="xl" mb="xl">
          <Title order={2} mb="lg" ta="center">Need Professional Help?</Title>
          <Text ta="center" c="dimmed" mb="xl" maw={600} mx="auto">
            We're continuously expanding our toolkit to help you with all your vector graphics needs. 
            Here's what's coming next:
          </Text>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Paper p="md" className="text-center bg-gray-50 dark:bg-gray-800">
                <Title order={4} size="h5" mb="xs">Format Converter</Title>
                <Text size="sm" c="dimmed">Convert between SVG, PNG, JPG, and more</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Paper p="md" className="text-center bg-gray-50 dark:bg-gray-800">
                <Title order={4} size="h5" mb="xs">Color Extractor</Title>
                <Text size="sm" c="dimmed">Extract color palettes from images</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Paper p="md" className="text-center bg-gray-50 dark:bg-gray-800">
                <Title order={4} size="h5" mb="xs">Logo Dimensions</Title>
                <Text size="sm" c="dimmed">Generate standard logo sizes</Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Before/After Showcase */}
        <div className="mb-16">
          <div className="mb-8 text-center">
            <Title order={2} mb="md" className="flex items-center justify-center space-x-2">
              <Eye className="h-6 w-6" />
              <span>See the Difference</span>
            </Title>
            <Text c="dimmed" maw={600} mx="auto">
              Transform your raster images into crisp, scalable vectors that look perfect at any size
            </Text>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BeforeAfterSlider
              beforeImage="https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"
              afterImage="https://images.unsplash.com/photo-1558655146-364adaf1fcc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"
              beforeAlt="Pixelated raster logo showing quality loss when scaled"
              afterAlt="Crisp vector logo maintaining quality at any scale"
              title="Logo Vectorization"
              description="Transform pixelated logos into crisp, scalable vectors that maintain quality at any size."
            />

            <BeforeAfterSlider
              beforeImage="https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"
              afterImage="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"
              beforeAlt="Low resolution artwork with visible pixels and artifacts"
              afterAlt="Clean vector artwork with smooth lines and perfect curves"
              title="Image to Vector"
              description="Convert complex images into clean vector graphics perfect for professional use."
            />
          </div>
        </div>

        {/* DPI Guidelines Reference */}
        <Paper withBorder shadow="lg" p="xl" className="mt-8">
          <div className="space-y-4">
            <Title order={2}>DPI Guidelines Reference</Title>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">300+ DPI</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Excellent for professional printing, magazines, and marketing materials
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">150-300 DPI</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Good for general printing, posters, and large format displays
                </p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <h3 className="font-semibold text-amber-700 dark:text-amber-300 mb-2">72-150 DPI</h3>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Fair for web use but may appear pixelated when printed
                </p>
              </div>
            </div>
          </div>
        </Paper>
      </Container>
    </div>
  );
}
