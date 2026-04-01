import AdminLayout from "@/components/layout/AdminLayout";
import {
    Paper, Title, Text, Table, Badge, Group, Button, 
    Tooltip, ActionIcon, Loader, Modal, Stack, ScrollArea,
    Select, TextInput, Divider, Box, Card, Pagination
} from "@mantine/core";
import { Eye, Trash2, Search, Filter, Mail, Calendar, User, FileText, CheckCircle, Clock, AlertCircle, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { QuoteRequest } from "@shared/schema";

export default function QuotesData() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>("all");
    
    const [viewingQuote, setViewingQuote] = useState<QuoteRequest | null>(null);
    const [viewModalOpened, setViewModalOpened] = useState(false);
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
    const [activePage, setActivePage] = useState(1);
    const itemsPerPage = 10;

    const { data: quoteRequests = [], isLoading } = useQuery<QuoteRequest[]>({
        queryKey: ["/api/quote-requests"],
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            return await apiRequest("PATCH", `/api/quote-requests/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/quote-requests"] });
            toast({ title: "Status Updated", description: "Quote request status has been updated successfully." });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
        }
    });

    const deleteQuoteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await apiRequest("DELETE", `/api/quote-requests/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/quote-requests"] });
            toast({ title: "Quote Deleted", description: "The quote request has been removed." });
            setDeleteModalOpened(false);
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message || "Failed to delete quote", variant: "destructive" });
        }
    });

    const filteredQuotes = useMemo(() => {
        return quoteRequests.filter((quote) => {
            const matchesSearch = 
                `${quote.firstName} ${quote.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                quote.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                quote.projectDetails.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === "all" || !statusFilter || quote.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [quoteRequests, searchTerm, statusFilter]);

    // Reset page when search or filters change
    useEffect(() => {
        setActivePage(1);
    }, [searchTerm, statusFilter]);

    const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
    const paginatedQuotes = useMemo(() => {
        const start = (activePage - 1) * itemsPerPage;
        return filteredQuotes.slice(start, start + itemsPerPage);
    }, [filteredQuotes, activePage]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'yellow';
            case 'in_progress': return 'blue';
            case 'completed': return 'green';
            case 'cancelled': return 'red';
            default: return 'gray';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock size={14} />;
            case 'in_progress': return <AlertCircle size={14} />;
            case 'completed': return <CheckCircle size={14} />;
            case 'cancelled': return <X size={14} />;
            default: return null;
        }
    };

    const handleViewDetails = (quote: QuoteRequest) => {
        setViewingQuote(quote);
        setViewModalOpened(true);
    };

    const handleDeleteClick = (id: string) => {
        setQuoteToDelete(id);
        setDeleteModalOpened(true);
    };

    const confirmDelete = () => {
        if (quoteToDelete) {
            deleteQuoteMutation.mutate(quoteToDelete);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Title order={2} className="text-2xl font-bold text-gray-900">Quote Management</Title>
                        <Text c="dimmed" size="sm" mt={4}>Review and manage all project quote requests from clients.</Text>
                    </div>
                </div>

                <Paper withBorder shadow="sm" radius="lg" p="xl" className="bg-white/80 backdrop-blur-sm">
                    <Group justify="space-between" mb="xl">
                        <Group grow className="w-full md:w-auto">
                            <TextInput
                                placeholder="Search by name, email, or details..."
                                leftSection={<Search size={16} className="text-gray-400" />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                                className="w-full md:w-80"
                                radius="md"
                            />
                            <Select
                                placeholder="Filter by Status"
                                leftSection={<Filter size={16} className="text-gray-400" />}
                                data={[
                                    { value: "all", label: "All Statuses" },
                                    { value: "pending", label: "Pending" },
                                    { value: "in_progress", label: "In Progress" },
                                    { value: "completed", label: "Completed" },
                                    { value: "cancelled", label: "Cancelled" },
                                ]}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                radius="md"
                                w={180}
                            />
                        </Group>
                        <Text size="xs" c="dimmed" fw={500}>
                            Showing {paginatedQuotes.length} of {filteredQuotes.length} Requests
                        </Text>
                    </Group>

                    {isLoading ? (
                        <div className="py-20 text-center">
                            <Loader color="green" size="lg" />
                            <Text mt="md" c="dimmed">Fetching quote requests...</Text>
                        </div>
                    ) : (
                        <ScrollArea>
                            <Table verticalSpacing="md" highlightOnHover striped>
                                <Table.Thead className="bg-gray-50/50">
                                    <Table.Tr>
                                        <Table.Th>Date</Table.Th>
                                        <Table.Th>Client</Table.Th>
                                        <Table.Th>Project Scope</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th ta="right">Actions</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {paginatedQuotes.map((quote) => (
                                        <Table.Tr key={quote.id}>
                                            <Table.Td>
                                                <Stack gap={0}>
                                                    <Text size="sm" fw={600}>{format(new Date(quote.createdAt), "MMM d, yyyy")}</Text>
                                                    <Text size="xs" c="dimmed">{format(new Date(quote.createdAt), "h:mm a")}</Text>
                                                </Stack>
                                            </Table.Td>
                                            <Table.Td>
                                                <Stack gap={0}>
                                                    <Text size="sm" fw={600}>{quote.firstName} {quote.lastName}</Text>
                                                    <Group gap={4}>
                                                        <Mail size={12} className="text-blue-500" />
                                                        <Text size="xs" c="dimmed">{quote.email}</Text>
                                                    </Group>
                                                </Stack>
                                            </Table.Td>
                                            <Table.Td>
                                                <Stack gap={4}>
                                                    <Group gap="xs">
                                                        <Badge variant="light" color="blue" radius="sm" size="xs">
                                                            {quote.numberOfFiles || "1"} Files
                                                        </Badge>
                                                        <Badge variant="filled" color={quote.turnaroundTime?.includes('Rush') ? 'red' : 'green'} radius="sm" size="xs">
                                                            {quote.turnaroundTime || "Regular"}
                                                        </Badge>
                                                    </Group>
                                                    <Text size="xs" lineClamp={1} c="dimmed" style={{ maxWidth: 250 }}>
                                                        {quote.projectDetails}
                                                    </Text>
                                                </Stack>
                                            </Table.Td>
                                            <Table.Td>
                                                <Select
                                                    size="xs"
                                                    w={130}
                                                    data={[
                                                        { value: "pending", label: "Pending" },
                                                        { value: "in_progress", label: "In Progress" },
                                                        { value: "completed", label: "Completed" },
                                                        { value: "cancelled", label: "Cancelled" },
                                                    ]}
                                                    value={quote.status}
                                                    onChange={(val) => updateStatusMutation.mutate({ id: quote.id, status: val || 'pending' })}
                                                    leftSection={getStatusIcon(quote.status)}
                                                    variant="filled"
                                                    radius="md"
                                                    styles={{
                                                        input: {
                                                            backgroundColor: `var(--mantine-color-${getStatusColor(quote.status)}-1)`,
                                                            color: `var(--mantine-color-${getStatusColor(quote.status)}-9)`,
                                                            fontWeight: 600,
                                                            border: 'none'
                                                        }
                                                    }}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs" justify="flex-end">
                                                    <Tooltip label="View Full Details">
                                                        <ActionIcon variant="light" color="blue" radius="md" size="md" onClick={() => handleViewDetails(quote)}>
                                                            <Eye size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label="Delete Request">
                                                        <ActionIcon variant="light" color="red" radius="md" size="md" onClick={() => handleDeleteClick(quote.id)}>
                                                            <Trash2 size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                    {filteredQuotes.length === 0 && (
                                        <Table.Tr>
                                            <Table.Td colSpan={5}>
                                                <div className="py-20 text-center">
                                                    <FileText size={48} className="mx-auto mb-4 text-gray-200" />
                                                    <Text size="lg" fw={600} c="dimmed">No matching quote requests found</Text>
                                                    <Text size="sm" c="dimmed">Try adjusting your search or filters.</Text>
                                                </div>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    )}

                    {filteredQuotes.length > 0 && (
                        <Group justify="center" mt="xl" py="md">
                            <Pagination 
                                total={totalPages} 
                                value={activePage} 
                                onChange={setActivePage} 
                                color="green"
                                radius="md"
                                withEdges
                            />
                        </Group>
                    )}
                </Paper>
            </div>

            {/* View Details Modal */}
            <Modal
                opened={viewModalOpened}
                onClose={() => setViewModalOpened(false)}
                title={<Title order={4} className="flex items-center gap-2"><FileText size={20} className="text-[#0B9F47]" /> Quote Request Details</Title>}
                size="lg"
                radius="lg"
                centered
                padding="xl"
            >
                {viewingQuote && (
                    <Stack gap="lg">
                        <div className="grid grid-cols-2 gap-4">
                            <Card withBorder radius="md" p="sm">
                                <Group gap="xs" mb={4}>
                                    <User size={14} className="text-gray-400" />
                                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">Client Name</Text>
                                </Group>
                                <Text fw={600}>{viewingQuote.firstName} {viewingQuote.lastName}</Text>
                            </Card>
                            <Card withBorder radius="md" p="sm">
                                <Group gap="xs" mb={4}>
                                    <Mail size={14} className="text-gray-400" />
                                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">Email Address</Text>
                                </Group>
                                <Text fw={600}>{viewingQuote.email}</Text>
                            </Card>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <Card withBorder radius="md" p="sm">
                                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>Files</Text>
                                <Badge color="blue">{viewingQuote.numberOfFiles || "1"} Files</Badge>
                            </Card>
                            <Card withBorder radius="md" p="sm">
                                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>Timeline</Text>
                                <Badge color={viewingQuote.turnaroundTime?.includes('Rush') ? 'red' : 'green'}>
                                    {viewingQuote.turnaroundTime || "Regular"}
                                </Badge>
                            </Card>
                            <Card withBorder radius="md" p="sm">
                                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>Submitted</Text>
                                <Text size="xs" fw={600}>{format(new Date(viewingQuote.createdAt), "MMM d, p")}</Text>
                            </Card>
                        </div>

                        <Card withBorder radius="md" p="md" className="bg-gray-50/50">
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={8}>Project Description</Text>
                            <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {viewingQuote.projectDetails}
                            </Text>
                        </Card>

                        {viewingQuote.fileUrls && viewingQuote.fileUrls.length > 0 && (
                            <Box>
                                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={8}>Attached Files</Text>
                                <Stack gap="xs">
                                    {viewingQuote.fileUrls.map((url, idx) => (
                                        <Button
                                            key={idx}
                                            variant="light"
                                            color="gray"
                                            fullWidth
                                            justify="flex-start"
                                            leftSection={<FileText size={16} />}
                                            component="a"
                                            href={url}
                                            target="_blank"
                                            size="xs"
                                        >
                                            View Attached File {viewingQuote.fileUrls!.length > 1 ? idx + 1 : ''}
                                        </Button>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        <Divider my="sm" />

                        <Group justify="space-between">
                            <Group gap="xs">
                                <Text size="sm" fw={600}>Status:</Text>
                                <Badge
                                    color={getStatusColor(viewingQuote.status)}
                                    variant="filled"
                                    leftSection={getStatusIcon(viewingQuote.status)}
                                >
                                    {viewingQuote.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                            </Group>
                            <Button variant="outline" color="red" leftSection={<Trash2 size={16} />} onClick={() => { setViewModalOpened(false); handleDeleteClick(viewingQuote.id); }}>
                                Delete Request
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpened}
                onClose={() => setDeleteModalOpened(false)}
                title="Confirm Deletion"
                centered
                radius="lg"
                padding="xl"
            >
                <div className="py-4 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
                        <Trash2 size={32} />
                    </div>
                    <Text fw={700} size="lg">Are you sure?</Text>
                    <Text size="sm" c="dimmed" mt={4}>
                        This action cannot be undone. This quote request will be permanently removed from the database.
                    </Text>
                </div>
                <Group justify="flex-end" mt="xl">
                    <Button variant="outline" onClick={() => setDeleteModalOpened(false)}>Cancel</Button>
                    <Button color="red" onClick={confirmDelete} loading={deleteQuoteMutation.isPending}>Delete Permanently</Button>
                </Group>
            </Modal>
        </AdminLayout>
    );
}
