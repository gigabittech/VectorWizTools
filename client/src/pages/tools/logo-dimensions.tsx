import LogoDimensions from "@/components/tools/LogoDimensions";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import { Paper, Title, Grid, Text, List, Group, Stack, Button } from "@mantine/core";
import { Monitor, Smartphone, FileText, CheckCircle, Award, Share2, Globe } from "lucide-react";
import { Link } from "wouter";

export default function LogoDimensionsPage() {
  return (
    <ToolLayout
      title="Logo Dimension Generator & Guide"
      description="Complete reference for logo sizes across all platforms. Get exact dimensions for social media, business materials, web graphics, and print applications."
      category="Image Tools"
      keywords={["logo dimensions", "social media sizes", "logo size guide", "web logo dimensions", "print logo requirements", "responsive logo design"]}
      howToSteps={[
        { name: "Choose Platform", text: "Select the platform (Social Media, Web, or Print) you're designing for." },
        { name: "Review Dimensions", text: "Check the exact pixel and inch requirements for each application." },
        { name: "Optimize Logo", text: "Adjust your logo layout to fit the specific dimension requirements." },
        { name: "Export Correctly", text: "Save your logo in the recommended format (PNG for web, Vector for print)." },
      ]}
    >
      <div className="space-y-8">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <LogoDimensions />
        </div>

        {/* Logo Strategy Guide */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" ta="center" className="text-2xl md:text-3xl font-bold">Logo Design Strategy for Multi-Platform Success</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50/50 dark:bg-blue-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <Title order={3} size="h4" c="blue">Responsive Design</Title>
                </Group>
                <Text size="sm" mb="md" fw={500}>Design for scalability across all platforms</Text>
                <List size="sm" spacing="xs" center>
                  <List.Item>Test readability at smallest required size</List.Item>
                  <List.Item>Create horizontal and vertical versions</List.Item>
                  <List.Item>Design icon-only version for small spaces</List.Item>
                  <List.Item>Ensure high contrast for accessibility</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50/50 dark:bg-green-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Share2 className="h-5 w-5 text-green-600" />
                  <Title order={3} size="h4" c="green">Social Media Optimization</Title>
                </Group>
                <Text size="sm" mb="md" fw={500}>Maximize impact across social platforms</Text>
                <List size="sm" spacing="xs" center>
                  <List.Item>Create platform-specific variations</List.Item>
                  <List.Item>Consider circular cropping for profiles</List.Item>
                  <List.Item>Use bold, simple designs for small displays</List.Item>
                  <List.Item>Test appearance in dark and light modes</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50/50 dark:bg-purple-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <Title order={3} size="h4" c="purple">Brand Consistency</Title>
                </Group>
                <Text size="sm" mb="md" fw={500}>Maintain unified brand identity</Text>
                <List size="sm" spacing="xs" center>
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
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" className="text-2xl font-bold">Platform-Specific Optimization Tips</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} size="h4" mb="md" c="blue.7">Social Media Best Practices</Title>
              <Stack gap="md">
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800" radius="md">
                  <Text fw={600} size="sm" mb="xs">Facebook & Instagram</Text>
                  <Text size="xs" c="dimmed">High contrast needed for mobile viewing and newsfeed scroll speed.</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800" radius="md">
                  <Text fw={600} size="sm" mb="xs">LinkedIn</Text>
                  <Text size="xs" c="dimmed">Professional appearance required, avoid overly decorative fonts.</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800" radius="md">
                  <Text fw={600} size="sm" mb="xs">Twitter/X</Text>
                  <Text size="xs" c="dimmed">Simple, recognizable mark that works at very small profile sizes.</Text>
                </Paper>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} size="h4" mb="md" c="green.7">Business Applications</Title>
              <Stack gap="md">
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800" radius="md">
                  <Text fw={600} size="sm" mb="xs">Business Cards</Text>
                  <Text size="xs" c="dimmed">Vector format (SVG/EPS) is essential for crisp, blurry-free printing.</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800" radius="md">
                  <Text fw={600} size="sm" mb="xs">Email Signatures</Text>
                  <Text size="xs" c="dimmed">Small file size, web-optimized PNG or SVG format for fast loading.</Text>
                </Paper>
                <Paper p="md" className="bg-gray-50 dark:bg-gray-800" radius="md">
                  <Text fw={600} size="sm" mb="xs">Presentations</Text>
                  <Text size="xs" c="dimmed">Transparent background is mandatory for versatility across slide decks.</Text>
                </Paper>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Professional Services CTA */}
        <Paper withBorder shadow="md" p="xl" radius="lg" className="text-center bg-gray-50/50">
          <Title order={2} mb="md" className="text-2xl font-bold">Professional Logo Package Creation</Title>
          <Text size="md" c="dimmed" mb="xl" maw={600} mx="auto">
            Need a complete logo package with all dimensions and formats? Our designers create
            comprehensive logo sets optimized for every platform and application.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="md" color="green" radius="xl">
              Get Complete Logo Package
            </Button>
            <Button component={Link} href="/tools/vector-checker" variant="outline" size="md" radius="xl">
              Check Logo Format
            </Button>
          </Group>
        </Paper>
      </div>
    </ToolLayout>
  );
}
