import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginRequest } from "@shared/schema";
import {
    TextInput,
    PasswordInput,
    Button,
    Title,
    Stack,
    Loader,
    Anchor,
    Paper,
    Center,
    Box,
    Container
} from "@mantine/core";
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
            setLocation("/admin/dashboard");
        }
    }, [user, setLocation]);

    const onSubmit = (data: LoginRequest) => {
        loginMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <Center h="100vh" bg="#f8fafc">
                <Loader color="#0B9F47" size="xl" type="bars" />
            </Center>
        );
    }

    return (
        <Box className="min-h-screen flex flex-col md:flex-row bg-[#f1f5f9] overflow-hidden">
            {/* Left Section (Login Panel) */}
            <Box className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 lg:p-12 relative">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-100 rounded-full blur-[100px]"></div>
                </div>

                <Paper shadow="xl" radius="lg" p={45} className="w-full max-w-md border border-gray-100 relative z-10 bg-white">
                    <Stack gap={32} align="center">
                        {/* Logo Container with subtle background to handle white-on-white issues */}
                        <Box className="p-4 rounded-xl bg-gradient-to-r from-[#06183C] to-[#20448B] flex justify-center items-center w-full max-w-[200px]">
                            <img src={logoImage} alt="VectorWiz" className="h-9 w-auto object-contain" />
                        </Box>

                        <div className="text-center w-full">
                            <Title order={1} className="text-2xl font-bold text-gray-900 border-b-2 border-green-500 pb-4 inline-block px-4">
                                Welcome to Login Panel
                            </Title>
                        </div>

                        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                            <Stack gap="xl">
                                <TextInput
                                    label="Username or Email"
                                    placeholder="Enter your username or email..."
                                    required
                                    {...form.register("username")}
                                    error={form.formState.errors.username?.message}
                                    disabled={loginMutation.isPending}
                                    size="md"
                                    radius="md"
                                    styles={{
                                        input: {
                                            height: '52px',
                                            fontSize: '15px',
                                            borderColor: '#e2e8f0',
                                            '&:focus': { borderColor: '#0B9F47', boxShadow: '0 0 0 1px #0B9F47' }
                                        },
                                        label: { marginBottom: '8px', fontWeight: 600, color: '#475569' }
                                    }}
                                />

                                <Stack gap={10}>
                                    <PasswordInput
                                        label="Password"
                                        placeholder="Enter your password"
                                        required
                                        {...form.register("password")}
                                        error={form.formState.errors.password?.message}
                                        disabled={loginMutation.isPending}
                                        size="md"
                                        radius="md"
                                        styles={{
                                            input: {
                                                height: '52px',
                                                fontSize: '15px',
                                                borderColor: '#e2e8f0',
                                                '&:focus': { borderColor: '#0B9F47', boxShadow: '0 0 0 1px #0B9F47' }
                                            },
                                            label: { marginBottom: '8px', fontWeight: 600, color: '#475569' }
                                        }}
                                    />
                                    {/* <Box className="flex justify-between items-center px-1">
                                        <Anchor href="#" size="sm" className="text-[#0B9F47] font-semibold hover:text-[#098a3e] no-underline hover:underline">
                                            Forgot Password?
                                        </Anchor>
                                    </Box> */}
                                </Stack>

                                <Button
                                    fullWidth
                                    type="submit"
                                    size="lg"
                                    radius="md"
                                    className="h-14 bg-[#0B9F47] hover:bg-[#098a3e] transition-all font-bold shadow-lg shadow-green-100 mt-2 text-white active:scale-[0.98]"
                                    loading={loginMutation.isPending}
                                    disabled={loginMutation.isPending}
                                >
                                    {loginMutation.isPending ? "Logging in..." : "Login"}
                                </Button>
                            </Stack>
                        </form>
                    </Stack>
                </Paper>
            </Box>

            {/* Right Section (Branding Area) */}
            <Box className="hidden md:flex md:w-1/2 bg-[#0B9F47] relative items-center justify-center p-12 overflow-hidden shadow-inner">
                {/* Visual Enhancements: Patterns & Gradients */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-white/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-black/5 rounded-full blur-[100px]"></div>

                <Box className="max-w-md w-full relative z-10 flex flex-col items-center">
                    <Box className="p-16 rounded-xl bg-gradient-to-r from-[#06183C] to-[#20448B] flex justify-center items-center w-full max-w-[400px]">
                        <img src={logoImage} alt="VectorWiz" className="h-9 w-auto object-contain" />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
