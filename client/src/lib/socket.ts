import { io, Socket } from "socket.io-client";
import { BASE_PATH } from "@/lib/queryClient";

const socketPath = (BASE_PATH + "/api/socket.io").replace(/\/\//g, "/");

// Singleton Socket instance with initial token if available
const token = localStorage.getItem("auth-token");
export const socket: Socket = io({ 
    path: socketPath,
    autoConnect: true,
    auth: token ? { token } : undefined
});

/**
 * Updates the socket's authentication token and reconnects.
 * Should be called after successful login.
 */
export const connectWithToken = (token: string) => {
    socket.auth = { token };
    if (!socket.connected) {
        socket.connect();
    } else {
        // Force reconnect to apply new auth data
        socket.disconnect().connect();
    }
};

/**
 * Disconnects the socket.
 * Should be called on logout.
 */
export const disconnectSocket = () => {
    socket.disconnect();
    socket.auth = {};
};
