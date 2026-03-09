import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { BASE_PATH } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginRequest } from "@shared/schema";
import {
    Paper,
    TextInput,
    PasswordInput,
    Button,
    Title,
    Text,
    Container,
    Group,
    Stack,
    Loader,
    Image
} from "@mantine/core";
import { ShieldAlert, LogIn, Mail, Lock } from "lucide-react";
import logoImage from "@assets/VectorWiz-logo_1760804742760.png";
import { useEffect } from "react";

export default function LoginPage() {
    const { user, loginMutation, isLoading } = useAuth();
    const [, setLocation] = useLocation();

    const form = useForm<LoginRequest>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    useEffect(() => {
        if (user) {
            setLocation("/tools/admin/dashboard");
        }
    }, [user, setLocation]);

    const onSubmit = (data: LoginRequest) => {
        loginMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#f8fafc]">
                <Loader color="green" size="xl" type="bars" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
            <Container size={420} my={40}>
                <Stack align="center" mb={30}>
                    <img src={logoImage} alt="VectorWiz" className="h-12 mb-4" />
                    <Title order={1} className="text-2xl font-bold text-gray-900">Admin Control Panel</Title>
                    <Text c="dimmed" size="sm" ta="center">
                        Authorized access only. Please sign in to manage VectorWiz tools and requests.
                    </Text>
                </Stack>

                <Paper withBorder shadow="xl" p={30} radius="lg" className="bg-white">
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <Stack>
                            <TextInput
                                label="Username"
                                placeholder="Enter your administrative username"
                                required
                                leftSection={<Mail size={16} className="text-gray-400" />}
                                {...form.register("username")}
                                error={form.formState.errors.username?.message}
                                disabled={loginMutation.isPending}
                                size="md"
                            />

                            <PasswordInput
                                label="Password"
                                placeholder="Type your password"
                                required
                                leftSection={<Lock size={16} className="text-gray-400" />}
                                {...form.register("password")}
                                error={form.formState.errors.password?.message}
                                disabled={loginMutation.isPending}
                                size="md"
                            />

                            <Group justify="space-between" mt="lg">
                                <Text size="xs" c="dimmed" className="flex items-center gap-1">
                                    <ShieldAlert size={12} />
                                    Protected by 256-bit encryption
                                </Text>
                            </Group>

                            <Button
                                fullWidth
                                mt="xl"
                                type="submit"
                                size="md"
                                className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 transition-all font-bold shadow-lg shadow-[#0B9F47]/20"
                                leftSection={loginMutation.isPending ? <Loader size={18} color="white" /> : <LogIn size={18} />}
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending ? "Authenticating..." : "Sign In to CMS"}
                            </Button>
                        </Stack>
                    </form>
                </Paper>
            </Container>
        </div>
    );
}
