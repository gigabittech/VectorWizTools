import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { 
  Paper, Title, Text, TextInput, Button, Group, Stack, 
  PasswordInput, Divider, Loader, Code, ThemeIcon, Tabs,
  Table, ActionIcon, Modal, Select, Badge, ScrollArea
} from "@mantine/core";
import { User, Mail, Shield, Save, CheckCircle2, Users, Edit, Trash2, Plus, Settings as SettingsIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User as UserType } from "@shared/schema";
import { format } from "date-fns";

export default function Settings() {
  const { toast } = useToast();
  
  const { data: user, isLoading: loadingAuth } = useQuery<UserType>({
    queryKey: ["/api/auth/me"],
  });

  const { data: users, isLoading: loadingUsers } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: !!user && user.role === "admin",
  });

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    oldPassword: "",
    password: "",
    confirmPassword: ""
  });

  const [userModalOpened, setUserModalOpened] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [manageUserData, setManageUserData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "admin"
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || "",
        name: user.name || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", "/api/auth/me", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setFormData(prev => ({ ...prev, oldPassword: "", password: "", confirmPassword: "" }));
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const saveUserMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditingUser && selectedUser) {
        return await apiRequest("PATCH", `/api/users/${selectedUser.id}`, data);
      } else {
        return await apiRequest("POST", `/api/users`, data);
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setUserModalOpened(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      toast({ title: "User Deleted", description: "The user has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeleteModalOpened(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both password fields are identical.",
        variant: "destructive"
      });
      return;
    }

    const payload: any = {
      username: formData.username,
      name: formData.name,
      email: formData.email
    };

    if (formData.password) {
      if (!formData.oldPassword) {
        toast({
          title: "Current password required",
          description: "You must enter your current password to change it.",
          variant: "destructive"
        });
        return;
      }
      payload.oldPassword = formData.oldPassword;
      payload.password = formData.password;
    }

    updateProfileMutation.mutate(payload);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleManageUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingUser && !manageUserData.password) {
      toast({ title: "Password Required", description: "A password is required for new users.", variant: "destructive" });
      return;
    }
    
    if (!manageUserData.username) {
       toast({ title: "Username Required", description: "A username is required.", variant: "destructive" });
       return;
    }

    const payload: any = {
      username: manageUserData.username,
      name: manageUserData.name,
      email: manageUserData.email,
      role: manageUserData.role
    };

    if (manageUserData.password) {
      payload.password = manageUserData.password;
    }

    saveUserMutation.mutate(payload);
  };

  const handleManageUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManageUserData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openAddUser = () => {
    setIsEditingUser(false);
    setSelectedUser(null);
    setManageUserData({ username: "", name: "", email: "", password: "", role: "admin" });
    setUserModalOpened(true);
  };

  const openEditUser = (u: UserType) => {
    setIsEditingUser(true);
    setSelectedUser(u);
    setManageUserData({ 
      username: u.username, 
      name: u.name || "", 
      email: u.email || "", 
      password: "", 
      role: u.role 
    });
    setUserModalOpened(true);
  };

  const confirmDeleteUser = (u: UserType) => {
    setSelectedUser(u);
    setDeleteModalOpened(true);
  };

  if (loadingAuth) {
    return (
      <AdminLayout>
        <div className="flex h-[400px] items-center justify-center">
          <Loader color="green" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Title order={2} className="text-2xl font-bold text-gray-900">User Management</Title>
          <Text c="dimmed" size="sm" mt={4}>Manage your profile information and system users.</Text>
        </div>

        <Paper withBorder shadow="sm" radius="lg" p={0} className="bg-white overflow-hidden">
          <Tabs defaultValue="profile" color="blue" variant="outline" classNames={{ panel: 'p-6' }}>
            <Tabs.List className="px-4 pt-4 bg-gray-50/50">
              <Tabs.Tab value="profile" leftSection={<User size={16} />} className="font-medium">
                My Profile
              </Tabs.Tab>
              {user?.role === "admin" && (
                <Tabs.Tab value="users" leftSection={<Users size={16} />} className="font-medium">
                  System Users
                </Tabs.Tab>
              )}
            </Tabs.List>

            <Tabs.Panel value="profile">
              <form onSubmit={handleProfileSubmit}>
                <Stack gap="xl">
                  {/* Profile Section */}
                  <div>
                    <Group mb="md">
                      <ThemeIcon variant="light" color="blue" size="md" radius="md">
                        <User size={18} />
                      </ThemeIcon>
                      <Title order={4}>Profile Details</Title>
                    </Group>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-10">
                      <TextInput
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleProfileChange}
                        required
                        placeholder="admin"
                      />
                      <TextInput
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleProfileChange}
                        placeholder="John Doe"
                      />
                      <TextInput
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleProfileChange}
                        placeholder="admin@example.com"
                        leftSection={<Mail size={16} className="text-gray-400" />}
                        className="md:col-span-2"
                      />
                    </div>
                  </div>

                  <Divider />

                  {/* Security Section */}
                  <div>
                    <Group mb="md" justify="space-between">
                      <Group>
                        <ThemeIcon variant="light" color="red" size="md" radius="md">
                          <Shield size={18} />
                        </ThemeIcon>
                        <Title order={4}>Security</Title>
                      </Group>
                      <Text size="xs" c="dimmed" fs="italic">Leave blank to keep your current password</Text>
                    </Group>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-10">
                      <PasswordInput
                        label="Current Password"
                        name="oldPassword"
                        value={formData.oldPassword}
                        onChange={handleProfileChange}
                        placeholder="••••••••"
                      />
                      <PasswordInput
                        label="New Password"
                        name="password"
                        value={formData.password}
                        onChange={handleProfileChange}
                        placeholder="••••••••"
                      />
                      <PasswordInput
                        label="Confirm New Password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleProfileChange}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Roles Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mt-4 border border-gray-100 flex items-start gap-4">
                    <CheckCircle2 className="text-green-500 mt-1 shrink-0" size={20} />
                    <div>
                      <Text fw={600} size="sm">Current Role</Text>
                      <Group gap="xs" mt={4}>
                        <Code color="blue" fw={700} className="uppercase">{user?.role}</Code>
                        <Text size="xs" c="dimmed">You have {user?.role === 'admin' ? 'full administrative' : 'limited'} privileges.</Text>
                      </Group>
                    </div>
                  </div>

                  {/* Actions */}
                  <Group justify="flex-end" mt="md">
                    <Button 
                      type="submit" 
                      color="green" 
                      leftSection={<Save size={18} />}
                      loading={updateProfileMutation.isPending}
                    >
                      Save Changes
                    </Button>
                  </Group>

                </Stack>
              </form>
            </Tabs.Panel>

            <Tabs.Panel value="users">
              {loadingUsers ? (
                <div className="py-20 text-center"><Loader color="blue" /></div>
              ) : (
                <Stack gap="lg">
                  <Group justify="space-between">
                    <div>
                      <Title order={4}>Directory</Title>
                      <Text size="sm" c="dimmed">Manage all registered users and their permissions.</Text>
                    </div>
                    <Button leftSection={<Plus size={16} />} color="blue" onClick={openAddUser}>
                      Add New User
                    </Button>
                  </Group>

                  <ScrollArea>
                    <Table verticalSpacing="md" highlightOnHover striped>
                      <Table.Thead className="bg-gray-50/50">
                        <Table.Tr>
                          <Table.Th>Name</Table.Th>
                          <Table.Th>Username</Table.Th>
                          <Table.Th>Role</Table.Th>
                          <Table.Th>Joined Date</Table.Th>
                          <Table.Th ta="right">Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {users?.map(u => (
                          <Table.Tr key={u.id}>
                            <Table.Td>
                              <Group gap="sm">
                                <ThemeIcon variant="light" radius="xl" color="blue" size="md">
                                  {u.name?.charAt(0).toUpperCase() || u.username.charAt(0).toUpperCase()}
                                </ThemeIcon>
                                <div>
                                  <Text size="sm" fw={500}>{u.name || 'N/A'}</Text>
                                  <Text size="xs" c="dimmed">{u.email || 'No email'}</Text>
                                </div>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Code>{u.username}</Code>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={u.role === 'admin' ? 'blue' : 'gray'} variant="light">
                                {u.role.toUpperCase()}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{format(new Date(u.createdAt), "MMM d, yyyy")}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs" justify="flex-end">
                                <ActionIcon variant="light" color="green" onClick={() => openEditUser(u)}>
                                  <Edit size={16} />
                                </ActionIcon>
                                <ActionIcon 
                                  variant="light" 
                                  color="red" 
                                  onClick={() => confirmDeleteUser(u)}
                                  disabled={u.id === user?.id} // Prevent self deletion mechanically
                                >
                                  <Trash2 size={16} />
                                </ActionIcon>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Stack>
              )}
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </div>

      {/* User Management Modal */}
      <Modal
        opened={userModalOpened}
        onClose={() => setUserModalOpened(false)}
        title={<Title order={4}>{isEditingUser ? "Edit User" : "Add New User"}</Title>}
        size="md"
        radius="lg"
        centered
        padding="xl"
      >
        <form onSubmit={handleManageUserSubmit}>
          <Stack gap="md">
            <TextInput
              label="Username"
              name="username"
              value={manageUserData.username}
              onChange={handleManageUserChange}
              required
              disabled={isEditingUser} // Often usernames are immutable, but at least visually indicate it
            />
            <TextInput
              label="Full Name"
              name="name"
              value={manageUserData.name}
              onChange={handleManageUserChange}
            />
            <TextInput
              label="Email Address"
              name="email"
              type="email"
              value={manageUserData.email}
              onChange={handleManageUserChange}
            />
            <PasswordInput
              label={isEditingUser ? "New Password (Optional)" : "Password"}
              name="password"
              value={manageUserData.password}
              onChange={handleManageUserChange}
              required={!isEditingUser}
            />
            <Select
              label="Role"
              name="role"
              value={manageUserData.role}
              onChange={(val) => setManageUserData(prev => ({ ...prev, role: val || "admin" }))}
              data={[
                { value: "admin", label: "Admin" },
                { value: "seo", label: "SEO Analyst" },
                { value: "writer", label: "Writer" }
              ]}
              required
            />
            <Button type="submit" color="blue" fullWidth mt="md" loading={saveUserMutation.isPending}>
              {isEditingUser ? "Update User" : "Create User"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
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
          <Text fw={700} size="lg">Delete User account?</Text>
          <Text size="sm" c="dimmed" mt={4}>
            Are you sure you want to delete <Code>{selectedUser?.username}</Code>? This action cannot be undone.
          </Text>
        </div>
        <Group justify="flex-end" mt="xl">
          <Button variant="outline" onClick={() => setDeleteModalOpened(false)}>Cancel</Button>
          <Button color="red" onClick={() => {
            if (selectedUser?.id) deleteUserMutation.mutate(selectedUser.id);
          }} loading={deleteUserMutation.isPending}>
            Delete Permanently
          </Button>
        </Group>
      </Modal>
    </AdminLayout>
  );
}
