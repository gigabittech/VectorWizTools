import { useAuth } from "@/hooks/use-auth";
import VectorChecker from "@/components/tools/VectorChecker";
import { Button, Paper, Title, Container, Group, Stack, Grid, Text, List, Badge, Anchor } from "@mantine/core";
import { ArrowLeft, Search, CheckCircle, XCircle, FileType, Zap, Award, Download, Upload } from "lucide-react";
import { Link } from "wouter";

export default function VectorCheckerPage() {
  // Vector checker tool is publicly accessible - no authentication check needed

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      
      <Container size="xl" py="xl" data-testid="vector-checker-page">
        <div className="mb-8">
          <Link href="/tools">
            <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} mb="md" data-testid="back-to-tools">
              Back to Tools
            </Button>
          </Link>
          
          <Group align="flex-start" gap="lg" mb="xl">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Search className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <Title order={1} size="h1" mb="xs">Free Vector File Format Checker</Title>
              <Text size="lg" c="dimmed" mb="md">
                Instantly verify if your files are true vector graphics or raster images. Upload and analyze multiple file formats in seconds.
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="emerald">Instant Analysis</Badge>
                <Badge variant="light" color="blue">Multiple Formats</Badge>
                <Badge variant="light" color="purple">Free Tool</Badge>
              </Group>
            </div>
          </Group>
        </div>

        <VectorChecker />

        {/* Comprehensive Information */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Why Use Our Vector Format Checker?</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="green">Benefits of Vector Graphics:</Title>
              <List spacing="md" size="sm" icon={<CheckCircle size={16} className="text-green-500" />}>
                <List.Item>Infinite scalability without quality loss</List.Item>
                <List.Item>Smaller file sizes for simple graphics</List.Item>
                <List.Item>Perfect for logos and illustrations</List.Item>
                <List.Item>Editable individual elements and colors</List.Item>
                <List.Item>Sharp printing at any resolution</List.Item>
                <List.Item>Compatible with all design software</List.Item>
                <List.Item>Professional print quality guaranteed</List.Item>
              </List>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md" c="blue">When to Use Vector Graphics:</Title>
              <List spacing="md" size="sm" icon={<Award size={16} className="text-blue-500" />}>
                <List.Item>Logo design and brand identity</List.Item>
                <List.Item>Business cards and corporate stationery</List.Item>
                <List.Item>Large format printing (banners, billboards)</List.Item>
                <List.Item>T-shirt and apparel printing designs</List.Item>
                <List.Item>Web graphics that need responsive scaling</List.Item>
                <List.Item>Icons and user interface elements</List.Item>
                <List.Item>Technical drawings and diagrams</List.Item>
              </List>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Vector vs Raster Comparison */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg" ta="center">Vector vs Raster: Understanding the Difference</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="lg" className="bg-green-50 dark:bg-green-950/20 h-full">
                <Group gap="sm" mb="md">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <Title order={3} c="green">Vector Graphics</Title>
                </Group>
                <Text size="sm" mb="lg">
                  Mathematical equations define shapes, lines, and curves. Results in crisp, scalable graphics perfect for logos and illustrations.
                </Text>
                <Stack gap="sm">
                  <Group gap="xs">
                    <Badge variant="light" color="green" size="sm">SVG</Badge>
                    <Text size="sm">Web-optimized, scalable</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge variant="light" color="green" size="sm">AI</Badge>
                    <Text size="sm">Adobe Illustrator native</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge variant="light" color="green" size="sm">EPS</Badge>
                    <Text size="sm">Print industry standard</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge variant="light" color="green" size="sm">PDF</Badge>
                    <Text size="sm">Universal compatibility</Text>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="lg" className="bg-orange-50 dark:bg-orange-950/20 h-full">
                <Group gap="sm" mb="md">
                  <XCircle className="h-6 w-6 text-orange-600" />
                  <Title order={3} c="orange">Raster Images</Title>
                </Group>
                <Text size="sm" mb="lg">
                  Grid of individual pixels that lose quality when scaled up. Best for photographs and complex images with many colors.
                </Text>
                <Stack gap="sm">
                  <Group gap="xs">
                    <Badge variant="light" color="orange" size="sm">JPG</Badge>
                    <Text size="sm">Photos, compressed</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge variant="light" color="orange" size="sm">PNG</Badge>
                    <Text size="sm">Transparency support</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge variant="light" color="orange" size="sm">GIF</Badge>
                    <Text size="sm">Simple animations</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge variant="light" color="orange" size="sm">TIFF</Badge>
                    <Text size="sm">High-quality printing</Text>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Supported File Formats */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg" ta="center">Supported File Formats for Analysis</Title>
          <Text ta="center" c="dimmed" mb="xl" maw={600} mx="auto">
            Our vector checker supports analysis of all major graphics file formats. Upload your files to instantly 
            determine their type and get recommendations for optimization.
          </Text>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Paper p="md" className="text-center bg-gray-50 dark:bg-gray-800">
                <FileType className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <Title order={4} size="h5" mb="xs">Vector Formats</Title>
                <Stack gap="xs">
                  <Badge variant="light" color="green">SVG</Badge>
                  <Badge variant="light" color="green">AI</Badge>
                  <Badge variant="light" color="green">EPS</Badge>
                  <Badge variant="light" color="green">PDF</Badge>
                </Stack>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Paper p="md" className="text-center bg-gray-50 dark:bg-gray-800">
                <Upload className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <Title order={4} size="h5" mb="xs">Raster Formats</Title>
                <Stack gap="xs">
                  <Badge variant="light" color="orange">JPG/JPEG</Badge>
                  <Badge variant="light" color="orange">PNG</Badge>
                  <Badge variant="light" color="orange">GIF</Badge>
                  <Badge variant="light" color="orange">TIFF</Badge>
                </Stack>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Paper p="md" className="text-center bg-gray-50 dark:bg-gray-800">
                <Download className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <Title order={4} size="h5" mb="xs">CAD Formats</Title>
                <Stack gap="xs">
                  <Badge variant="light" color="purple">DWG</Badge>
                  <Badge variant="light" color="purple">DXF</Badge>
                  <Badge variant="light" color="purple">CDR</Badge>
                </Stack>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Paper p="md" className="text-center bg-gray-50 dark:bg-gray-800">
                <Zap className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <Title order={4} size="h5" mb="xs">And More</Title>
                <Stack gap="xs">
                  <Badge variant="light" color="gray">BMP</Badge>
                  <Badge variant="light" color="gray">WEBP</Badge>
                  <Badge variant="light" color="gray">ICO</Badge>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Professional Use Cases */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Professional Applications & Use Cases</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20 h-full">
                <Title order={3} c="blue" mb="md">Graphic Design</Title>
                <Text size="sm" mb="md">
                  Ensure your design files are in the correct format for your project requirements. Vector for logos, raster for photos.
                </Text>
                <List size="xs" spacing="xs">
                  <List.Item>Logo verification before printing</List.Item>
                  <List.Item>File format validation for clients</List.Item>
                  <List.Item>Quality control for design projects</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50 dark:bg-green-950/20 h-full">
                <Title order={3} c="green" mb="md">Print Production</Title>
                <Text size="sm" mb="md">
                  Verify file formats before sending to print to avoid costly reprints and ensure optimal quality output.
                </Text>
                <List size="xs" spacing="xs">
                  <List.Item>Pre-press file verification</List.Item>
                  <List.Item>Large format printing preparation</List.Item>
                  <List.Item>Business card and stationery checks</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50 dark:bg-purple-950/20 h-full">
                <Title order={3} c="purple" mb="md">Web Development</Title>
                <Text size="sm" mb="md">
                  Optimize web graphics by choosing the right format for icons, logos, and illustrations on your website.
                </Text>
                <List size="xs" spacing="xs">
                  <List.Item>SVG optimization for web icons</List.Item>
                  <List.Item>Responsive design preparation</List.Item>
                  <List.Item>Performance optimization</List.Item>
                </List>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* CTA Section */}
        <Paper withBorder shadow="md" p="xl" mt="xl" className="text-center">
          <Title order={2} mb="md">Need Vector Conversion Services?</Title>
          <Text size="lg" c="dimmed" mb="xl" maw={600} mx="auto">
            If your files aren't in vector format and you need professional conversion services, 
            our expert team can transform your raster images into crisp, scalable vectors.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="lg" color="green" data-testid="conversion-cta">
              Get Vector Conversion
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
