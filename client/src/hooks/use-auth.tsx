import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, LoginRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
    loginMutation: any;
    logoutMutation: any;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const {
        data: user,
        error,
        isLoading,
    } = useQuery<User | null, Error>({
        queryKey: ["/tools/api/auth/me"],
        queryFn: async () => {
            try {
                const res = await fetch("/tools/api/auth/me");
                if (res.status === 401) return null;
                if (!res.ok) throw new Error("Could not fetch user");
                return await res.json();
            } catch (err) {
                return null;
            }
        },
        retry: false,
    });

    const loginMutation = useMutation({
        mutationFn: async (credentials: LoginRequest) => {
            const res = await apiRequest("POST", "/tools/api/auth/login", credentials);
            return await res.json();
        },
        onSuccess: (data: any) => {
            queryClient.setQueryData(["/tools/api/auth/me"], data.user);
            toast({
                title: "Login successful",
                description: `Welcome back, ${data.user.username}!`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Login failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/tools/api/auth/logout");
        },
        onSuccess: () => {
            queryClient.setQueryData(["/tools/api/auth/me"], null);
            toast({
                title: "Logged out",
                description: "You have been logged out successfully.",
            });
        },
    });

    return (
        <AuthContext.Provider
            value={{
                user: user ?? null,
                isLoading,
                error,
                loginMutation,
                logoutMutation,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
