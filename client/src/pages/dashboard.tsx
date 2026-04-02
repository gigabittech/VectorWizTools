import { useEffect, useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Paper, Title, Text, Tabs, Table, Badge, ScrollArea, Group, Stack, Card, Image } from "@mantine/core";
import { FileText, ImageIcon, Calendar, Mail, Info, Settings, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { QuoteRequest, AIImageGeneration } from "@shared/schema";
import { format, isSameDay } from "date-fns";

export default function Dashboard() {
    const { data: quoteRequests, isLoading: loadingQuotes } = useQuery<QuoteRequest[]>({
        queryKey: ["/api/quote-requests"],
    });

    const { data: aiGenerations, isLoading: loadingAI } = useQuery<AIImageGeneration[]>({
        queryKey: ["/api/ai-generations"],
    });

    const { data: tools, isLoading: loadingTools } = useQuery<any[]>({
        queryKey: ["/api/tools"],
    });

    const todayQuotes = useMemo(() => {
        if (!quoteRequests) return [];
        const today = new Date();
        return quoteRequests.filter(quote => isSameDay(new Date(quote.createdAt), today));
    }, [quoteRequests]);

    useEffect(() => {
        document.title = "CMS Dashboard - VectorWiz";
    }, []);

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="mb-6">
                    <Title order={2} className="text-2xl font-bold text-gray-900">Dashboard Overview</Title>
                    <Text c="dimmed" size="sm" mt={4}>Welcome back to the VectorWiz administrative panel.</Text>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Paper withBorder shadow="sm" p="lg" radius="md" className="bg-white/80 backdrop-blur-sm border-l-4 border-blue-500">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Total Quotes</Text>
                                <Text size="2xl" fw={800} className="text-blue-600">{quoteRequests?.length || 0}</Text>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <FileText size={24} />
                            </div>
                        </Group>
                    </Paper>
                    <Paper withBorder shadow="sm" p="lg" radius="md" className="bg-white/80 backdrop-blur-sm border-l-4 border-green-500">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Today's Quotes</Text>
                                <Text size="2xl" fw={800} className="text-green-600">{todayQuotes.length}</Text>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                <Clock size={24} />
                            </div>
                        </Group>
                    </Paper>
                    <Paper withBorder shadow="sm" p="lg" radius="md" className="bg-white/80 backdrop-blur-sm border-l-4 border-purple-500">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Total Tools</Text>
                                <Text size="2xl" fw={800} className="text-purple-600">{tools?.length || 0}</Text>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                <Settings size={24} />
                            </div>
                        </Group>
                    </Paper>
                </div>

                <Paper withBorder shadow="md" p="xl" radius="lg" className="bg-white/90 backdrop-blur-md">
                    <Tabs defaultValue="quotes" color="green">
                        <Tabs.List mb="xl">
                            <Tabs.Tab
                                value="quotes"
                                leftSection={<FileText size={18} />}
                                className="px-6 py-3 font-semibold"
                            >
                                Today's Requests
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="ai"
                                leftSection={<ImageIcon size={18} />}
                                className="px-6 py-3 font-semibold"
                            >
                                AI Image Gallery
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="quotes">
                            {loadingQuotes ? (
                                <Text ta="center" py="xl">Loading requests...</Text>
                            ) : (
                                <ScrollArea h={600} offsetScrollbars>
                                    <Table verticalSpacing="md" highlightOnHover striped>
                                        <Table.Thead className="bg-gray-50">
                                            <Table.Tr>
                                                <Table.Th>Time</Table.Th>
                                                <Table.Th>Client Information</Table.Th>
                                                <Table.Th>Project Scope</Table.Th>
                                                <Table.Th>Timeline</Table.Th>
                                                <Table.Th>Description</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {todayQuotes.map((quote) => (
                                                <Table.Tr key={quote.id}>
                                                    <Table.Td>
                                                        <Stack gap={2}>
                                                            <Text size="sm" fw={600}>{format(new Date(quote.createdAt), "h:mm a")}</Text>
                                                            <Text size="xs" c="dimmed">Today</Text>
                                                        </Stack>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Stack gap={2}>
                                                            <Text size="sm" fw={600}>{quote.firstName} {quote.lastName}</Text>
                                                            <Group gap={4}>
                                                                <Mail size={12} className="text-blue-500" />
                                                                <Text size="xs" c="dimmed">{quote.email}</Text>
                                                            </Group>
                                                        </Stack>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge variant="light" color="blue" radius="sm">
                                                            {quote.numberOfFiles || "1"} Files
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge variant="filled" color={quote.turnaroundTime?.includes('Rush') ? 'red' : 'green'} radius="sm">
                                                            {quote.turnaroundTime || "Regular"}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Group gap="xs" wrap="nowrap">
                                                            <Info size={14} className="text-gray-400 shrink-0" />
                                                            <Text size="xs" lineClamp={2} style={{ maxWidth: 300 }}>
                                                                {quote.projectDetails}
                                                            </Text>
                                                        </Group>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                            {quoteRequests?.length === 0 && (
                                                <Table.Tr>
                                                    <Table.Td colSpan={5}>
                                                        <div className="py-20 text-center">
                                                            <FileText size={48} className="mx-auto mb-4 text-gray-200" />
                                                            <Text size="lg" fw={600} c="dimmed">No quote requests submitted yet</Text>
                                                            <Text size="sm" c="dimmed">New requests from the website will appear here in real-time.</Text>
                                                        </div>
                                                    </Table.Td>
                                                </Table.Tr>
                                            )}
                                        </Table.Tbody>
                                    </Table>
                                </ScrollArea>
                            )}
                        </Tabs.Panel>

                        <Tabs.Panel value="ai">
                            {loadingAI ? (
                                <Text ta="center" py="xl">Loading gallery...</Text>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {aiGenerations?.map((gen) => (
                                        <Card key={gen.id} withBorder shadow="sm" radius="lg" p="0" className="overflow-hidden group hover:border-green-400 transition-colors">
                                            <Card.Section className="relative overflow-hidden">
                                                <Image
                                                    src={gen.imageUrl}
                                                    height={240}
                                                    alt={gen.prompt}
                                                    className="group-hover:scale-110 transition-transform duration-500"
                                                    fallbackSrc="https://placehold.co/600x400?text=AI+Generated+Image"
                                                />
                                                <div className="absolute top-2 right-2 flex gap-2">
                                                    <Badge size="xs" color="dark" className="backdrop-blur-md bg-black/50 border-none">
                                                        {gen.model}
                                                    </Badge>
                                                </div>
                                            </Card.Section>

                                            <Stack gap="xs" p="md">
                                                <Group justify="space-between" wrap="nowrap">
                                                    <Text size="xs" c="dimmed" className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {format(new Date(gen.createdAt), "MMM d, h:mm a")}
                                                    </Text>
                                                    <Badge size="xs" color="green" variant="light">{gen.provider}</Badge>
                                                </Group>
                                                <Text size="sm" fw={600} lineClamp={2} className="min-h-[2.5rem]">
                                                    {gen.prompt}
                                                </Text>
                                                <Group gap={6}>
                                                    <Badge size="xs" color="gray" variant="outline">{gen.size}</Badge>
                                                    {gen.quality && <Badge size="xs" color="blue" variant="outline">{gen.quality}</Badge>}
                                                </Group>
                                            </Stack>
                                        </Card>
                                    ))}
                                    {aiGenerations?.length === 0 && (
                                        <div className="col-span-full py-20 text-center">
                                            <ImageIcon size={48} className="mx-auto mb-4 text-gray-200" />
                                            <Text size="lg" fw={600} c="dimmed">The gallery is currently empty</Text>
                                            <Text size="sm" c="dimmed">Images generated via the AI tool will be archived here.</Text>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Tabs.Panel>
                    </Tabs>
                </Paper>
            </div>
        </AdminLayout>
    );
}
