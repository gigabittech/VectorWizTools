import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Paper, Title, Button, Select, TextInput, Badge, Container, Group, Stack, Grid, Text, List, Anchor } from "@mantine/core";
import { apiRequest } from "@/lib/queryClient";
import { Clock, ArrowLeft, Calendar, CheckCircle, Zap, Award, FileText, Palette } from "lucide-react";
import { Link } from "wouter";

export default function TurnaroundEstimator() {
  const [service, setService] = useState("");
  const [complexity, setComplexity] = useState("medium");
  const [fileCount, setFileCount] = useState("1");

  const estimateMutation = useMutation({
    mutationFn: async (data: { service: string; complexity: string; fileCount: number }) => {
      const response = await apiRequest("POST", "/tools/api/tools/turnaround", data);
      return response.json();
    },
  });

  const handleEstimate = () => {
    if (service) {
      estimateMutation.mutate({
        service,
        complexity,
        fileCount: parseInt(fileCount) || 1,
      });
    }
  };

  const services = [
    { value: "IMAGE_TO_VECTOR", label: "Image to Vector", baseTime: "2-3 days" },
    { value: "LOGO_VECTORIZATION", label: "Logo Vectorization", baseTime: "3-4 days" },
    { value: "PDF_TO_VECTOR", label: "PDF to Vector", baseTime: "1-2 days" },
    { value: "DXF_CUTTER_READY", label: "DXF Cutter Ready", baseTime: "4-5 days" },
    { value: "RASTER_TO_VECTOR", label: "Raster to Vector", baseTime: "2-4 days" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">

      <Container size="xl" py="xl">
        <div className="mb-8">
          <Link href="/tools">
            <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} mb="md" data-testid="back-to-tools">
              Back to Tools
            </Button>
          </Link>

          <Group align="flex-start" gap="lg" mb="xl">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <Title order={1} size="h1" mb="xs">Professional Turnaround Time Estimator</Title>
              <Text size="lg" c="dimmed" mb="md">
                Get accurate delivery estimates for your vector conversion projects based on complexity, service type, and current queue status
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="purple">Instant Estimates</Badge>
                <Badge variant="light" color="blue">Real-time Queue</Badge>
                <Badge variant="light" color="green">Rush Available</Badge>
              </Group>
            </div>
          </Group>
        </div>

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper withBorder shadow="md" p="xl" data-testid="turnaround-estimator">
              <Title order={3} mb="lg">Project Details</Title>
              <Stack gap="md">
                <Select
                  label="Service Type"
                  placeholder="Select a service"
                  value={service}
                  onChange={(value) => setService(value || "")}
                  data={services.map(s => ({ value: s.value, label: s.label }))}
                  data-testid="service-select"
                />

                <Select
                  label="Project Complexity"
                  value={complexity}
                  onChange={(value) => setComplexity(value || "medium")}
                  data={[
                    { value: "simple", label: "Simple (basic shapes, minimal detail)" },
                    { value: "medium", label: "Medium (moderate detail, some text)" },
                    { value: "complex", label: "Complex (high detail, gradients, effects)" }
                  ]}
                  data-testid="complexity-select"
                />

                <TextInput
                  label="Number of Files"
                  type="number"
                  min={1}
                  max={50}
                  value={fileCount}
                  onChange={(e) => setFileCount(e.target.value)}
                  placeholder="How many files to convert?"
                  data-testid="file-count"
                />

                <Button
                  onClick={handleEstimate}
                  fullWidth
                  size="lg"
                  color="green"
                  loading={estimateMutation.isPending}
                  disabled={!service}
                  data-testid="get-estimate"
                >
                  {estimateMutation.isPending ? "Calculating..." : "Get Estimate"}
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper withBorder shadow="md" p="xl">
              <Title order={3} mb="lg">Delivery Estimate</Title>
              {estimateMutation.data ? (
                <Stack gap="lg" data-testid="estimate-results">
                  <div className="text-center">
                    <Text size="3rem" fw={700} c="green" data-testid="estimated-days">
                      {estimateMutation.data.estimatedDays}
                    </Text>
                    <Text size="lg" c="dimmed">
                      {estimateMutation.data.estimatedDays === 1 ? "Business Day" : "Business Days"}
                    </Text>
                  </div>

                  <Paper p="md" className="bg-gray-50 dark:bg-gray-800">
                    <Title order={4} size="h5" mb="sm">Factors Affecting Timeline:</Title>
                    <List size="sm" spacing="xs">
                      <List.Item>Service complexity: <strong>{complexity}</strong></List.Item>
                      <List.Item>Number of files: <strong>{fileCount}</strong></List.Item>
                      <List.Item>Current queue status</List.Item>
                      <List.Item>Revision requirements</List.Item>
                    </List>
                  </Paper>

                  <div className="text-center">
                    <Button component={Link} href="/order/new" size="lg" color="green" data-testid="start-order">
                      Start This Order
                    </Button>
                  </div>
                </Stack>
              ) : estimateMutation.isError ? (
                <div className="text-center py-8" data-testid="estimate-error">
                  <Text c="red">Failed to calculate estimate. Please try again.</Text>
                </div>
              ) : (
                <div className="text-center py-8" data-testid="estimate-placeholder">
                  <Text c="dimmed">Select service details to get an estimate</Text>
                </div>
              )}
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Service Timeline Reference */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Professional Vector Service Timeline Reference</Title>
          <Grid gutter="lg">
            {services.map((service) => (
              <Grid.Col key={service.value} span={{ base: 12, sm: 6, lg: 4 }}>
                <Paper p="lg" className="bg-gray-50 dark:bg-gray-800 h-full">
                  <Title order={4} size="h5" mb="xs">{service.label}</Title>
                  <Badge variant="light" color="blue" mb="sm">{service.baseTime}</Badge>
                  <Text size="xs" c="dimmed">
                    Base timeline for standard complexity
                  </Text>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>

          <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20" mt="lg">
            <Group gap="sm" mb="md">
              <Zap className="h-5 w-5 text-blue-600" />
              <Title order={3} c="blue">Express Service Available</Title>
            </Group>
            <Text size="sm" c="blue">
              Need faster delivery? Contact us about rush orders for 24-48 hour turnaround (additional fees apply).
            </Text>
          </Paper>
        </Paper>

        {/* Comprehensive Service Information */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Understanding Vector Conversion Timelines</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                <Text>
                  Our turnaround estimator provides <strong>accurate delivery predictions</strong> based on real-time queue status,
                  project complexity, and our team's current workload. We pride ourselves on meeting or beating our estimated delivery times.
                </Text>
                <Text>
                  Each project is handled by professional vector artists with years of experience in logo design, illustration,
                  and technical drawings. Quality is never compromised for speed.
                </Text>
                <List spacing="xs" size="sm" icon={<CheckCircle size={16} className="text-green-500" />}>
                  <List.Item>Real-time queue status updates</List.Item>
                  <List.Item>Professional quality guaranteed</List.Item>
                  <List.Item>Unlimited revisions included</List.Item>
                  <List.Item>Express options available</List.Item>
                </List>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={3} mb="md">Factors That Affect Timeline</Title>
              <Stack gap="lg">
                <div>
                  <Group gap="xs" mb="xs">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <Text fw={500}>File Complexity</Text>
                  </Group>
                  <Text size="sm" c="dimmed">Simple logos: 1-2 days | Detailed illustrations: 3-5 days</Text>
                </div>
                <div>
                  <Group gap="xs" mb="xs">
                    <Palette className="h-4 w-4 text-purple-500" />
                    <Text fw={500}>Color Requirements</Text>
                  </Group>
                  <Text size="sm" c="dimmed">Single color: Faster | Full color with gradients: Additional time</Text>
                </div>
                <div>
                  <Group gap="xs" mb="xs">
                    <Award className="h-4 w-4 text-green-500" />
                    <Text fw={500}>Quality Level</Text>
                  </Group>
                  <Text size="sm" c="dimmed">We never rush quality - each vector is hand-crafted</Text>
                </div>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Service Details */}
        <Paper withBorder shadow="md" p="xl" mt="xl">
          <Title order={2} mb="lg">Our Vector Conversion Services</Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-green-50 dark:bg-green-950/20 h-full">
                <Title order={3} c="green" mb="md">Logo Vectorization</Title>
                <Text size="sm" mb="md">
                  Convert pixelated logos into crisp, scalable vector graphics perfect for business cards, billboards, and everything in between.
                </Text>
                <List size="xs" spacing="xs">
                  <List.Item>Unlimited scalability</List.Item>
                  <List.Item>Perfect color matching</List.Item>
                  <List.Item>Multiple file formats</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-blue-50 dark:bg-blue-950/20 h-full">
                <Title order={3} c="blue" mb="md">Image to Vector</Title>
                <Text size="sm" mb="md">
                  Transform photographs and complex images into clean vector illustrations for unique artistic effects.
                </Text>
                <List size="xs" spacing="xs">
                  <List.Item>Artistic interpretation</List.Item>
                  <List.Item>Custom color palettes</List.Item>
                  <List.Item>Print-ready output</List.Item>
                </List>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="lg" className="bg-purple-50 dark:bg-purple-950/20 h-full">
                <Title order={3} c="purple" mb="md">Technical Drawings</Title>
                <Text size="sm" mb="md">
                  Convert technical drawings, blueprints, and schematics into precise vector formats for engineering and manufacturing.
                </Text>
                <List size="xs" spacing="xs">
                  <List.Item>Precise measurements</List.Item>
                  <List.Item>CAD compatibility</List.Item>
                  <List.Item>Industry standards</List.Item>
                </List>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* CTA Section */}
        <Paper withBorder shadow="md" p="xl" mt="xl" className="text-center">
          <Title order={2} mb="md">Ready to Start Your Vector Project?</Title>
          <Text size="lg" c="dimmed" mb="xl" maw={600} mx="auto">
            Get your project started today and receive professional vector graphics that exceed your expectations.
            Our team is ready to bring your vision to life.
          </Text>
          <Group justify="center" gap="md">
            <Button component={Link} href="/order/new" size="lg" color="green" data-testid="start-project-cta">
              Start Your Project
            </Button>
            <Button component={Link} href="/tools/vector-checker" variant="outline" size="lg">
              Check File Format First
            </Button>
          </Group>
        </Paper>
      </Container>
    </div>
  );
}
