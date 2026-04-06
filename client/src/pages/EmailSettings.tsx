import { useState, useEffect } from "react";
import { 
    Paper, 
    Title, 
    Text, 
    Stack, 
    Grid, 
    TextInput, 
    NumberInput, 
    Select, 
    Button, 
    Group, 
    Divider, 
    MultiSelect,
    Loader,
    Tabs,
    Badge,
    ThemeIcon,
    Box,
    Alert,
    TagsInput
} from "@mantine/core";
import { 
    Mail, 
    Send, 
    Server, 
    User, 
    Check, 
    AlertCircle, 
    Info,
    Zap,
    Globe,
    Settings2,
    ShieldCheck,
    Cpu
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useForm } from "@mantine/form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { showNotification } from "@mantine/notifications";

export default function EmailSettings() {
    const queryClient = useQueryClient();
    const [isTesting, setIsTesting] = useState(false);
    const [testEmail, setTestEmail] = useState("");

    const { data: settings, isLoading } = useQuery<any>({
        queryKey: ["/api/email-settings"],
    });

    const form = useForm({
        initialValues: {
            emailProvider: "brevo",
            senderName: "VectorWiz",
            senderEmail: "",
            ccEmails: [],
            bccEmails: [],
            brevoApiKey: "",
            smtpHost: "smtp-relay.brevo.com",
            smtpPort: 587,
            smtpUser: "",
            smtpPass: "",
            encryption: "tls",
        },
        validate: {
            senderEmail: (value: string) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
            senderName: (value: string) => (value.length < 2 ? "Too short" : null),
        },
    });

    useEffect(() => {
        if (settings) {
            form.setValues({
                ...settings,
                ccEmails: settings.ccEmails || [],
                bccEmails: settings.bccEmails || [],
                smtpPort: Number(settings.smtpPort || 587),
                emailProvider: settings.emailProvider || "brevo"
            });
        }
    }, [settings]);

    const updateMutation = useMutation({
        mutationFn: async (values: any) => {
            const res = await apiRequest("POST", "/api/email-settings", values);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/email-settings"] });
            showNotification({
                title: "Settings Saved",
                message: "Email configuration has been updated successfully.",
                color: "green",
                icon: <Check size={16} />
            });
        },
        onError: (err: any) => {
            showNotification({
                title: "Update Failed",
                message: err.message || "Failed to save settings",
                color: "red",
                icon: <AlertCircle size={16} />
            });
        }
    });

    const handleTest = async () => {
        if (!testEmail) {
            showNotification({
                title: "Input Required",
                message: "Please enter a test email address",
                color: "blue",
                icon: <Info size={16} />
            });
            return;
        }

        setIsTesting(true);
        try {
            const res = await apiRequest("POST", "/api/email-settings/test", {
                testEmail,
                settings: form.values
            });
            
            const data = await res.json();
            if (res.ok) {
                showNotification({
                    title: "Test Successful",
                    message: data.message || "A test email has been sent to " + testEmail,
                    color: "green",
                    icon: <Check size={16} />
                });
            } else {
                throw new Error(data.error || "Failed to send test email");
            }
        } catch (err: any) {
            showNotification({
                title: "Test Failed",
                message: err.message,
                color: "red",
                icon: <AlertCircle size={16} />
            });
        } finally {
            setIsTesting(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <Loader color="green" size="xl" type="bars" />
                    <Text mt="md" fw={500} c="dimmed">Loading email configurations...</Text>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Stack gap="xl">
            <Box mb={40}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <div>
                        <Title order={2} className="text-3xl font-bold text-gray-900 tracking-tight">Email Notifications</Title>
                        <Text c="dimmed" mt={4} size="sm" className="max-w-2xl">
                            Configure how the system sends quote notifications. Connect your Brevo SMTP service and manage recipient routing.
                        </Text>
                    </div>
                    <Badge size="lg" variant="light" color="blue" leftSection={<ShieldCheck size={14} />}>
                        Secure Delivery
                    </Badge>
                </Group>
            </Box>

                <form onSubmit={form.onSubmit((values) => updateMutation.mutate(values))}>
                    <Grid gutter="xl">
                        {/* Provider & SMTP settings */}
                        <Grid.Col span={{ base: 12, lg: 8 }}>
                            <Stack gap="lg">
                                <Paper withBorder shadow="sm" radius="lg" p="xl" className="overflow-hidden relative">
                                    <Box className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                                    
                                    <Tabs 
                                        value={form.values.emailProvider} 
                                        onChange={(val) => form.setFieldValue("emailProvider", val as string)}
                                        variant="pills"
                                        color="green"
                                        radius="md"
                                    >
                                        <Group justify="space-between" mb="xl">
                                            <Group gap="xs">
                                                <ThemeIcon variant="light" color="green" size="lg" radius="md">
                                                    <Cpu size={20} />
                                                </ThemeIcon>
                                                <Title order={4}>Sending Method</Title>
                                            </Group>
                                            <Tabs.List>
                                                <Tabs.Tab value="brevo" leftSection={<Zap size={14} />}>Brevo (Recommended)</Tabs.Tab>
                                                <Tabs.Tab value="smtp" leftSection={<Server size={14} />}>Custom SMTP</Tabs.Tab>
                                            </Tabs.List>
                                        </Group>

                                        <Tabs.Panel value="brevo">
                                            <Stack gap="md">
                                                <Alert icon={<Zap size={16} />} title="Fast Brevo Integration" color="green" variant="light" radius="md">
                                                    Using Brevo REST API. You only need your <b>API Key</b> (v3) to send emails. Reliable and secure.
                                                </Alert>
                                                
                                                <TextInput
                                                    label="Brevo API Key (v3)"
                                                    placeholder="xkeysib-..."
                                                    description="Found in Brevo > SMTP & API > API Keys. Ensure it starts with 'xkeysib-'"
                                                    required={form.values.emailProvider === "brevo"}
                                                    type="password"
                                                    {...form.getInputProps("brevoApiKey")}
                                                    error={form.values.emailProvider === "brevo" && form.values.brevoApiKey && !form.values.brevoApiKey.startsWith("xkeysib-") ? "API Key must start with 'xkeysib-'. Please copy the full key." : null}
                                                />

                                                <Divider label="Technical Overrides" labelPosition="center" my="xs" />
                                                <Text size="xs" c="dimmed">The default host for Brevo is <b>smtp-relay.brevo.com</b>. Port <b>587</b>.</Text>
                                                
                                                <Grid gutter="md">
                                                    <Grid.Col span={8}>
                                                        <TextInput
                                                            label="Default Host"
                                                            value="smtp-relay.brevo.com"
                                                            disabled
                                                        />
                                                    </Grid.Col>
                                                    <Grid.Col span={4}>
                                                        <NumberInput
                                                            label="Port"
                                                            value={587}
                                                            disabled
                                                        />
                                                    </Grid.Col>
                                                </Grid>
                                            </Stack>
                                        </Tabs.Panel>

                                        <Tabs.Panel value="smtp">
                                            <Stack gap="md">
                                                <Alert icon={<Server size={16} />} title="Custom SMTP Configuration" color="gray" variant="light" radius="md">
                                                    Connect to any SMTP server like Gmail, Outlook, or Amazon SES.
                                                </Alert>

                                                {/* Gmail App Password Warning */}
                                                {form.values.smtpHost?.includes('gmail') && (
                                                    <Alert 
                                                        icon={<AlertCircle size={16} />} 
                                                        title="⚠️ Gmail requires an App Password" 
                                                        color="orange" 
                                                        variant="light" 
                                                        radius="md"
                                                    >
                                                        Gmail does <b>not</b> allow your regular password here. You must create an <b>App Password</b>:
                                                        <ol style={{ marginTop: 8, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
                                                            <li>Go to <b>myaccount.google.com</b> → Security</li>
                                                            <li>Enable <b>2-Step Verification</b> if not already active</li>
                                                            <li>Search for <b>"App Passwords"</b> → Select App: Mail</li>
                                                            <li>Copy the 16-character code and paste it in the Password field below</li>
                                                        </ol>
                                                        <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: '#e67700', fontWeight: 600, fontSize: 13 }}>
                                                            → Open App Passwords settings
                                                        </a>
                                                    </Alert>
                                                )}

                                                {/* Common SMTP Quick Guide */}
                                                <Alert icon={<Info size={16} />} title="Common SMTP Settings" color="blue" variant="light" radius="md">
                                                    <table style={{ fontSize: 12, width: '100%', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ textAlign: 'left', paddingBottom: 4, color: '#495057' }}>Provider</th>
                                                                <th style={{ textAlign: 'left', paddingBottom: 4, color: '#495057' }}>Host</th>
                                                                <th style={{ textAlign: 'left', paddingBottom: 4, color: '#495057' }}>Port</th>
                                                                <th style={{ textAlign: 'left', paddingBottom: 4, color: '#495057' }}>Encryption</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr><td>Gmail</td><td>smtp.gmail.com</td><td>587</td><td>TLS (App Password)</td></tr>
                                                            <tr><td>Outlook</td><td>smtp-mail.outlook.com</td><td>587</td><td>TLS</td></tr>
                                                            <tr><td>Brevo</td><td>smtp-relay.brevo.com</td><td>587</td><td>TLS</td></tr>
                                                            <tr><td>Amazon SES</td><td>email-smtp.us-east-1.amazonaws.com</td><td>587</td><td>TLS</td></tr>
                                                        </tbody>
                                                    </table>
                                                </Alert>

                                                <Grid gutter="md">
                                                    <Grid.Col span={{ base: 12, md: 8 }}>
                                                        <TextInput 
                                                            label="SMTP Host" 
                                                            placeholder="smtp.gmail.com"
                                                            required={form.values.emailProvider === "smtp"}
                                                            {...form.getInputProps("smtpHost")}
                                                        />
                                                    </Grid.Col>
                                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                                        <NumberInput 
                                                            label="Port" 
                                                            placeholder="587"
                                                            required={form.values.emailProvider === "smtp"}
                                                            {...form.getInputProps("smtpPort")}
                                                        />
                                                    </Grid.Col>
                                                </Grid>

                                                <Grid gutter="md">
                                                    <Grid.Col span={{ base: 12, md: 6 }}>
                                                        <TextInput 
                                                            label="SMTP Username" 
                                                            placeholder="your@gmail.com"
                                                            description="Usually your full email address"
                                                            required={form.values.emailProvider === "smtp"}
                                                            {...form.getInputProps("smtpUser")}
                                                        />
                                                    </Grid.Col>
                                                    <Grid.Col span={{ base: 12, md: 6 }}>
                                                        <TextInput 
                                                            label="SMTP Password" 
                                                            type="password" 
                                                            placeholder="••••••••"
                                                            description={form.values.smtpHost?.includes('gmail') ? "⚠️ Use App Password, not your Google account password" : "Your SMTP password or API key"}
                                                            required={form.values.emailProvider === "smtp"}
                                                            {...form.getInputProps("smtpPass")}
                                                        />
                                                    </Grid.Col>
                                                </Grid>

                                                <Select
                                                  label="Encryption Method"
                                                  data={[
                                                    { value: "tls", label: "STARTTLS (Standard - Port 587)" },
                                                    { value: "ssl", label: "SSL/TLS (Standard - Port 465)" },
                                                    { value: "none", label: "None (Insecure - Not Recommended)" },
                                                  ]}
                                                  {...form.getInputProps("encryption")}
                                                />
                                            </Stack>
                                        </Tabs.Panel>

                                    </Tabs>
                                </Paper>

                                <Paper withBorder shadow="sm" radius="lg" p="xl">
                                    <Group mb="lg" gap="sm">
                                        <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                                            <User size={20} />
                                        </ThemeIcon>
                                        <Title order={4}>Sender Information</Title>
                                    </Group>
                                    <Grid gutter="md">
                                        <Grid.Col span={{ base: 12, md: 6 }}>
                                            <TextInput 
                                                label="Displayed Sender Name" 
                                                placeholder="VectorWiz Support"
                                                required
                                                {...form.getInputProps("senderName")}
                                            />
                                        </Grid.Col>
                                        <Grid.Col span={{ base: 12, md: 6 }}>
                                            <TextInput 
                                                label="Sender Email Address" 
                                                placeholder="noreply@vectorwiz.com"
                                                required
                                                {...form.getInputProps("senderEmail")}
                                            />
                                        </Grid.Col>
                                    </Grid>
                                    <Text size="xs" c="dimmed" mt="xs">Note: Your provider may require that this email is verified in their dashboard.</Text>
                                </Paper>
                            </Stack>
                        </Grid.Col>

                        {/* Routing & Sidebar */}
                        <Grid.Col span={{ base: 12, lg: 4 }}>
                            <Stack gap="lg">
                                <Paper withBorder shadow="sm" radius="lg" p="xl" className="bg-gray-50/30">
                                    <Group mb="md" gap="sm">
                                        <ThemeIcon variant="light" color="blue" size="md" radius="md">
                                            <Globe size={16} />
                                        </ThemeIcon>
                                        <Title order={5}>Routing (CC/BCC)</Title>
                                    </Group>
                                    <Stack gap="md">
                                        <TagsInput
                                            label="CC Notifications"
                                            placeholder="Press Enter to add"
                                            description="Copy these addresses on all alerts"
                                            splitChars={[',', ' ', '|']}
                                            {...form.getInputProps("ccEmails")}
                                        />
                                        <TagsInput
                                            label="BCC Tracking"
                                            placeholder="Press Enter to add"
                                            description="Hidden copies for audit/logs"
                                            splitChars={[',', ' ', '|']}
                                            {...form.getInputProps("bccEmails")}
                                        />
                                    </Stack>
                                </Paper>

                                <Paper withBorder shadow="sm" radius="lg" p="xl">
                                    <Group mb="md" gap="sm">
                                        <ThemeIcon variant="light" color="green" size="md" radius="md">
                                            <Send size={16} />
                                        </ThemeIcon>
                                        <Title order={5}>Test Connection</Title>
                                    </Group>
                                    <TextInput 
                                        placeholder="test@your-email.com" 
                                        mb="md"
                                        label="Receiver Email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.currentTarget.value)}
                                    />
                                    <Button 
                                        fullWidth 
                                        variant="light" 
                                        color="green" 
                                        onClick={handleTest}
                                        loading={isTesting}
                                        disabled={isTesting || !testEmail}
                                        leftSection={<Send size={14} />}
                                    >
                                        Send Delivery Test
                                    </Button>
                                </Paper>

                                <Button 
                                    size="lg" 
                                    radius="md" 
                                    color="green" 
                                    className="shadow-lg hover:shadow-xl transition-all"
                                    leftSection={<Check size={20} />}
                                    type="submit"
                                    loading={updateMutation.isPending}
                                    fullWidth
                                >
                                    Save All Settings
                                </Button>
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </form>
            </Stack>
        </AdminLayout>
    );
}
