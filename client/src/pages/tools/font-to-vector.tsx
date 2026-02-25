import ToolLayout from "@/components/tools/shared/ToolLayout";
import FontToVector from "@/components/tools/FontToVector";
import { Paper, Title, Text, List, Grid, Stack, Group, Badge, Button } from "@mantine/core";
import { FileText, Palette, Download, CheckCircle, Award } from "lucide-react";
import { Link } from "wouter";

export default function FontToVectorPage() {
  return (
    <ToolLayout
      title="Free Font to Vector Converter Tool"
      description="Convert text and fonts into editable vector graphics. Perfect for logo creation, sign making, and ensuring font independence across all platforms and devices."
      category="Image Tools"
      keywords={["font to vector", "text to vector", "vector graphics", "typography", "logo creation", "font independence", "editable paths"]}
      howToSteps={[
        { name: "Enter Text", text: "Type the text or characters you want to convert into vector graphics." },
        { name: "Choose Font", text: "Select from available fonts or upload your own custom font file." },
        { name: "Customize Style", text: "Adjust size, weight, and styling of your text elements." },
        { name: "Convert and Download", text: "Click convert to generate vector paths and download as SVG or EPS." },
      ]}
    >
      <div className="space-y-8">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <FontToVector />
        </div>

        {/* Font to Vector Applications */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" ta="center" className="text-2xl md:text-3xl font-bold">Professional Applications for Vector Text</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50/50 dark:bg-blue-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <Title order={3} size="h4" c="blue">Logo & Branding</Title>
                </Group>
                <Text size="sm" mb="md" fw={500}>Create scalable brand elements</Text>
                <List size="sm" spacing="xs" center>
                  <List.Item>Company logos with custom typography</List.Item>
                  <List.Item>Brand wordmarks and slogans</List.Item>
                  <List.Item>Marketing campaign headlines</List.Item>
                  <List.Item>Trademark-ready text elements</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50/50 dark:bg-green-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Palette className="h-5 w-5 text-green-600" />
                  <Title order={3} size="h4" c="green">Manufacturing</Title>
                </Group>
                <Text size="sm" mb="md" fw={500}>Physical production and cutting</Text>
                <List size="sm" spacing="xs" center>
                  <List.Item>Vinyl cutting and signage</List.Item>
                  <List.Item>Laser engraving and etching</List.Item>
                  <List.Item>CNC routing and milling</List.Item>
                  <List.Item>3D printing text elements</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50/50 dark:bg-purple-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Download className="h-5 w-5 text-purple-600" />
                  <Title order={3} size="h4" c="purple">Design Workflow</Title>
                </Group>
                <Text size="sm" mb="md" fw={500}>Professional design integration</Text>
                <List size="sm" spacing="xs" center>
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
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" className="text-2xl font-bold">Font Selection for Vector Conversion</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} size="h4" mb="md" c="green.7">Best Font Types ✅</Title>
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
              <Title order={3} size="h4" mb="md" c="orange.7">Challenging Fonts ⚠️</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <Badge color="orange" size="xs" variant="filled">!</Badge>
                  <Text size="sm"><strong>Script fonts</strong> - Complex curves and connections</Text>
                </Group>
                <Group gap="xs">
                  <Badge color="orange" size="xs" variant="filled">!</Badge>
                  <Text size="sm"><strong>Decorative fonts</strong> - Intricate details may be lost</Text>
                </Group>
                <Group gap="xs">
                  <Badge color="orange" size="xs" variant="filled">!</Badge>
                  <Text size="sm"><strong>Thin weights</strong> - May become invisible at small sizes</Text>
                </Group>
                <Group gap="xs">
                  <Badge color="orange" size="xs" variant="filled">!</Badge>
                  <Text size="sm"><strong>Condensed fonts</strong> - Narrow letterforms may merge</Text>
                </Group>
                <Group gap="xs">
                  <Badge color="orange" size="xs" variant="filled">!</Badge>
                  <Text size="sm"><strong>Small text sizes</strong> - Details lost in conversion</Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Vector Text Benefits */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" className="text-2xl font-bold">Benefits of Vector Text Over Font Files</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} size="h4" mb="md" c="blue.7">Technical Advantages</Title>
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
              <Title order={3} size="h4" mb="md" c="green.7">Creative Benefits</Title>
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
        <Paper withBorder shadow="md" p="xl" radius="lg" className="text-center bg-gray-50/50">
          <Title order={2} mb="md" className="text-2xl font-bold">Professional Typography & Logo Services</Title>
          <Text size="md" c="dimmed" mb="xl" maw={600} mx="auto">
            Need custom lettering or complex typography conversion? Our designers can create
            unique vector wordmarks and handle challenging font conversions with perfect results.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="md" color="green" radius="xl">
              Get Custom Typography
            </Button>
            <Button component={Link} href="/tools/logo-dimensions" variant="outline" size="md" radius="xl">
              Logo Size Guide
            </Button>
          </Group>
        </Paper>
      </div>
    </ToolLayout>
  );
}
