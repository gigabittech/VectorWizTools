import AspectRatioCalculator from "@/components/tools/AspectRatioCalculator";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import { Paper, Title, Grid, Text, List, Button, Group } from "@mantine/core";
import { Monitor, Smartphone, Printer, CheckCircle, Award, Layout, Maximize } from "lucide-react";
import { Link } from "wouter";

export default function AspectRatioCalculatorPage() {
  return (
    <ToolLayout
      title="Pro Aspect Ratio Calculator Tool"
      description="Calculate and maintain perfect image proportions. Essential for web design, social media, video production, and ensuring your graphics look perfect on every device."
      category="Image Tools"
      keywords={["aspect ratio calculator", "image proportions", "scaling tool", "web design tools", "social media image sizes", "video aspect ratio"]}
      howToSteps={[
        { name: "Enter Base Dimensions", text: "Input the original width and height of your image." },
        { name: "Choose Target", text: "Select a common preset ratio or enter a new target width/height." },
        { name: "Preview Results", text: "Check how the image scales while maintaining exact proportions." },
        { name: "Apply Settings", text: "Use the calculated dimensions for your design or development work." },
      ]}
    >
      <div className="space-y-8">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <AspectRatioCalculator />
        </div>

        {/* Pro Aspect Ratio Insights */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" ta="center" className="text-2xl md:text-3xl font-bold">The Designer's Guide to Aspect Ratios</Title>
          <Text ta="center" c="dimmed" mb="xl" maw={600} mx="auto">
            Maintaining correct proportions is the foundation of professional design. It ensures your visuals
            remain undistorted across different screens and mediums.
          </Text>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="lg" className="bg-blue-50/50 dark:bg-blue-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Monitor className="h-6 w-6 text-blue-600" />
                  <Title order={3} size="h4" c="blue">Digital Display Standards</Title>
                </Group>
                <List spacing="md" size="sm" center icon={<CheckCircle size={16} className="text-blue-500" />}>
                  <List.Item><strong>16:9</strong> - Modern widescreen standard for HD displays and video</List.Item>
                  <List.Item><strong>4:3</strong> - Classic television and monitor proportion</List.Item>
                  <List.Item><strong>21:9</strong> - Ultrawide cinematic experiences</List.Item>
                  <List.Item><strong>1:1</strong> - Square format popular on Instagram and Facebook</List.Item>
                </List>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="lg" className="bg-purple-50/50 dark:bg-purple-950/20 h-full" radius="md">
                <Group gap="sm" mb="md">
                  <Smartphone className="h-6 w-6 text-purple-600" />
                  <Title order={3} size="h4" c="purple">Mobile & Vertical Content</Title>
                </Group>
                <List spacing="md" size="sm" center icon={<Award size={16} className="text-purple-500" />}>
                  <List.Item><strong>9:16</strong> - Full-screen mobile vertical (Stories, TikTok, Reels)</List.Item>
                  <List.Item><strong>4:5</strong> - Vertical social media posts for maximum engagement</List.Item>
                  <List.Item><strong>3:2</strong> - Standard digital SLR photography proportion</List.Item>
                  <List.Item><strong>2:3</strong> - Classic vertical print and advertisement format</List.Item>
                </List>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Application Scenarios */}
        <Paper withBorder shadow="md" p="xl" radius="lg">
          <Title order={2} mb="lg" className="text-2xl font-bold">Where Aspect Ratios Matter Most</Title>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" className="bg-gray-50 dark:bg-gray-800 h-full" radius="md">
                <Group gap="sm" mb="sm">
                  <Layout className="h-5 w-5 text-green-600" />
                  <Title order={4} size="h5">UI/UX Design</Title>
                </Group>
                <Text size="sm" c="dimmed">Maintaining consistent grid systems and image placeholders across responsive layouts.</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" className="bg-gray-50 dark:bg-gray-800 h-full" radius="md">
                <Group gap="sm" mb="sm">
                  <Maximize className="h-5 w-5 text-orange-600" />
                  <Title order={4} size="h5">Video Production</Title>
                </Group>
                <Text size="sm" c="dimmed">Ensuring footage matches target platform displays from 4K cinema to mobile vertical.</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" className="bg-gray-50 dark:bg-gray-800 h-full" radius="md">
                <Group gap="sm" mb="sm">
                  <Printer className="h-5 w-5 text-red-600" />
                  <Title order={4} size="h5">Print Advertising</Title>
                </Group>
                <Text size="sm" c="dimmed">Calculating bleed and safe zones while preserving critical brand imagery proportions.</Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Pro Services CTA */}
        <Paper withBorder shadow="md" p="xl" radius="lg" className="text-center bg-gray-50/50">
          <Title order={2} mb="md" className="text-2xl font-bold">Scaling for Billboards or Large Media?</Title>
          <Text size="md" c="dimmed" mb="xl" maw={600} mx="auto">
            Large format scaling requires precise calculations to maintain visual quality. Our expert vector team
            can prepare your graphics for any size while ensuring perfect proportions.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="md" color="green" radius="xl">
              Get Professional Scaling
            </Button>
            <Button component={Link} href="/tools/vector-checker" variant="outline" size="md" radius="xl">
              Check File Integrity
            </Button>
          </Group>
        </Paper>
      </div>
    </ToolLayout>
  );
}