import AdminLayout from "@/components/layout/AdminLayout";
import {
    Paper, Title, Text, Table, Badge, Group, 
    Tooltip, ActionIcon, Loader, Modal, Stack, ScrollArea,
    Select, TextInput, Box, Pagination, Code
} from "@mantine/core";
import { Search, Filter, Mail, Calendar, CheckCircle, XCircle, Eye, RefreshCcw, AlertTriangle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { EmailLog } from "@shared/schema";

export default function EmailLogs() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>("all");
    const [activePage, setActivePage] = useState(1);
    const [viewingLog, setViewingLog] = useState<EmailLog | null>(null);
    const [viewModalOpened, setViewModalOpened] = useState(false);
    const itemsPerPage = 10;

    const { data: emailLogs = [], isLoading, refetch, isRefetching } = useQuery<EmailLog[]>({
        queryKey: ["/api/email-logs"],
    });

    const filteredLogs = useMemo(() => {
        return emailLogs.filter((log) => {
            const matchesSearch = 
                log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.errorMessage || "").toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === "all" || !statusFilter || log.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [emailLogs, searchTerm, statusFilter]);

    useEffect(() => {
        setActivePage(1);
    }, [searchTerm, statusFilter]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = useMemo(() => {
        const start = (activePage - 1) * itemsPerPage;
        return filteredLogs.slice(start, start + itemsPerPage);
    }, [filteredLogs, activePage]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sent': return 'green';
            case 'failed': return 'red';
            default: return 'gray';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent': return <CheckCircle size={14} />;
            case 'failed': return <XCircle size={14} />;
            default: return null;
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Title order={2} className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                           <Mail className="text-[#0B9F47]" /> Email Delivery Logs
                        </Title>
                        <Text c="dimmed" size="sm" mt={4}>Track and debug all automated email notifications and test messages.</Text>
                    </div>
                    <Tooltip label="Refresh Logs">
                        <ActionIcon 
                            onClick={() => refetch()} 
                            loading={isRefetching}
                            variant="light" 
                            color="green" 
                            size="xl" 
                            radius="md"
                        >
                            <RefreshCcw size={20} />
                        </ActionIcon>
                    </Tooltip>
                </div>

                <Paper withBorder shadow="sm" radius="lg" p="xl" className="bg-white/80 backdrop-blur-sm">
                    <Group justify="space-between" mb="xl">
                        <Group grow className="w-full md:w-auto">
                            <TextInput
                                placeholder="Search by recipient or subject..."
                                leftSection={<Search size={16} className="text-gray-400" />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                                className="w-full md:w-80"
                                radius="md"
                            />
                            <Select
                                placeholder="Status"
                                leftSection={<Filter size={16} className="text-gray-400" />}
                                data={[
                                    { value: "all", label: "All Statuses" },
                                    { value: "sent", label: "Successfully Sent" },
                                    { value: "failed", label: "Delivery Failed" },
                                ]}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                radius="md"
                                w={180}
                            />
                        </Group>
                        <Text size="xs" c="dimmed" fw={500}>
                            Showing {paginatedLogs.length} of {filteredLogs.length} Logs
                        </Text>
                    </Group>

                    {isLoading ? (
                        <div className="py-20 text-center">
                            <Loader color="green" size="lg" />
                            <Text mt="md" c="dimmed">Fetching email history...</Text>
                        </div>
                    ) : (
                        <ScrollArea>
                            <Table verticalSpacing="md" highlightOnHover striped>
                                <Table.Thead className="bg-gray-50/50">
                                    <Table.Tr>
                                        <Table.Th>Timestamp</Table.Th>
                                        <Table.Th>Recipient</Table.Th>
                                        <Table.Th>Subject</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th ta="right">Details</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {paginatedLogs.map((log) => (
                                        <Table.Tr key={log.id}>
                                            <Table.Td>
                                                <Stack gap={0}>
                                                    <Text size="sm" fw={600}>{format(new Date(log.createdAt), "MMM d, yyyy")}</Text>
                                                    <Text size="xs" c="dimmed">{format(new Date(log.createdAt), "h:mm:ss a")}</Text>
                                                </Stack>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Mail size={14} className="text-gray-400" />
                                                    <Text size="sm" fw={500}>{log.recipient}</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" lineClamp={1} style={{ maxWidth: 300 }}>{log.subject}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge 
                                                    variant="light" 
                                                    color={getStatusColor(log.status)} 
                                                    leftSection={getStatusIcon(log.status)}
                                                    size="md"
                                                    radius="sm"
                                                >
                                                    {log.status.toUpperCase()}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs" justify="flex-end">
                                                    {log.status === 'failed' && (
                                                        <Tooltip label="View Error Details">
                                                            <ActionIcon 
                                                                variant="light" 
                                                                color="red" 
                                                                radius="md" 
                                                                onClick={() => {
                                                                    setViewingLog(log);
                                                                    setViewModalOpened(true);
                                                                }}
                                                            >
                                                                <AlertTriangle size={18} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip label="View Context">
                                                        <ActionIcon 
                                                            variant="light" 
                                                            color="blue" 
                                                            radius="md"
                                                            onClick={() => {
                                                                setViewingLog(log);
                                                                setViewModalOpened(true);
                                                            }}
                                                        >
                                                            <Eye size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                    {filteredLogs.length === 0 && (
                                        <Table.Tr>
                                            <Table.Td colSpan={5}>
                                                <div className="py-20 text-center">
                                                    <Mail size={48} className="mx-auto mb-4 text-gray-200" />
                                                    <Text size="lg" fw={600} c="dimmed">No email logs found</Text>
                                                    <Text size="sm" c="dimmed">Any emails sent via the system will appear here.</Text>
                                                </div>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    )}

                    {filteredLogs.length > 0 && (
                        <Group justify="center" mt="xl" py="md">
                            <Pagination 
                                total={totalPages} 
                                value={activePage} 
                                onChange={setActivePage} 
                                color="green"
                                radius="md"
                            />
                        </Group>
                    )}
                </Paper>
            </div>

            <Modal
                opened={viewModalOpened}
                onClose={() => setViewModalOpened(false)}
                title={<Title order={4} className="flex items-center gap-2"><Mail size={20} className="text-[#0B9F47]" /> Email Log Details</Title>}
                size="lg"
                radius="lg"
                centered
            >
                {viewingLog && (
                    <Stack gap="md">
                        <Stack gap={4}>
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase">Recipient</Text>
                            <Text fw={600}>{viewingLog.recipient}</Text>
                        </Stack>
                        
                        <Stack gap={4}>
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase">Subject</Text>
                            <Text fw={600}>{viewingLog.subject}</Text>
                        </Stack>

                        <Stack gap={4}>
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase">Status</Text>
                            <Badge color={getStatusColor(viewingLog.status)} variant="filled">
                                {viewingLog.status.toUpperCase()}
                            </Badge>
                        </Stack>

                        <Stack gap={4}>
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase">Sent At</Text>
                            <Text size="sm">{format(new Date(viewingLog.createdAt), "MMMM d, yyyy 'at' h:mm:ss a")}</Text>
                        </Stack>

                        {viewingLog.errorMessage && (
                            <Stack gap={4}>
                                <Text size="xs" fw={700} c="red" tt="uppercase">Error Message</Text>
                                <Paper withBorder p="xs" className="bg-red-50 border-red-100">
                                    <Code bg="transparent" color="red" block>
                                        {viewingLog.errorMessage}
                                    </Code>
                                </Paper>
                            </Stack>
                        )}
                    </Stack>
                )}
            </Modal>
        </AdminLayout>
    );
}
