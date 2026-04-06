import AdminLayout from "@/components/layout/AdminLayout";
import {
    Paper, Title, Text, Table, Badge, Group, Button, Switch,
    Tooltip, ActionIcon, Loader, Modal, TextInput, Textarea,
    Select, MultiSelect, Pagination, Box, Divider, Stack, TagsInput, Tabs, NumberInput
} from "@mantine/core";
import { Edit2, Trash2, Search, Filter, X, Plus, Globe, FileText, HelpCircle, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CustomRichTextEditor } from "@/components/ui/RichTextEditor";

type ToolWithCms = any; // We'll use any for now or define the full type based on Tool + CMS

export default function ToolsManagement() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<string | null>("10");

    const [editingTool, setEditingTool] = useState<ToolWithCms | null>(null);
    const [modalOpened, setModalOpened] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>("general");

    const { data: tools = [], isLoading } = useQuery<ToolWithCms[]>({
        queryKey: ["/api/tools"],
    });

    const [viewingTool, setViewingTool] = useState<ToolWithCms | null>(null);
    const [viewModalOpened, setViewModalOpened] = useState(false);

    const editForm = useForm({
        initialValues: {
            name: "",
            title: "",
            slug: "",
            tool_component: "",
            description: "",
            category: "",
            status: "",
            keywords: [] as string[],
            howToSteps: [] as string[],
            is_active: "active",
            index_name: 0,
            // SEO
            seo: {
                metaTitle: "",
                metaDescription: "",
                metaKeywords: "",
                canonicalUrl: "",
                ogTitle: "",
                ogDescription: "",
                indexStatus: "index",
                followStatus: "follow",
            },
            // Content
            contents: {
                h1Title: "",
                introContent: "",
                howToUse: "",
                features: "",
                bottomContent: "",
            }
        },
        validate: {
            slug: (value: string) => {
                if (!value) return "Slug is required";
                const isDuplicate = tools.some((t: any) => t.slug === value && t.id !== editingTool?.id);
                return isDuplicate ? "This slug is already in use by another tool" : null;
            }
        }
    });

    const [faqForm, setFaqForm] = useState({ question: "", answer: "" });
    const [linkForm, setLinkForm] = useState({ relatedToolId: "", anchorText: "" });

    const categories = useMemo(() => {
        const cats = new Set(tools.map((t: any) => t.category));
        return Array.from(cats).map(c => ({ value: c, label: c }));
    }, [tools]);

    const updateToolMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const { seo, contents, ...toolData } = data;

            // 1. Update Tool Basic Info
            await apiRequest("PATCH", `/api/tools/${id}`, toolData);

            // 2. Update SEO
            if (seo) {
                await apiRequest("PATCH", `/api/tools/${id}/seo`, seo);
            }

            // 3. Update Content
            if (contents) {
                await apiRequest("PATCH", `/api/tools/${id}/contents`, contents);
            }

            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
            toast({ title: "Success", description: "Tool and CMS data updated successfully" });
            setModalOpened(false);
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update tool",
                variant: "destructive"
            });
        }
    });

    const handleEdit = (tool: any) => {
        setEditingTool(tool);
        editForm.setValues({
            name: tool.name || "",
            title: tool.title || "",
            slug: tool.slug || "",
            tool_component: tool.tool_component || "",
            description: tool.description || "",
            category: tool.category || "",
            status: tool.status || "active",
            keywords: tool.keywords || [],
            howToSteps: tool.howToSteps || [],
            is_active: tool.is_active || "active",
            index_name: tool.index_name || 0,
            seo: {
                metaTitle: tool.seo?.metaTitle || "",
                metaDescription: tool.seo?.metaDescription || "",
                metaKeywords: tool.seo?.metaKeywords || "",
                canonicalUrl: tool.seo?.canonicalUrl || "",
                ogTitle: tool.seo?.ogTitle || "",
                ogDescription: tool.seo?.ogDescription || "",
                indexStatus: tool.seo?.indexStatus || "index",
                followStatus: tool.seo?.followStatus || "follow",
            },
            contents: {
                h1Title: tool.contents?.h1Title || "",
                introContent: tool.contents?.introContent || "",
                howToUse: tool.contents?.howToUse || "",
                features: tool.contents?.features || "",
                bottomContent: tool.contents?.bottomContent || "",
            }
        });
        setModalOpened(true);
    };

    const addFaqMutation = useMutation({
        mutationFn: (toolId: string) => apiRequest("POST", `/api/tools/${toolId}/faqs`, faqForm),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
            setFaqForm({ question: "", answer: "" });
            toast({ title: "FAQ Added" });
        }
    });

    const deleteFaqMutation = useMutation({
        mutationFn: (id: string) => apiRequest("DELETE", `/api/faqs/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
            toast({ title: "FAQ Deleted" });
        }
    });

    const addLinkMutation = useMutation({
        mutationFn: (toolId: string) => apiRequest("POST", `/api/tools/${toolId}/internal-links`, linkForm),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
            setLinkForm({ relatedToolId: "", anchorText: "" });
            toast({ title: "Internal Link Added" });
        }
    });

    const deleteLinkMutation = useMutation({
        mutationFn: (id: string) => apiRequest("DELETE", `/api/internal-links/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
            toast({ title: "Internal Link Deleted" });
        }
    });

    const handleUpdate = (values: typeof editForm.values) => {
        if (editingTool) {
            updateToolMutation.mutate({ id: editingTool.id, data: values });
        }
    };

    const handleView = (tool: any) => {
        setViewingTool(tool);
        setViewModalOpened(true);
    };

    const filteredTools = useMemo(() => {
        return tools.filter((tool: any) => {
            const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tool.tool_id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === "all" || !selectedCategory || tool.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [tools, searchTerm, selectedCategory]);

    const paginatedTools = useMemo(() => {
        const size = parseInt(pageSize || "10");
        const start = (page - 1) * size;
        return filteredTools.slice(start, start + size);
    }, [filteredTools, page, pageSize]);

    const totalPages = Math.ceil(filteredTools.length / parseInt(pageSize || "10"));

    return (
        <AdminLayout>
            <div className="space-y-6">
                <Group justify="space-between" align="flex-end">
                    <div>
                        <Title order={2} className="text-2xl font-bold text-gray-900">CMS & Tools Management</Title>
                        <Text c="dimmed" size="sm" mt={4}>Control SEO, Content, and Tool logic from this unified dashboard.</Text>
                    </div>
                </Group>

                <Paper withBorder shadow="sm" radius="lg" p="xl" className="bg-white">
                    <Group justify="space-between" mb="xl">
                        <Group>
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64">
                                <Search size={16} className="text-gray-400 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Search tools..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                    className="bg-transparent border-none outline-none text-sm w-full"
                                />
                            </div>
                            <Select
                                placeholder="Category"
                                data={[{ value: "all", label: "All Categories" }, ...categories]}
                                value={selectedCategory}
                                onChange={(val) => {
                                    setSelectedCategory(val);
                                    setPage(1);
                                }}
                                size="sm"
                                w={200}
                                radius="md"
                            />
                        </Group>
                    </Group>

                    {isLoading ? (
                        <div className="py-20 text-center">
                            <Loader color="green" />
                        </div>
                    ) : (
                        <Table verticalSpacing="md" highlightOnHover>
                            <Table.Thead className="bg-gray-50/50">
                                <Table.Tr>
                                    <Table.Th>Index</Table.Th>
                                    <Table.Th>Tool Name / Slug</Table.Th>
                                    <Table.Th>Description</Table.Th>
                                    <Table.Th>Category</Table.Th>
                                    <Table.Th>CMS Status</Table.Th>
                                    {/* <Table.Th>SEO Health</Table.Th> */}
                                    <Table.Th ta="right">Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {paginatedTools.map((tool: any) => (
                                    <Table.Tr key={tool.id}>
                                        <Table.Td>
                                            <Badge variant="outline" color="gray">{tool.index_name || 0}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text fw={600} size="sm">{tool.name}</Text>
                                            <Code size="xs">/{tool.slug || tool.tool_id}</Code>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed" lineClamp={2} w={200}>{tool.description || '-'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light" color="blue" radius="sm" size="sm">
                                                {tool.category}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={tool.is_active === 'active' ? 'green' : 'red'} variant="dot">
                                                {tool.is_active}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs" justify="flex-end">
                                                <Tooltip label="View Details">
                                                    <ActionIcon variant="subtle" color="gray" size="md" onClick={() => handleView(tool)}>
                                                        <Eye size={18} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Edit Details & CMS">
                                                    <ActionIcon variant="subtle" color="blue" size="md" onClick={() => handleEdit(tool)}>
                                                        <Edit2 size={18} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}

                    {!isLoading && totalPages > 1 && (
                        <div className="mt-8 flex justify-between items-center border-t pt-6">
                            <Group>
                                <Text size="sm" c="dimmed">
                                    Showing {Math.min((page - 1) * parseInt(pageSize || "10") + 1, filteredTools.length)} to {Math.min(page * parseInt(pageSize || "10"), filteredTools.length)} of {filteredTools.length} tools
                                </Text>
                                <Group gap="xs">
                                    <Text size="xs" c="dimmed">Items per page:</Text>
                                    <Select
                                        size="xs"
                                        w={70}
                                        data={["10", "20", "50", "100"]}
                                        value={pageSize}
                                        onChange={(val) => {
                                            setPageSize(val);
                                            setPage(1);
                                        }}
                                    />
                                </Group>
                            </Group>
                            <Pagination total={totalPages} value={page} onChange={setPage} color="green" radius="md" />
                        </div>
                    )}
                </Paper>
            </div>

            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title={<Title order={4}>Manage Tool: {editingTool?.name}</Title>}
                size="70%"
                radius="lg"
            >
                <Tabs value={activeTab} onChange={setActiveTab} color="green">
                    <Tabs.List mb="md">
                        <Tabs.Tab value="general" leftSection={<Edit2 size={16} />}>General Settings</Tabs.Tab>
                        <Tabs.Tab value="seo" leftSection={<Globe size={16} />}>SEO (Meta & OG)</Tabs.Tab>
                        <Tabs.Tab value="content" leftSection={<FileText size={16} />}>Page Content</Tabs.Tab>
                        <Tabs.Tab value="faqs" leftSection={<HelpCircle size={16} />}>FAQs</Tabs.Tab>
                        <Tabs.Tab className="hidden" value="links" leftSection={<Globe size={16} />}>Internal Links</Tabs.Tab>
                    </Tabs.List>

                    <form onSubmit={editForm.onSubmit(handleUpdate)}>
                        <Tabs.Panel value="general">
                            <Stack gap="md">
                                <Group grow>
                                    <TextInput label="Tool Name" required {...editForm.getInputProps('name')} />
                                    <TextInput label="Display Title" required {...editForm.getInputProps('title')} />
                                </Group>
                                <Group grow>
                                    <TextInput label="URL Slug" required {...editForm.getInputProps('slug')} />
                                    <TextInput label="React Component Name" className="hidden" readOnly placeholder="e.g. DpiCalculator" {...editForm.getInputProps('tool_component')} />
                                </Group>
                                <Textarea label="Description" minRows={3} required {...editForm.getInputProps('description')} />
                                <Group grow>
                                    <Select label="Category" data={categories} required {...editForm.getInputProps('category')} />
                                    <Select label="Internal Logic Status" className="hidden" data={['active', 'coming-soon']} {...editForm.getInputProps('status')} />
                                    <Select
                                        label="Public Visibility (is_active)"
                                        data={[{ value: 'active', label: 'Active (Show)' }, { value: 'in_active', label: 'Inactive (Hide)' }]}
                                        required
                                        {...editForm.getInputProps('is_active')}
                                    />
                                    <NumberInput label="Index / Serial No" placeholder="0" {...editForm.getInputProps('index_name')} />
                                </Group>
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="seo">
                            <Stack gap="md">
                                <Group grow>
                                    <TextInput label="Meta Title" placeholder="Target SEO Title" {...editForm.getInputProps('seo.metaTitle')} />
                                    <TextInput label="OG Title" placeholder="Open Graph Title" {...editForm.getInputProps('seo.ogTitle')} />
                                </Group>
                                <Group grow>
                                    <Textarea label="Meta Description" placeholder="SEO Description (150-160 chars)" {...editForm.getInputProps('seo.metaDescription')} />
                                    <Textarea label="OG Description" placeholder="Open Graph Description" {...editForm.getInputProps('seo.ogDescription')} />
                                </Group>
                                <TextInput label="Canonical URL" {...editForm.getInputProps('seo.canonicalUrl')} />
                                <Group grow>
                                    <Select label="Index Status" data={['index', 'noindex']} {...editForm.getInputProps('seo.indexStatus')} />
                                    <Select label="Follow Status" data={['follow', 'nofollow']} {...editForm.getInputProps('seo.followStatus')} />
                                </Group>
                                <TagsInput label="Tool Keywords (App-level)" {...editForm.getInputProps('keywords')} />
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="content">
                            <Stack gap="md" mt="md">
                                <CustomRichTextEditor
                                    label="H1 Title"
                                    value={editForm.values.contents.h1Title || ''}
                                    onChange={(val) => editForm.setFieldValue('contents.h1Title', val)}
                                />
                                <CustomRichTextEditor
                                    label="Intro Content"
                                    value={editForm.values.contents.introContent || ''}
                                    onChange={(val) => editForm.setFieldValue('contents.introContent', val)}
                                />
                                <CustomRichTextEditor
                                    label="How to Use"
                                    value={editForm.values.contents.howToUse || ''}
                                    onChange={(val) => editForm.setFieldValue('contents.howToUse', val)}
                                />
                                <CustomRichTextEditor
                                    label="Features Section"
                                    value={editForm.values.contents.features || ''}
                                    onChange={(val) => editForm.setFieldValue('contents.features', val)}
                                />
                                <CustomRichTextEditor
                                    label="Bottom Content"
                                    value={editForm.values.contents.bottomContent || ''}
                                    onChange={(val) => editForm.setFieldValue('contents.bottomContent', val)}
                                />
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="faqs">
                            <Stack gap="md" mt="md">
                                <Box p="md" className="bg-gray-50 rounded-lg border">
                                    <Title order={5} mb="sm">Add New FAQ</Title>
                                    <Stack gap="sm">
                                        <TextInput
                                            label="Question"
                                            placeholder="Enter question"
                                            value={faqForm.question}
                                            onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                                        />
                                        <CustomRichTextEditor
                                            label="Answer"
                                            value={faqForm.answer}
                                            onChange={(val) => setFaqForm({ ...faqForm, answer: val })}
                                        />
                                        <Button
                                            size="sm"
                                            color="blue"
                                            leftSection={<Plus size={14} />}
                                            onClick={() => editingTool && addFaqMutation.mutate(editingTool.id)}
                                            disabled={!faqForm.question || !faqForm.answer || faqForm.answer === '<p></p>'}
                                            mt="xs"
                                        >
                                            Add FAQ
                                        </Button>
                                    </Stack>
                                </Box>
                                <Divider label="Existing FAQs" labelPosition="center" />
                                {editingTool?.faqs?.map((faq: any) => (
                                    <Paper key={faq.id} withBorder p="sm" radius="md">
                                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                                            <div style={{ flex: 1 }}>
                                                <Text size="sm" fw={600}>{faq.question}</Text>
                                                <div
                                                    className="text-xs text-gray-400 mt-1 line-clamp-2 prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                                                />
                                            </div>
                                            <ActionIcon color="red" variant="light" size="sm" onClick={() => deleteFaqMutation.mutate(faq.id)}>
                                                <X size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel className=" hidden" value="links">
                            <Stack gap="md" mt="md">
                                <Box p="md" className="bg-gray-50 rounded-lg border">
                                    <Title order={5} mb="sm">Add Internal Link</Title>
                                    <Group grow align="flex-end">
                                        <Select
                                            label="Select Tool"
                                            placeholder="Click to select"
                                            data={tools.filter((t: any) => t.id !== editingTool?.id).map((t: any) => ({ value: t.id, label: t.name }))}
                                            value={linkForm.relatedToolId}
                                            onChange={(val) => setLinkForm({ ...linkForm, relatedToolId: val || "" })}
                                            searchable
                                        />
                                        <TextInput
                                            label="Anchor Text"
                                            placeholder="e.g. Related Tool"
                                            value={linkForm.anchorText}
                                            onChange={(e) => setLinkForm({ ...linkForm, anchorText: e.target.value })}
                                        />
                                        <Button
                                            color="blue"
                                            onClick={() => editingTool && addLinkMutation.mutate(editingTool.id)}
                                            disabled={!linkForm.relatedToolId || !linkForm.anchorText}
                                        >
                                            Add Link
                                        </Button>
                                    </Group>
                                </Box>
                                <Divider label="Current Links" labelPosition="center" />
                                <Table>
                                    <Table.Thead><Table.Tr><Table.Th>Related Tool</Table.Th><Table.Th>Anchor Text</Table.Th><Table.Th ta="right">Action</Table.Th></Table.Tr></Table.Thead>
                                    <Table.Tbody>
                                        {editingTool?.internalLinks?.map((link: any) => (
                                            <Table.Tr key={link.id}>
                                                <Table.Td>{link.relatedTool?.name || 'Unknown'}</Table.Td>
                                                <Table.Td><Code size="xs">{link.anchorText}</Code></Table.Td>
                                                <Table.Td ta="right">
                                                    <ActionIcon color="red" variant="subtle" size="sm" onClick={() => deleteLinkMutation.mutate(link.id)}>
                                                        <Trash2 size={14} />
                                                    </ActionIcon>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Stack>
                        </Tabs.Panel>

                        <Group justify="flex-end" mt="xl">
                            <Button variant="outline" onClick={() => setModalOpened(false)}>Cancel</Button>
                            <Button type="submit" color="green" loading={updateToolMutation.isPending}>Save CMS Data</Button>
                        </Group>
                    </form>
                </Tabs>
            </Modal>

            <Modal
                opened={viewModalOpened}
                onClose={() => setViewModalOpened(false)}
                title={<Title order={4}>Tool Details: {viewingTool?.name}</Title>}
                size="lg"
                radius="lg"
            >
                {viewingTool && (
                    <Stack gap="md">
                        <Box p="md" className="bg-gray-50 rounded-lg">
                            <Text fw={700} size="sm" mb={4}>General Info</Text>
                            <Group grow>
                                <div><Text size="xs" c="dimmed">Name</Text><Text size="sm">{viewingTool.name}</Text></div>
                                <div><Text size="xs" c="dimmed">Slug</Text><Text size="sm">{viewingTool.slug || viewingTool.tool_id}</Text></div>
                            </Group>
                            <Box mt="xs">
                                <Text size="xs" c="dimmed">Description</Text>
                                <Text size="sm">{viewingTool.description || '-'}</Text>
                            </Box>
                            <Box mt="xs">
                                <Text size="xs" c="dimmed">Full Description</Text>
                                <Text size="sm">{viewingTool.description || '-'}</Text>
                            </Box>
                        </Box>

                        <Box p="md" className="border rounded-lg">
                            <Text fw={700} size="sm" mb={4}>SEO & OG Details</Text>
                            <Stack gap="xs">
                                <div><Text size="xs" c="dimmed">Meta Title</Text><Text size="sm">{viewingTool.seo?.metaTitle || 'Not Set'}</Text></div>
                                <div><Text size="xs" c="dimmed">OG Title</Text><Text size="sm">{viewingTool.seo?.ogTitle || 'Not Set'}</Text></div>
                                <div><Text size="xs" c="dimmed">Meta Description</Text><Text size="sm">{viewingTool.seo?.metaDescription || 'Not Set'}</Text></div>
                                <div><Text size="xs" c="dimmed">OG Description</Text><Text size="sm">{viewingTool.seo?.ogDescription || 'Not Set'}</Text></div>
                            </Stack>
                        </Box>

                        <Box p="md" className="border rounded-lg">
                            <Text fw={700} size="sm" mb={4}>Content Status</Text>
                            <Group>
                                <Badge color={viewingTool.contents?.h1Title ? 'green' : 'red'}>H1 Title</Badge>
                                <Badge color={viewingTool.contents?.introContent ? 'green' : 'red'}>Intro</Badge>
                                <Badge color={viewingTool.faqs?.length ? 'green' : 'red'}>{viewingTool.faqs?.length || 0} FAQs</Badge>
                            </Group>
                        </Box>

                        <Group justify="flex-end">
                            <Button variant="light" onClick={() => setViewModalOpened(false)}>Close</Button>
                            <Button color="blue" onClick={() => { setViewModalOpened(false); handleEdit(viewingTool); }}>Edit This Tool</Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </AdminLayout>
    );
}

const Code = ({ children, size }: { children: any; size?: any }) => (
    <Text component="code" size={size} className="bg-gray-100 px-1 rounded text-red-600 font-mono">
        {children}
    </Text>
);
