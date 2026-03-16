import AdminLayout from "@/components/layout/AdminLayout";
import {
    Paper, Title, Text, Table, Badge, Group, Button, Modal,
    TextInput, Textarea, Select, Stack, Box, Divider, Tabs,
    ActionIcon, Tooltip, Switch, NumberInput
} from "@mantine/core";
import { Globe, ArrowRightLeft, Plus, Edit2, Trash2, Save, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SeoRedirects() {
    const { toast } = useToast();
    const [redirectModalOpened, setRedirectModalOpened] = useState(false);
    const [editingRedirect, setEditingRedirect] = useState<any>(null);

    // Queries
    const { data: seoSettings = {}, isLoading: seoLoading } = useQuery<any>({
        queryKey: ["/api/seo-settings"],
    });

    const { data: redirects = [], isLoading: redirectsLoading } = useQuery<any[]>({
        queryKey: ["/api/redirects"],
    });

    // Forms
    const seoForm = useForm({
        initialValues: {
            defaultMetaTitle: "",
            defaultMetaDescription: "",
            defaultOgImage: "",
            sitemapEnabled: 1,
            schemaEnabled: 1,
        },
    });

    const redirectForm = useForm({
        initialValues: {
            oldUrl: "",
            newUrl: "",
            redirectType: "301",
        },
        validate: {
            oldUrl: (val) => (!val ? "Old URL is required" : null),
            newUrl: (val) => (!val ? "New URL is required" : null),
        }
    });

    // Sync form with data when loaded
    useEffect(() => {
        if (Object.keys(seoSettings).length > 0) {
            seoForm.setValues({
                defaultMetaTitle: seoSettings.defaultMetaTitle || "",
                defaultMetaDescription: seoSettings.defaultMetaDescription || "",
                defaultOgImage: seoSettings.defaultOgImage || "",
                sitemapEnabled: seoSettings.sitemapEnabled ?? 1,
                schemaEnabled: seoSettings.schemaEnabled ?? 1,
            });
        }
    }, [seoSettings]);

    // Mutations
    const updateSeoMutation = useMutation({
        mutationFn: (data: any) => apiRequest("PATCH", "/api/seo-settings", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/seo-settings"] });
            toast({ title: "Success", description: "Global SEO settings updated" });
        }
    });

    const createRedirectMutation = useMutation({
        mutationFn: (data: any) => apiRequest("POST", "/api/redirects", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/redirects"] });
            setRedirectModalOpened(false);
            redirectForm.reset();
            toast({ title: "Success", description: "Redirect created" });
        }
    });

    const updateRedirectMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => apiRequest("PATCH", `/api/redirects/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/redirects"] });
            setRedirectModalOpened(false);
            setEditingRedirect(null);
            redirectForm.reset();
            toast({ title: "Success", description: "Redirect updated" });
        }
    });

    const deleteRedirectMutation = useMutation({
        mutationFn: (id: string) => apiRequest("DELETE", `/api/redirects/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/redirects"] });
            toast({ title: "Success", description: "Redirect deleted" });
        }
    });

    const handleRedirectEdit = (redirect: any) => {
        setEditingRedirect(redirect);
        redirectForm.setValues({
            oldUrl: redirect.oldUrl,
            newUrl: redirect.newUrl,
            redirectType: redirect.redirectType,
        });
        setRedirectModalOpened(true);
    };

    const handleRedirectSubmit = (values: any) => {
        if (editingRedirect) {
            updateRedirectMutation.mutate({ id: editingRedirect.id, data: values });
        } else {
            createRedirectMutation.mutate(values);
        }
    };

    const handleSeoSubmit = (values: any) => {
        updateSeoMutation.mutate(values);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <Title order={2} className="text-2xl font-bold text-gray-900 line-tight">SEO & Redirects</Title>
                    <Text c="dimmed" size="sm" mt={4}>Manage global SEO settings and URL redirection rules.</Text>
                </div>

                <Tabs variant="pills" defaultValue="seo" color="green" radius="md">
                    <Tabs.List className="bg-white p-1 rounded-xl border shadow-sm mb-6 inline-flex">
                        <Tabs.Tab value="seo" leftSection={<Globe size={16} />} className="px-6 py-2">
                            Global SEO Settings
                        </Tabs.Tab>
                        <Tabs.Tab value="redirects" classNames={{ tab: "hidden" }} leftSection={<ArrowRightLeft size={16} />} className="px-6 py-2">
                            URL Redirects
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="seo">
                        <Paper withBorder shadow="sm" radius="lg" p="xl" className="bg-white max-w-4xl">
                            <form onSubmit={seoForm.onSubmit(handleSeoSubmit)}>
                                <Stack gap="xl">
                                    <Box>
                                        <Title order={4} mb="xs">Default Meta Information</Title>
                                        <Text size="sm" c="dimmed" mb="lg">These settings apply to pages that don't have specific SEO data defined.</Text>

                                        <Stack gap="md">
                                            <TextInput
                                                label="Default Meta Title"
                                                placeholder="VectorWiz - Best Vector Tools"
                                                {...seoForm.getInputProps('defaultMetaTitle')}
                                            />
                                            <Textarea
                                                label="Default Meta Description"
                                                placeholder="Global description for the entire platform..."
                                                minRows={3}
                                                {...seoForm.getInputProps('defaultMetaDescription')}
                                            />
                                            <TextInput
                                                label="Default OG Image URL"
                                                placeholder="https://example.com/og-image.jpg"
                                                {...seoForm.getInputProps('defaultOgImage')}
                                            />
                                        </Stack>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Title order={4} mb="xs">Advanced SEO Features</Title>
                                        <Group mt="lg" gap="xl">
                                            <Box style={{ flex: 1 }}>
                                                <Group justify="space-between">
                                                    <div>
                                                        <Text fw={600} size="sm">Sitemap Generation</Text>
                                                        <Text size="xs" c="dimmed">Automatically generate sitemap.xml</Text>
                                                    </div>
                                                    <Switch
                                                        checked={seoForm.values.sitemapEnabled === 1}
                                                        onChange={(e) => seoForm.setFieldValue('sitemapEnabled', e.currentTarget.checked ? 1 : 0)}
                                                        color="green"
                                                        size="md"
                                                    />
                                                </Group>
                                            </Box>
                                            <Box style={{ flex: 1 }}>
                                                <Group justify="space-between">
                                                    <div>
                                                        <Text fw={600} size="sm">JSON-LD Schema</Text>
                                                        <Text size="xs" c="dimmed">Inject organization schema globally</Text>
                                                    </div>
                                                    <Switch
                                                        checked={seoForm.values.schemaEnabled === 1}
                                                        onChange={(e) => seoForm.setFieldValue('schemaEnabled', e.currentTarget.checked ? 1 : 0)}
                                                        color="green"
                                                        size="md"
                                                    />
                                                </Group>
                                            </Box>
                                        </Group>
                                    </Box>

                                    <Group justify="flex-end" mt="xl">
                                        <Button
                                            type="submit"
                                            color="green"
                                            size="md"
                                            leftSection={<Save size={18} />}
                                            loading={updateSeoMutation.isPending}
                                        >
                                            Save Global Settings
                                        </Button>
                                    </Group>
                                </Stack>
                            </form>
                        </Paper>
                    </Tabs.Panel>

                    <Tabs.Panel value="redirects">
                        <Paper withBorder shadow="sm" radius="lg" p="xl" className="bg-white">
                            <Group justify="space-between" mb="xl">
                                <div>
                                    <Title order={4}>Active Redirects</Title>
                                    <Text size="sm" c="dimmed">Handle legacy URLs or fix broken links with 301/302 redirects.</Text>
                                </div>
                                <Button
                                    color="blue"
                                    leftSection={<Plus size={18} />}
                                    onClick={() => { setEditingRedirect(null); redirectForm.reset(); setRedirectModalOpened(true); }}
                                >
                                    Add New Redirect
                                </Button>
                            </Group>

                            {redirectsLoading ? (
                                <Box className="py-20 text-center"><Text>Loading redirects...</Text></Box>
                            ) : redirects.length === 0 ? (
                                <Box className="py-20 text-center border-2 border-dashed rounded-xl bg-gray-50">
                                    <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
                                    <Text fw={600} c="dimmed">No redirection rules found</Text>
                                    <Text size="sm" c="dimmed">Create your first redirect rule to get started.</Text>
                                </Box>
                            ) : (
                                <Table verticalSpacing="md" highlightOnHover>
                                    <Table.Thead className="bg-gray-50/50">
                                        <Table.Tr>
                                            <Table.Th>Type</Table.Th>
                                            <Table.Th>Old Path (Source)</Table.Th>
                                            <Table.Th>New Path (Destination)</Table.Th>
                                            <Table.Th>Created At</Table.Th>
                                            <Table.Th ta="right">Actions</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {redirects.map((r: any) => (
                                            <Table.Tr key={r.id}>
                                                <Table.Td>
                                                    <Badge color={r.redirectType === '301' ? 'blue' : 'orange'} variant="light">
                                                        {r.redirectType}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" className="font-mono text-pink-600">{r.oldUrl}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" className="font-mono text-green-600">{r.newUrl}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="xs" c="dimmed">{new Date(r.createdAt).toLocaleDateString()}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap="xs" justify="flex-end">
                                                        <Tooltip label="Edit">
                                                            <ActionIcon variant="subtle" color="blue" onClick={() => handleRedirectEdit(r)}>
                                                                <Edit2 size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="Delete">
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color="red"
                                                                loading={deleteRedirectMutation.isPending}
                                                                onClick={() => {
                                                                    if (confirm('Are you sure you want to delete this redirect?')) {
                                                                        deleteRedirectMutation.mutate(r.id);
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            )}
                        </Paper>
                    </Tabs.Panel>
                </Tabs>
            </div>

            <Modal
                opened={redirectModalOpened}
                onClose={() => setRedirectModalOpened(false)}
                title={<Title order={4}>{editingRedirect ? 'Edit Redirect' : 'Add New Redirect'}</Title>}
                radius="lg"
            >
                <form onSubmit={redirectForm.onSubmit(handleRedirectSubmit)}>
                    <Stack gap="md">
                        <TextInput
                            label="Old Path"
                            placeholder="/old-page-url"
                            required
                            {...redirectForm.getInputProps('oldUrl')}
                        />
                        <TextInput
                            label="New Path"
                            placeholder="/new-page-url or https://..."
                            required
                            {...redirectForm.getInputProps('newUrl')}
                        />
                        <Select
                            label="Redirect Type"
                            data={[
                                { value: '301', label: '301 - Permanent' },
                                { value: '302', label: '302 - Temporary' },
                            ]}
                            {...redirectForm.getInputProps('redirectType')}
                        />
                        <Group justify="flex-end" mt="xl">
                            <Button variant="outline" onClick={() => setRedirectModalOpened(false)}>Cancel</Button>
                            <Button type="submit" color="blue" loading={createRedirectMutation.isPending || updateRedirectMutation.isPending}>
                                {editingRedirect ? 'Update Redirect' : 'Create Redirect'}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </AdminLayout>
    );
}
