import FileSizeCalculator from "@/components/tools/FileSizeCalculator";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import { Paper, Title, Grid, Text, List, Group, Button } from "@mantine/core";
import { HardDrive, Monitor, Printer, Zap, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function FileSizeCalculatorPage() {
  return (
    <ToolLayout
      title="File Size Calculator"
      description="Calculate estimated file sizes for different image formats and compression settings. Perfect for planning storage needs and optimizing web performance with accurate size estimates."
      category="Image Tools"
      keywords={["file size calculator", "image size estimator", "storage calculation", "web image optimization", "print file size", "compression estimates"]}
      howToSteps={[
        { name: "Input Dimensions", text: "Enter the width and height of your image in pixels." },
        { name: "Select Bit Depth", text: "Choose the color depth (e.g., 8-bit, 16-bit) for your calculation." },
        { name: "Calculate", text: "Get estimated file sizes for various formats like JPEG, PNG, and TIFF." },
        { name: "Review Estimates", text: "Analyze the storage requirements for your project and plan accordingly." },
      ]}
    >
      <div className="space-y-8">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <FileSizeCalculator />
        </div>

        {/* File Size Optimization Guide */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" ta="center" className="text-2xl md:text-3xl font-bold">File Size Optimization Strategies</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50/50 dark:bg-blue-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  <Title order={3} size="h4" c="blue">Web Optimization</Title>
                </Group>
                <List size="sm" spacing="xs" center icon={<CheckCircle size={16} className="text-blue-500" />}>
                  <List.Item>Use WebP for modern browsers</List.Item>
                  <List.Item>Optimize JPEG quality (80-85%)</List.Item>
                  <List.Item>Use PNG for transparency</List.Item>
                  <List.Item>Implement responsive images</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50/50 dark:bg-green-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Printer className="h-5 w-5 text-green-600" />
                  <Title order={3} size="h4" c="green">Print Planning</Title>
                </Group>
                <List size="sm" spacing="xs" center icon={<CheckCircle size={16} className="text-green-500" />}>
                  <List.Item>Calculate for high-DPI files</List.Item>
                  <List.Item>Plan batch processing needs</List.Item>
                  <List.Item>Estimate upload/download times</List.Item>
                  <List.Item>Budget for cloud storage</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50/50 dark:bg-purple-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <Title order={3} size="h4" c="purple">Performance Tips</Title>
                </Group>
                <List size="sm" spacing="xs" center icon={<CheckCircle size={16} className="text-purple-500" />}>
                  <List.Item>Compress before uploading</List.Item>
                  <List.Item>Use progressive JPEG formats</List.Item>
                  <List.Item>Implement lazy loading</List.Item>
                  <List.Item>Consider global CDN delivery</List.Item>
                </List>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Professional Services CTA */}
        <Paper withBorder shadow="md" p="xl" radius="lg" className="text-center bg-gray-50/50">
          <Title order={2} mb="md" className="text-2xl font-bold">Need Professional File Optimization?</Title>
          <Text size="md" c="dimmed" mb="xl" maw={600} mx="auto">
            Our experts can help optimize your entire image library for web performance,
            storage efficiency, and loading speed across all devices.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="md" color="green" radius="xl">
              Get Professional Optimization
            </Button>
            <Button component={Link} href="/tools/format-converter" variant="outline" size="md" radius="xl">
              Convert File Formats
            </Button>
          </Group>
        </Paper>
      </div>
    </ToolLayout>
  );
}
