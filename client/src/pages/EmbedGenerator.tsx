import { useState, useMemo } from "react";
import { 
  Paper, 
  Title, 
  Text, 
  Grid, 
  Stack, 
  TextInput, 
  ColorInput, 
  Select, 
  MultiSelect, 
  NumberInput,
  Button,
  Group,
  Divider,
  Code,
  ActionIcon,
  Tabs,
  Alert,
  Tooltip,
  Box,
  ThemeIcon,
  Textarea
} from "@mantine/core";
import { 
  Code as CodeIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  Settings2, 
  HelpCircle,
  Link,
  Smartphone,
  Monitor,
  Layout as LayoutIcon,
  Globe
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useClipboard } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { BASE_PATH } from "@/lib/queryClient";

const FIELD_OPTIONS = [
  { value: "title", label: "Form Title" },
  { value: "fileUpload", label: "File Upload Area" },
  { value: "numberOfFiles", label: "Number of Files Field" },
  { value: "turnaroundTime", label: "Turnaround Time Field" },
];

export default function EmbedGenerator() {
  const clipboard = useClipboard();
  
  // Customization State
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [primaryColor, setPrimaryColor] = useState("#0B9F47");
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  const [width, setWidth] = useState<string | number>("100%");
  const [height, setHeight] = useState<number>(800);
  const [unit, setUnit] = useState<"%" | "px">("%");
  const [padding, setPadding] = useState<number>(32);
  const [margin, setMargin] = useState<number>(0);
  const [radius, setRadius] = useState<number>(12);
  const [customCss, setCustomCss] = useState<string>("");

  // Determine the base path prefix
  const pathPrefix = useMemo(() => {
    return BASE_PATH === "/" ? "" : BASE_PATH;
  }, []);

  const embedUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (theme === "light") params.set("theme", "light");
    if (primaryColor !== "#0B9F47") params.set("color", primaryColor);
    if (hiddenFields.length > 0) params.set("hide", hiddenFields.join(","));
    if (padding !== 32) params.set("padding", padding.toString());
    if (margin !== 0) params.set("margin", margin.toString());
    if (radius !== 12) params.set("radius", radius.toString());
    if (customCss) params.set("css", btoa(customCss));
    
    const queryString = params.toString();
    const query = queryString ? `?${queryString}` : "";
    
    const url = `${pathPrefix}/embed/quote-form${query}`;
    console.log('[EmbedGenerator] Internal embed URL:', url);
    return url;
  }, [pathPrefix, theme, primaryColor, hiddenFields, padding, margin, radius, customCss]);

  // For the absolute code blocks
  const absoluteUrl = useMemo(() => {
    return `${window.location.origin}${embedUrl}`;
  }, [embedUrl]);

  const iframeCode = useMemo(() => {
    const finalWidth = unit === "%" ? `${width}%` : `${width}px`;
    return `<iframe 
  src="${absoluteUrl}" 
  width="${finalWidth}" 
  height="${height}" 
  style="border: none; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" 
  loading="lazy"
></iframe>`;
  }, [absoluteUrl, width, height, unit]);

  const jsCode = useMemo(() => {
    const finalWidth = unit === "%" ? `${width}%` : `${width}px`;
    return `<div id="vectorwiz-quote-form"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = "${absoluteUrl}";
    iframe.width = "${finalWidth}";
    iframe.height = "${height}";
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.style.borderRadius = "12px";
    document.getElementById('vectorwiz-quote-form').appendChild(iframe);
  })();
</script>`;
  }, [absoluteUrl, width, height, unit]);

  const handleCopy = (code: string) => {
    clipboard.copy(code);
    notifications.show({
      title: "Code Copied!",
      message: "You can now paste this into your website.",
      color: "green",
      icon: <Check size={16} />
    });
  };

  return (
    <AdminLayout>
      <Stack gap="xl">
        <header>
          <Title order={2} className="text-gray-800">Embed Quote Form</Title>
          <Text c="dimmed">Generate customizable embed code to place your quote form on any external website.</Text>
        </header>

        <Grid gutter="xl">
          {/* Controls Column */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack gap="md">
              <Paper withBorder shadow="sm" radius="lg" p="xl">
                <Group mb="lg">
                  <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                    <Settings2 size={20} />
                  </ThemeIcon>
                  <Title order={4}>Customization</Title>
                </Group>

                <Stack gap="md">
                  <Select
                    label="Theme"
                    description="Match the background of your host site"
                    data={[
                      { value: "light", label: "Light Theme" },
                      { value: "dark", label: "Dark Theme" },
                    ]}
                    value={theme}
                    onChange={(val) => setTheme(val as any)}
                  />

                  <ColorInput
                    label="Primary Color"
                    description="Button and accent color"
                    value={primaryColor}
                    onChange={setPrimaryColor}
                  />

                  <MultiSelect
                    label="Hide Fields"
                    description="Remove optional elements from the form"
                    data={FIELD_OPTIONS}
                    value={hiddenFields}
                    onChange={setHiddenFields}
                  />

                  <Divider label="Dimensions" labelPosition="center" my="xs" />

                  <Group grow>
                    <NumberInput
                      label="Width"
                      value={width as any}
                      onChange={(val) => setWidth(val)}
                      suffix={unit}
                    />
                    <Select
                      label="Unit"
                      data={["%", "px"]}
                      value={unit}
                      onChange={(val) => setUnit(val as any)}
                    />
                  </Group>

                  <NumberInput
                    label="Height (px)"
                    description="Adjust based on hidden fields"
                    value={height}
                    onChange={(val) => setHeight(Number(val))}
                  />

                  <Divider label="Spacing & Style" labelPosition="center" my="xs" />

                  <Group grow>
                    <NumberInput
                      label="Padding"
                      placeholder="px"
                      value={padding}
                      onChange={(val) => setPadding(Number(val))}
                    />
                    <NumberInput
                      label="Margin"
                      placeholder="px"
                      value={margin}
                      onChange={(val) => setMargin(Number(val))}
                    />
                  </Group>

                  <NumberInput
                    label="Border Radius"
                    description="Roundness of form corners"
                    placeholder="px"
                    value={radius}
                    onChange={(val) => setRadius(Number(val))}
                  />

                  <Textarea
                    label="Custom CSS"
                    description="Advanced styling (will be injected into the form)"
                    placeholder=".my-form { ... }"
                    value={customCss}
                    onChange={(e) => setCustomCss(e.currentTarget.value)}
                    rows={4}
                  />
                </Stack>
              </Paper>

              <Paper withBorder shadow="sm" radius="lg" p="xl" className="bg-blue-50/30">
                <Group mb="md" gap="xs">
                  <HelpCircle size={18} className="text-blue-500" />
                  <Title order={5} className="text-blue-800">Quick Guide</Title>
                </Group>
                <Stack gap="xs">
                  <Text size="sm">1. Customize form appearance</Text>
                  <Text size="sm">2. Check Live Preview on the right</Text>
                  <Text size="sm">3. Copy the generated code</Text>
                  <Text size="sm">4. Paste into your site's HTML</Text>
                </Stack>
              </Paper>
            </Stack>
          </Grid.Col>

          {/* Code & Preview Column */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Stack gap="md">
              {/* Code Tabs */}
              <Tabs defaultValue="iframe" radius="lg" variant="outline">
                <Paper withBorder shadow="sm" radius="lg" p={0} className="overflow-hidden">
                  <Box p="md" className="bg-gray-50 border-b border-gray-200">
                    <Tabs.List>
                      <Tabs.Tab value="iframe" leftSection={<Globe size={14} />}>iFrame Code</Tabs.Tab>
                      <Tabs.Tab value="js" leftSection={<CodeIcon size={14} />}>JavaScript (Advanced)</Tabs.Tab>
                    </Tabs.List>
                  </Box>

                  <div className="p-6">
                    <Tabs.Panel value="iframe">
                      <Stack gap="md">
                        <Box className="relative">
                          <Code block className="p-4 rounded-md bg-gray-900 text-green-400 overflow-x-auto min-h-[120px]">
                            {iframeCode}
                          </Code>
                          <ActionIcon 
                            className="absolute top-2 right-2" 
                            variant="filled" 
                            color="green" 
                            onClick={() => handleCopy(iframeCode)}
                          >
                            <Copy size={16} />
                          </ActionIcon>
                        </Box>
                        <Alert icon={<Monitor size={16} />} title="WordPress Usage" color="blue">
                          For WordPress, use a "Custom HTML" block and paste the code directly.
                        </Alert>
                      </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="js">
                      <Stack gap="md">
                        <Box className="relative">
                          <Code block className="p-4 rounded-md bg-gray-900 text-green-400 overflow-x-auto min-h-[120px]">
                            {jsCode}
                          </Code>
                          <ActionIcon 
                            className="absolute top-2 right-2" 
                            variant="filled" 
                            color="green" 
                            onClick={() => handleCopy(jsCode)}
                          >
                            <Copy size={16} />
                          </ActionIcon>
                        </Box>
                        <Text size="xs" c="dimmed italic">
                          This method allows for more programmatic control of the embed if needed.
                        </Text>
                      </Stack>
                    </Tabs.Panel>
                  </div>
                </Paper>
              </Tabs>

              {/* Live Preview */}
              <Paper withBorder shadow="sm" radius="lg" p="xl">
                <Group justify="space-between" mb="xl">
                  <Group gap="sm">
                    <ThemeIcon variant="light" color="green" size="lg" radius="md">
                      <Eye size={20} />
                    </ThemeIcon>
                    <Title order={4}>Live Preview</Title>
                  </Group>
                  <Group gap="xs">
                    <Smartphone size={16} className="text-gray-400" />
                    <Monitor size={16} className="text-gray-400" />
                  </Group>
                </Group>

                <div 
                  className={`rounded-xl border shadow-inner overflow-hidden mx-auto ${theme === 'dark' ? 'bg-[#06183C]' : 'bg-white'}`}
                  style={{ 
                    width: unit === "%" ? `${width}%` : `${width}px`, 
                    height: `${height}px`,
                    maxWidth: '100%'
                  }}
                >
                  <iframe 
                    src={embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    title="Form Preview"
                  />
                </div>
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </AdminLayout>
  );
}
