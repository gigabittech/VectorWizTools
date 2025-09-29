import { useState } from "react";
import { Paper, Title, Button, Select, Group, Stack, Text, Badge, Alert, Tabs } from "@mantine/core";
import { Smartphone, Monitor, FileText, Download, CheckCircle, AlertCircle } from "lucide-react";

interface LogoSize {
  platform: string;
  name: string;
  width: number;
  height: number;
  format: string;
  usage: string;
  color: string;
}

export default function LogoDimensions() {
  const [selectedCategory, setSelectedCategory] = useState("social");
  const [selectedPlatform, setSelectedPlatform] = useState("");

  const categoryOptions = [
    { value: "social", label: "Social Media" },
    { value: "business", label: "Business Materials" },
    { value: "web", label: "Web & Digital" },
    { value: "print", label: "Print Materials" },
    { value: "mobile", label: "Mobile Apps" },
  ];

  const logoSizes: Record<string, LogoSize[]> = {
    social: [
      { platform: "Facebook", name: "Profile Picture", width: 180, height: 180, format: "PNG/JPG", usage: "Square format, visible at small sizes", color: "blue" },
      { platform: "Facebook", name: "Cover Photo", width: 820, height: 312, format: "PNG/JPG", usage: "Horizontal banner, desktop & mobile", color: "blue" },
      { platform: "Instagram", name: "Profile Picture", width: 110, height: 110, format: "PNG/JPG", usage: "Circular crop, high contrast needed", color: "purple" },
      { platform: "Instagram", name: "Story Highlight", width: 161, height: 161, format: "PNG", usage: "Circular icon, colorful background", color: "purple" },
      { platform: "Twitter/X", name: "Profile Picture", width: 400, height: 400, format: "PNG/JPG", usage: "Circular crop, recognizable at small sizes", color: "black" },
      { platform: "Twitter/X", name: "Header Image", width: 1500, height: 500, format: "PNG/JPG", usage: "Wide banner, brand showcase", color: "black" },
      { platform: "LinkedIn", name: "Profile Picture", width: 400, height: 400, format: "PNG/JPG", usage: "Professional, square format", color: "blue" },
      { platform: "LinkedIn", name: "Company Banner", width: 1192, height: 220, format: "PNG/JPG", usage: "Professional branding header", color: "blue" },
      { platform: "YouTube", name: "Channel Icon", width: 800, height: 800, format: "PNG", usage: "Circular crop, works at all sizes", color: "red" },
      { platform: "YouTube", name: "Channel Banner", width: 2560, height: 1440, format: "PNG/JPG", usage: "Large banner, safe area considerations", color: "red" },
    ],
    business: [
      { platform: "Business Cards", name: "Standard Logo", width: 300, height: 100, format: "Vector/PNG", usage: "300+ DPI, CMYK colors", color: "green" },
      { platform: "Letterhead", name: "Header Logo", width: 250, height: 80, format: "Vector/PNG", usage: "Top corner placement, scalable", color: "green" },
      { platform: "Email Signature", name: "Signature Logo", width: 150, height: 50, format: "PNG", usage: "Small file size, web optimized", color: "blue" },
      { platform: "Invoice", name: "Company Logo", width: 200, height: 80, format: "Vector/PNG", usage: "Professional, high contrast", color: "green" },
      { platform: "Presentation", name: "Slide Logo", width: 100, height: 40, format: "PNG", usage: "Corner watermark, transparent background", color: "purple" },
    ],
    web: [
      { platform: "Website", name: "Header Logo", width: 200, height: 60, format: "SVG/PNG", usage: "Responsive, retina ready", color: "blue" },
      { platform: "Website", name: "Footer Logo", width: 120, height: 40, format: "SVG/PNG", usage: "Smaller version, monochrome option", color: "blue" },
      { platform: "Favicon", name: "Browser Icon", width: 32, height: 32, format: "ICO/PNG", usage: "Simple, recognizable at tiny size", color: "orange" },
      { platform: "Apple Touch Icon", name: "iOS Icon", width: 180, height: 180, format: "PNG", usage: "Square, rounded corners applied", color: "gray" },
      { platform: "Open Graph", name: "Social Share", width: 1200, height: 630, format: "PNG/JPG", usage: "Link previews, horizontal layout", color: "purple" },
    ],
    print: [
      { platform: "Poster", name: "Large Format", width: 1000, height: 300, format: "Vector", usage: "Scalable to any size, high DPI", color: "green" },
      { platform: "Brochure", name: "Front Cover", width: 400, height: 150, format: "Vector/PNG", usage: "300+ DPI, print colors", color: "green" },
      { platform: "Billboard", name: "Outdoor Display", width: 2000, height: 600, format: "Vector", usage: "Viewed from distance, bold design", color: "red" },
      { platform: "T-Shirt", name: "Apparel Print", width: 300, height: 100, format: "Vector", usage: "Scalable, simple colors", color: "purple" },
    ],
    mobile: [
      { platform: "iOS App", name: "App Icon", width: 1024, height: 1024, format: "PNG", usage: "No transparency, rounded by system", color: "blue" },
      { platform: "Android App", name: "App Icon", width: 512, height: 512, format: "PNG", usage: "Adaptive icon, various shapes", color: "green" },
      { platform: "App Store", name: "Feature Graphic", width: 1024, height: 500, format: "PNG/JPG", usage: "Promotional banner, no text overlay", color: "purple" },
      { platform: "Splash Screen", name: "Loading Logo", width: 300, height: 300, format: "PNG", usage: "Various screen sizes, centered", color: "gray" },
    ],
  };

  const currentSizes = logoSizes[selectedCategory] || [];
  const platforms = Array.from(new Set(currentSizes.map(size => size.platform)));

  const filteredSizes = selectedPlatform 
    ? currentSizes.filter(size => size.platform === selectedPlatform)
    : currentSizes;

  const downloadSizeGuide = (category: string) => {
    const sizes = logoSizes[category];
    const csvContent = "Platform,Name,Width,Height,Format,Usage\n" +
      sizes.map(size => `${size.platform},"${size.name}",${size.width},${size.height},${size.format},"${size.usage}"`).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category}-logo-dimensions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <Paper withBorder shadow="md" p="xl" data-testid="logo-dimensions">
        <div className="space-y-6">
          <Title order={3} className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>Logo Dimension Guide</span>
          </Title>

          <div className="space-y-4">
            <Select
              label="Select Category"
              value={selectedCategory}
              onChange={(value) => {
                setSelectedCategory(value || "social");
                setSelectedPlatform("");
              }}
              data={categoryOptions}
              data-testid="category-select"
            />

            {platforms.length > 1 && (
              <Select
                label="Filter by Platform (Optional)"
                value={selectedPlatform}
                onChange={(value) => setSelectedPlatform(value || "")}
                placeholder="All platforms"
                data={platforms.map(platform => ({ value: platform, label: platform }))}
                data-testid="platform-select"
                clearable
              />
            )}

            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {filteredSizes.length} logo specifications found
              </Text>
              <Button 
                size="sm" 
                variant="outline" 
                leftSection={<Download size={14} />}
                onClick={() => downloadSizeGuide(selectedCategory)}
                data-testid="download-guide"
              >
                Download CSV
              </Button>
            </Group>
          </div>
        </div>
      </Paper>

      <Paper withBorder shadow="md" p="xl">
        <Title order={3} mb="lg">Logo Specifications</Title>
        <Stack gap="md" data-testid="logo-specifications">
          {filteredSizes.map((size, index) => (
            <Paper key={index} p="md" className="bg-gray-50 dark:bg-gray-800">
              <Group justify="space-between" align="flex-start">
                <div className="flex-1">
                  <Group gap="xs" mb="xs">
                    <Text fw={500}>{size.platform}</Text>
                    <Badge variant="light" color={size.color} size="sm">
                      {size.name}
                    </Badge>
                  </Group>
                  <Group gap="md" mb="sm">
                    <Text size="sm" style={{ fontFamily: 'monospace' }}>
                      {size.width} × {size.height}px
                    </Text>
                    <Badge variant="outline" size="sm">{size.format}</Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {size.usage}
                  </Text>
                </div>
                <Group gap="xs">
                  {size.format.includes('Vector') && (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                  {size.width >= 400 && (
                    <Badge variant="light" color="blue" size="xs">High Res</Badge>
                  )}
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Tabs defaultValue="tips" className="space-y-6">
        <Tabs.List>
          <Tabs.Tab value="tips">Design Tips</Tabs.Tab>
          <Tabs.Tab value="formats">File Formats</Tabs.Tab>
          <Tabs.Tab value="checklist">Quality Checklist</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="tips">
          <Paper withBorder shadow="md" p="xl">
            <Title order={3} mb="lg">Logo Design Best Practices</Title>
            <Stack gap="lg">
              <div>
                <Group gap="sm" mb="md">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  <Title order={4}>Mobile-First Design</Title>
                </Group>
                <Text size="sm" c="dimmed">
                  Design your logo to be readable at the smallest required size (typically 32×32px for favicons). 
                  If it works small, it will work at larger sizes.
                </Text>
              </div>
              <div>
                <Group gap="sm" mb="md">
                  <Monitor className="h-5 w-5 text-green-600" />
                  <Title order={4}>Scalable Vectors</Title>
                </Group>
                <Text size="sm" c="dimmed">
                  Always create logos in vector format (AI, SVG) first. This ensures crisp quality at any size 
                  and makes it easy to export to any required dimensions.
                </Text>
              </div>
              <div>
                <Group gap="sm" mb="md">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <Title order={4}>Format Variations</Title>
                </Group>
                <Text size="sm" c="dimmed">
                  Prepare horizontal, vertical, and square versions of your logo. Different platforms and 
                  applications require different aspect ratios.
                </Text>
              </div>
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="formats">
          <Paper withBorder shadow="md" p="xl">
            <Title order={3} mb="lg">Recommended File Formats</Title>
            <Stack gap="md">
              <Paper p="md" className="bg-green-50 dark:bg-green-950/20">
                <Group gap="xs" mb="sm">
                  <Badge variant="light" color="green">SVG</Badge>
                  <Text fw={500} size="sm">Best for Web</Text>
                </Group>
                <Text size="sm">Scalable, small file size, perfect for responsive websites</Text>
              </Paper>
              <Paper p="md" className="bg-blue-50 dark:bg-blue-950/20">
                <Group gap="xs" mb="sm">
                  <Badge variant="light" color="blue">PNG</Badge>
                  <Text fw={500} size="sm">Best for Digital</Text>
                </Group>
                <Text size="sm">Transparent background, good for social media and apps</Text>
              </Paper>
              <Paper p="md" className="bg-purple-50 dark:bg-purple-950/20">
                <Group gap="xs" mb="sm">
                  <Badge variant="light" color="purple">AI/EPS</Badge>
                  <Text fw={500} size="sm">Best for Print</Text>
                </Group>
                <Text size="sm">Vector format, unlimited scaling, professional printing</Text>
              </Paper>
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="checklist">
          <Paper withBorder shadow="md" p="xl">
            <Title order={3} mb="lg">Quality Checklist</Title>
            <Stack gap="sm">
              <Group gap="xs">
                <CheckCircle size={16} className="text-green-500" />
                <Text size="sm">Logo works in black and white</Text>
              </Group>
              <Group gap="xs">
                <CheckCircle size={16} className="text-green-500" />
                <Text size="sm">Readable at 32×32 pixel size</Text>
              </Group>
              <Group gap="xs">
                <CheckCircle size={16} className="text-green-500" />
                <Text size="sm">High contrast for accessibility</Text>
              </Group>
              <Group gap="xs">
                <CheckCircle size={16} className="text-green-500" />
                <Text size="sm">Consistent across all platforms</Text>
              </Group>
              <Group gap="xs">
                <CheckCircle size={16} className="text-green-500" />
                <Text size="sm">Transparent background versions available</Text>
              </Group>
              <Group gap="xs">
                <CheckCircle size={16} className="text-green-500" />
                <Text size="sm">Vector source file maintained</Text>
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <Alert icon={<AlertCircle size={16} />} color="blue">
        <Text size="sm">
          <strong>Professional Tip:</strong> Need help creating logos in all these sizes? Our design team can 
          create a complete logo package with all required dimensions and formats for your brand.
        </Text>
      </Alert>
    </div>
  );
}