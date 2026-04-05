import { io } from "socket.io-client";
import { BASE_PATH } from "@/lib/queryClient";

const socketPath = (BASE_PATH + "/api/socket.io").replace(/\/\//g, "/");

// Singleton Socket instance
export const socket = io({ 
    path: socketPath,
    autoConnect: true 
});
