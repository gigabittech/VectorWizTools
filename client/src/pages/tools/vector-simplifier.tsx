import VectorSimplifier from "@/components/tools/VectorSimplifier";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import { Paper, Title, Grid, Text, List, Group, Stack, Button } from "@mantine/core";
import { Settings, CheckCircle, Award, Globe, FileText } from "lucide-react";
import { Link } from "wouter";

export default function VectorSimplifierPage() {
  return (
    <ToolLayout
      title="Vector Simplification Tool"
      description="Optimize SVG files and vector graphics for web performance. Reduce file sizes, simplify paths, and improve loading speed without sacrificing visual quality."
      category="Image Tools"
      keywords={["vector simplifier", "svg optimizer", "reduce svg size", "path simplification", "web performance", "vector cleanup"]}
      howToSteps={[
        { name: "Upload SVG", text: "Select or drag and drop your SVG file into the simplifier." },
        { name: "Adjust Settings", text: "Choose the level of simplification and path optimization needed." },
        { name: "Preview & Compare", text: "Review the optimized file size and visual changes." },
        { name: "Download Optimized", text: "Download your clean, performance-optimized vector file." },
      ]}
    >
      <div className="space-y-8">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <VectorSimplifier />
        </div>

        {/* Vector Optimization Benefits */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" ta="center" className="text-2xl md:text-3xl font-bold">Why Optimize Vector Graphics?</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50/50 dark:bg-blue-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <Title order={3} size="h4" c="blue">Web Performance</Title>
                </Group>
                <Text size="sm" mb="md" fw={500}>Faster loading, better user experience</Text>
                <List size="sm" spacing="xs" center>
                  <List.Item>Reduced bandwidth usage</List.Item>
                  <List.Item>Faster page load times</List.Item>
                  <List.Item>Improved SEO rankings</List.Item>
                  <List.Item>Better mobile performance</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50/50 dark:bg-green-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Settings className="h-5 w-5 text-green-600" />
                  <Title order={3} size="h4" c="green">Technical Benefits</Title>
                </Group>
                <Text size="sm" mb="md" fw={500}>Cleaner code, easier maintenance</Text>
                <List size="sm" spacing="xs" center>
                  <List.Item>Simplified SVG code structure</List.Item>
                  <List.Item>Fewer DOM nodes to render</List.Item>
                  <List.Item>Reduced server storage costs</List.Item>
                  <List.Item>Faster CSS animations</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50/50 dark:bg-purple-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Award className="h-5 w-5 text-purple-600" />
                  <Title order={3} size="h4" c="purple">Design Quality</Title>
                </Group>
                <Text size="sm" mb="md" fw={500}>Maintain visual fidelity</Text>
                <List size="sm" spacing="xs" center>
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
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" className="text-2xl font-bold">Vector Optimization Strategies</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} size="h4" mb="md" c="blue.7">Automated Optimizations</Title>
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
              <Title order={3} size="h4" mb="md" c="green.7">Best Practices</Title>
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
        <Paper withBorder shadow="md" p="xl" radius="lg" className="text-center bg-gray-50/50">
          <Title order={2} mb="md" className="text-2xl font-bold">Professional Vector Optimization Service</Title>
          <Text size="md" c="dimmed" mb="xl" maw={600} mx="auto">
            Need bulk optimization or custom vector cleaning? Our experts can optimize entire
            icon libraries and illustration sets while maintaining perfect quality.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="md" color="green" radius="xl">
              Get Professional Optimization
            </Button>
            <Button component={Link} href="/tools/format-converter" variant="outline" size="md" radius="xl">
              Convert Vector Formats
            </Button>
          </Group>
        </Paper>
      </div>
    </ToolLayout>
  );
}
