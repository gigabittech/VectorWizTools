import AdminLayout from "@/components/layout/AdminLayout";
import { Paper, Title, Text, Table, Badge, Group, Button, Switch, Tooltip, Stack, ActionIcon } from "@mantine/core";
import { Edit2, Trash2, Eye, Plus, Search, Filter } from "lucide-react";
import { useState } from "react";

const INITIAL_TOOLS = [
    { id: "dpi-calculator", name: "DPI Calculator", category: "Image Tools", status: "active", usage: 1240 },
    { id: "turnaround-estimator", name: "Turnaround Estimator", category: "Utility", status: "active", usage: 850 },
    { id: "vector-checker", name: "Vector Checker", category: "Analysis", status: "active", usage: 2100 },
    { id: "format-converter", name: "Format Converter", category: "Conversion", status: "active", usage: 3400 },
    { id: "color-extractor", name: "Color Extractor", category: "Design", status: "active", usage: 450 },
    { id: "file-size-calculator", name: "File Size Calculator", category: "Utility", status: "active", usage: 320 },
    { id: "print-size-calculator", name: "Print Size Calculator", category: "Print", status: "active", usage: 120 },
    { id: "logo-dimensions", name: "Logo Dimensions", category: "Branding", status: "active", usage: 980 },
    { id: "vector-simplifier", name: "Vector Simplifier", category: "Optimization", status: "active", usage: 560 },
    { id: "aspect-ratio-calculator", name: "Aspect Ratio Calculator", category: "Utility", status: "active", usage: 230 },
    { id: "font-to-vector", name: "Font to Vector", category: "Design", status: "active", usage: 1100 },
];

export default function ToolsManagement() {
    const [tools, setTools] = useState(INITIAL_TOOLS);

    const toggleStatus = (id: string) => {
        setTools(tools.map(tool =>
            tool.id === id
                ? { ...tool, status: tool.status === "active" ? "inactive" : "active" }
                : tool
        ));
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <Group justify="space-between" align="flex-end">
                    <div>
                        <Title order={2} className="text-2xl font-bold text-gray-900">Tools Management</Title>
                        <Text c="dimmed" size="sm" mt={4}>Manage and monitor all professional vector tools available on the platform.</Text>
                    </div>
                    <Button
                        leftSection={<Plus size={16} />}
                        color="green"
                        radius="md"
                        className="bg-[#0B9F47] hover:bg-[#0B9F47]/90"
                    >
                        Add New Tool
                    </Button>
                </Group>

                <Paper withBorder shadow="sm" radius="lg" p="xl" className="bg-white">
                    <Group justify="space-between" mb="xl">
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-80">
                            <Search size={16} className="text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Search tools..."
                                className="bg-transparent border-none outline-none text-sm w-full"
                            />
                        </div>
                        <Group gap="sm">
                            <Button variant="light" color="gray" leftSection={<Filter size={14} />} size="sm">Filter</Button>
                            <Text size="xs" c="dimmed">{tools.length} Tools Total</Text>
                        </Group>
                    </Group>

                    <Table verticalSpacing="md" highlightOnHover>
                        <Table.Thead className="bg-gray-50/50">
                            <Table.Tr>
                                <Table.Th>Tool Name</Table.Th>
                                <Table.Th>Category</Table.Th>
                                <Table.Th>Total Usage</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th ta="right">Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {tools.map((tool) => (
                                <Table.Tr key={tool.id}>
                                    <Table.Td>
                                        <Text fw={600} size="sm">{tool.name}</Text>
                                        <Text size="xs" c="dimmed">ID: {tool.id}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" color="blue" radius="sm" size="sm">
                                            {tool.category}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{tool.usage.toLocaleString()}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Switch
                                                size="xs"
                                                checked={tool.status === "active"}
                                                onChange={() => toggleStatus(tool.id)}
                                                color="green"
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
                                            <Tooltip label="View Stats">
                                                <ActionIcon variant="subtle" color="blue" size="sm">
                                                    <Eye size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Edit Details">
                                                <ActionIcon variant="subtle" color="gray" size="sm">
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
                </Paper>
            </div>
        </AdminLayout>
    );
}
