import { QueryClient, QueryFunction } from "@tanstack/react-query";

// When deployed at a subpath (e.g., abc.com/tools), BASE_PATH = "/tools"
// so all /api calls are correctly sent to abc.com/tools/api/...
const getBasePath = (): string => {
  // 1. Build-time constant from VITE_BASE_PATH (Standard practice)
  const buildTimePath = (import.meta.env.VITE_BASE_PATH || "").replace(/\/$/, "");
  
  if (buildTimePath && buildTimePath !== "/" && buildTimePath !== "") {
    return buildTimePath;
  }

  // 2. Fallback to runtime detection: check if we're in a known subdirectory
  // We only treat the first segment as a base path if it's "tools" or similar expected prefixes
  // to avoid misidentifying SPA routes (like /dashboard) as base paths.
  const currentPath = window.location.pathname;
  const segments = currentPath.split('/').filter(Boolean);
  const firstSegment = segments[0]; 

  // List of known/expected deployment base paths
  const KNOWN_BASE_PATHS = ["tools", "vectorwiz"];
  
  if (firstSegment && KNOWN_BASE_PATHS.includes(firstSegment.toLowerCase())) {
    const detectedPath = `/${firstSegment}`;

    if (import.meta.env.DEV) {
      console.log('[BASE_PATH Detected]', { detectedPath });
    }

    return detectedPath;
  }

  return "";
};

export const BASE_PATH = getBasePath();

// Log in production for debugging
console.log('[BASE_PATH]', BASE_PATH, 'from window.location.pathname =', window.location.pathname);

function prefixUrl(url: string): string {
  if (BASE_PATH && url.startsWith("/api")) {
    return `${BASE_PATH}${url}`;
  }
  return url;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const text = await res.text();
      if (text) {
        // Try to parse as JSON
        try {
          const json = JSON.parse(text);
          if (json.error) {
            errorMessage = json.error;
          } else {
            errorMessage = text;
          }
        } catch {
          // If not JSON, use the text as is
          errorMessage = text;
        }
      }
    } catch {
      // If reading fails, use status text
      errorMessage = res.statusText;
    }

    const error: any = new Error(errorMessage);
    error.status = res.status;
    error.response = errorMessage;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("auth-token");
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(prefixUrl(url), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const urlStr = queryKey.join("/") as string;
      const token = localStorage.getItem("auth-token");
      const headers: Record<string, string> = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(prefixUrl(urlStr), {
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
