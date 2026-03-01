import AdminLayout from "@/components/layout/AdminLayout";
import {
    Paper, Title, Text, Table, Badge, Group, Button, Switch,
    Tooltip, ActionIcon, Loader, Modal, TextInput, Textarea,
    Select, MultiSelect, Pagination, Box, Divider, Stack, TagsInput, Tabs
} from "@mantine/core";
import { Edit2, Trash2, Search, Filter, X, Plus, Globe, FileText, HelpCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ToolWithCms = any; // We'll use any for now or define the full type based on Tool + CMS

export default function ToolsManagement() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>("all");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [editingTool, setEditingTool] = useState<ToolWithCms | null>(null);
    const [modalOpened, setModalOpened] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>("general");

    const { data: tools = [], isLoading } = useQuery<ToolWithCms[]>({
        queryKey: ["/api/tools"],
    });

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
            // SEO
            seo: {
                metaTitle: "",
                metaDescription: "",
                metaKeywords: "",
                canonicalUrl: "",
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
    });

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
            seo: {
                metaTitle: tool.seo?.metaTitle || "",
                metaDescription: tool.seo?.metaDescription || "",
                metaKeywords: tool.seo?.metaKeywords || "",
                canonicalUrl: tool.seo?.canonicalUrl || "",
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

    const handleUpdate = (values: typeof editForm.values) => {
        if (editingTool) {
            updateToolMutation.mutate({ id: editingTool.id, data: values });
        }
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
        const start = (page - 1) * pageSize;
        return filteredTools.slice(start, start + pageSize);
    }, [filteredTools, page]);

    const totalPages = Math.ceil(filteredTools.length / pageSize);

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
                                    <Table.Th>Tool Name / Slug</Table.Th>
                                    <Table.Th>Category</Table.Th>
                                    <Table.Th>CMS Status</Table.Th>
                                    <Table.Th>SEO Health</Table.Th>
                                    <Table.Th ta="right">Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {paginatedTools.map((tool: any) => (
                                    <Table.Tr key={tool.id}>
                                        <Table.Td>
                                            <Text fw={600} size="sm">{tool.name}</Text>
                                            <Code size="xs">/{tool.slug || tool.tool_id}</Code>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light" color="blue" radius="sm" size="sm">
                                                {tool.category}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={tool.status === 'active' ? 'green' : 'gray'} variant="dot">
                                                {tool.status}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                <Badge size="xs" color={tool.seo?.metaTitle ? 'green' : 'red'}>SEO</Badge>
                                                <Badge size="xs" color={tool.contents?.h1Title ? 'green' : 'red'}>Content</Badge>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs" justify="flex-end">
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
                        <div className="mt-8 flex justify-center">
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
                                    <TextInput label="React Component Name" placeholder="e.g. DpiCalculator" {...editForm.getInputProps('tool_component')} />
                                </Group>
                                <Textarea label="Short Description" minRows={3} required {...editForm.getInputProps('description')} />
                                <Group grow>
                                    <Select label="Category" data={categories} required {...editForm.getInputProps('category')} />
                                    <Select label="App Status" data={['active', 'inactive', 'coming-soon']} required {...editForm.getInputProps('status')} />
                                </Group>
                                <TagsInput label="Keywords" {...editForm.getInputProps('keywords')} />
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="seo">
                            <Stack gap="md">
                                <TextInput label="Meta Title" placeholder="Target SEO Title" {...editForm.getInputProps('seo.metaTitle')} />
                                <Textarea label="Meta Description" placeholder="SEO Description (150-160 chars)" {...editForm.getInputProps('seo.metaDescription')} />
                                <TextInput label="Canonical URL" {...editForm.getInputProps('seo.canonicalUrl')} />
                                <Group grow>
                                    <Select label="Index Status" data={['index', 'noindex']} {...editForm.getInputProps('seo.indexStatus')} />
                                    <Select label="Follow Status" data={['follow', 'nofollow']} {...editForm.getInputProps('seo.followStatus')} />
                                </Group>
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="content">
                            <Stack gap="md">
                                <TextInput label="H1 Title" {...editForm.getInputProps('contents.h1Title')} />
                                <Textarea label="Intro Content" minRows={4} {...editForm.getInputProps('contents.introContent')} />
                                <Textarea label="How to Use (HTML/Markdown)" minRows={4} {...editForm.getInputProps('contents.howToUse')} />
                                <Textarea label="Features Section" minRows={3} {...editForm.getInputProps('contents.features')} />
                                <Textarea label="Bottom Content" minRows={4} {...editForm.getInputProps('contents.bottomContent')} />
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="faqs">
                            <Text c="dimmed" size="sm" mb="md">FAQ Management coming soon in next sub-module. Basic fields added.</Text>
                            {/* FAQ Logic can be added here similarly */}
                        </Tabs.Panel>

                        <Group justify="flex-end" mt="xl">
                            <Button variant="outline" onClick={() => setModalOpened(false)}>Cancel</Button>
                            <Button type="submit" color="green" loading={updateToolMutation.isPending}>Save CMS Data</Button>
                        </Group>
                    </form>
                </Tabs>
            </Modal>
        </AdminLayout>
    );
}

const Code = ({ children, size }: { children: any; size?: any }) => (
    <Text component="code" size={size} className="bg-gray-100 px-1 rounded text-red-600 font-mono">
        {children}
    </Text>
);
