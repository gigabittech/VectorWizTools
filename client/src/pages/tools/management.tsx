import AdminLayout from "@/components/layout/AdminLayout";
import {
    Paper, Title, Text, Table, Badge, Group, Button, Switch,
    Tooltip, ActionIcon, Loader, Modal, TextInput, Textarea,
    Select, MultiSelect, Pagination, Box, Divider, Stack, TagsInput
} from "@mantine/core";
import { Edit2, Trash2, Search, Filter, X, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import { Tool } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ToolsManagement() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>("all");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [editingTool, setEditingTool] = useState<Tool | null>(null);
    const [modalOpened, setModalOpened] = useState(false);

    const { data: tools = [], isLoading } = useQuery<Tool[]>({
        queryKey: ["/api/tools"],
    });

    const editForm = useForm({
        initialValues: {
            name: "",
            title: "",
            description: "",
            category: "",
            status: "",
            keywords: [] as string[],
            howToSteps: [] as string[],
        },
    });

    const categories = useMemo(() => {
        const cats = new Set(tools.map(t => t.category));
        return Array.from(cats).map(c => ({ value: c, label: c }));
    }, [tools]);

    const updateToolMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Tool> }) => {
            const res = await apiRequest("PATCH", `/api/tools/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
            toast({ title: "Success", description: "Tool updated successfully" });
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

    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const res = await apiRequest("PATCH", `/api/tools/${id}`, { status });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
        },
    });

    const toggleStatus = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        toggleStatusMutation.mutate({ id, status: newStatus });
    };

    const handleEdit = (tool: Tool) => {
        setEditingTool(tool);
        editForm.setValues({
            name: tool.name || "",
            title: tool.title || "",
            description: tool.description || "",
            category: tool.category || "",
            status: tool.status || "active",
            keywords: tool.keywords || [],
            howToSteps: tool.howToSteps || [],
        });
        setModalOpened(true);
    };

    const handleUpdate = (values: typeof editForm.values) => {
        if (editingTool) {
            updateToolMutation.mutate({ id: editingTool.id, data: values });
        }
    };

    const filteredTools = useMemo(() => {
        return tools.filter(tool => {
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
                        <Title order={2} className="text-2xl font-bold text-gray-900">Tools Management</Title>
                        <Text c="dimmed" size="sm" mt={4}>Manage and monitor all professional vector tools available on the platform.</Text>
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
                        <Group gap="sm">
                            <Text size="xs" c="dimmed">{filteredTools.length} Tools Match</Text>
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
                                    <Table.Th>Tool Name</Table.Th>
                                    <Table.Th>Category</Table.Th>
                                    <Table.Th>Tool ID</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th ta="right">Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {paginatedTools.map((tool) => (
                                    <Table.Tr key={tool.id}>
                                        <Table.Td>
                                            <Text fw={600} size="sm">{tool.name}</Text>
                                            <Text size="xs" c="dimmed">{tool.title}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light" color="blue" radius="sm" size="sm">
                                                {tool.category}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{tool.tool_id}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Switch
                                                    size="xs"
                                                    checked={tool.status === "active"}
                                                    onChange={() => toggleStatus(tool.id, tool.status)}
                                                    color="green"
                                                    disabled={toggleStatusMutation.isPending}
                                                />
                                                <Badge
                                                    variant="dot"
                                                    color={tool.status === "active" ? "green" : "red"}
                                                    size="sm"
                                                >
                                                    {tool.status}
                                                </Badge>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs" justify="flex-end">
                                                <Tooltip label="Edit Details">
                                                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => handleEdit(tool)}>
                                                        <Edit2 size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Remove Tool">
                                                    <ActionIcon variant="subtle" color="red" size="sm">
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
                title={<Text fw={700} size="lg">Edit Tool: {editingTool?.name}</Text>}
                size="lg"
                radius="lg"
            >
                <form onSubmit={editForm.onSubmit(handleUpdate)}>
                    <Stack gap="md">
                        <Group grow>
                            <TextInput
                                label="Name"
                                placeholder="Enter tool name"
                                required
                                {...editForm.getInputProps('name')}
                            />
                            <TextInput
                                label="Title"
                                placeholder="Enter tool title"
                                required
                                {...editForm.getInputProps('title')}
                            />
                        </Group>

                        <TextInput
                            label="Tool ID (Not Editable)"
                            value={editingTool?.tool_id || ""}
                            disabled
                            styles={{ input: { backgroundColor: '#f8f9fa' } }}
                        />

                        <Textarea
                            label="Description"
                            placeholder="Enter tool description"
                            minRows={3}
                            required
                            {...editForm.getInputProps('description')}
                        />

                        <Group grow>
                            <Select
                                label="Category"
                                data={categories}
                                required
                                {...editForm.getInputProps('category')}
                            />
                            <Select
                                label="Status"
                                data={[
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' },
                                    { value: 'coming-soon', label: 'Coming Soon' },
                                ]}
                                required
                                {...editForm.getInputProps('status')}
                            />
                        </Group>

                        <TagsInput
                            label="Keywords"
                            placeholder="Type and press enter to add keywords"
                            {...editForm.getInputProps('keywords')}
                        />

                        <Divider label="How to Steps" labelPosition="center" />

                        {editForm.values.howToSteps.map((_, index) => (
                            <Group key={index} align="flex-end">
                                <TextInput
                                    placeholder={`Step ${index + 1}`}
                                    style={{ flex: 1 }}
                                    {...editForm.getInputProps(`howToSteps.${index}`)}
                                />
                                <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    onClick={() => {
                                        const steps = [...editForm.values.howToSteps];
                                        steps.splice(index, 1);
                                        editForm.setFieldValue('howToSteps', steps);
                                    }}
                                >
                                    <X size={16} />
                                </ActionIcon>
                            </Group>
                        ))}

                        <Button
                            variant="light"
                            color="blue"
                            leftSection={<Plus size={14} />}
                            onClick={() => editForm.setFieldValue('howToSteps', [...editForm.values.howToSteps, ''])}
                        >
                            Add Step
                        </Button>

                        <Group justify="flex-end" mt="xl">
                            <Button variant="outline" color="gray" onClick={() => setModalOpened(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                color="green"
                                loading={updateToolMutation.isPending}
                                className="bg-[#0B9F47] hover:bg-[#0B9F47]/90"
                            >
                                Save Changes
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </AdminLayout>
    );
}
