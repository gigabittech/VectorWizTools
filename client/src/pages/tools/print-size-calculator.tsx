import PrintSizeCalculator from "@/components/tools/PrintSizeCalculator";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import { Paper, Title, Grid, Text, List, Group, Stack, Button } from "@mantine/core";
import { Printer, CheckCircle, Award, FileText } from "lucide-react";
import { Link } from "wouter";

export default function PrintSizeCalculatorPage() {
  return (
    <ToolLayout
      title="Print Size Calculator"
      description="Calculate maximum print dimensions from your image resolution. Determine optimal sizes for business cards, posters, banners, and professional printing projects."
      category="Image Tools"
      keywords={["print size calculator", "maximum print dimensions", "resolution to inches", "printing standards", "DPI for print", "poster size guide"]}
      howToSteps={[
        { name: "Input Resolution", text: "Enter the width and height of your image in pixels." },
        { name: "Choose DPI", text: "Select the target printing resolution (e.g., 300 DPI for high quality)." },
        { name: "Calculate", text: "Get the maximum physical print dimensions in inches or centimeters." },
        { name: "Check Quality", text: "Review if your image resolution is sufficient for the intended print size." },
      ]}
    >
      <div className="space-y-8">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <PrintSizeCalculator />
        </div>

        {/* Print Quality Standards */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" ta="center" className="text-2xl md:text-3xl font-bold">Professional Print Quality Standards</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50/50 dark:bg-green-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Award className="h-5 w-5 text-green-600" />
                  <Title order={3} size="h4" c="green">High-End Printing</Title>
                </Group>
                <Text size="sm" mb="md" fw={500}>300+ DPI for professional results</Text>
                <List size="sm" spacing="xs" center icon={<CheckCircle size={16} className="text-green-500" />}>
                  <List.Item>Business cards and brochures</List.Item>
                  <List.Item>Magazine and book printing</List.Item>
                  <List.Item>Fine art reproductions</List.Item>
                  <List.Item>Marketing materials</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50/50 dark:bg-blue-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Printer className="h-5 w-5 text-blue-600" />
                  <Title order={3} size="h4" c="blue">Large Format</Title>
                </Group>
                <Text size="sm" mb="md" fw={500}>150-300 DPI for viewing distance</Text>
                <List size="sm" spacing="xs" center icon={<CheckCircle size={16} className="text-blue-500" />}>
                  <List.Item>Posters and displays</List.Item>
                  <List.Item>Trade show graphics</List.Item>
                  <List.Item>Banners and signs</List.Item>
                  <List.Item>Vehicle wraps</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50/50 dark:bg-purple-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <Title order={3} size="h4" c="purple">Digital & Web</Title>
                </Group>
                <Text size="sm" mb="md" fw={500}>72-150 DPI for screen display</Text>
                <List size="sm" spacing="xs" center icon={<CheckCircle size={16} className="text-purple-500" />}>
                  <List.Item>Website images</List.Item>
                  <List.Item>Email newsletters</List.Item>
                  <List.Item>Social media graphics</List.Item>
                  <List.Item>Digital presentations</List.Item>
                </List>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Print Preparation Checklist */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" className="text-2xl font-bold">Pre-Press Preparation Checklist</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} size="h4" mb="md" c="blue.7">Before Printing</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Verify resolution meets minimum DPI requirements</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Check color mode (RGB for digital, CMYK for print)</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Confirm final dimensions and crop areas</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Include bleed area for full-bleed prints</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-green-500" />
                  <Text size="sm">Test print on similar paper/material</Text>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} size="h4" mb="md" c="green.7">Quality Assurance</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Review colors on calibrated monitor</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Check text readability at final size</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Verify all fonts are embedded or outlined</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Confirm paper type and finish requirements</Text>
                </Group>
                <Group gap="xs">
                  <CheckCircle size={16} className="text-blue-500" />
                  <Text size="sm">Get client approval on proof prints</Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Professional Services CTA */}
        <Paper withBorder shadow="md" p="xl" radius="lg" className="text-center bg-gray-50/50">
          <Title order={2} mb="md" className="text-2xl font-bold">Professional Print Preparation Service</Title>
          <Text size="md" c="dimmed" mb="xl" maw={600} mx="auto">
            Let our experts prepare your graphics for professional printing. We ensure optimal
            resolution, color accuracy, and print-ready files for any project size.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="md" color="green" radius="xl">
              Get Print Preparation Service
            </Button>
            <Button component={Link} href="/dpi-calculator" variant="outline" size="md" radius="xl">
              Check DPI First
            </Button>
          </Group>
        </Paper>
      </div>
    </ToolLayout>
  );
}
