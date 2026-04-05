import { useEffect, useRef } from "react";
import { socket } from "@/lib/socket";

export function useWebSocket(event: string, callback: (data: any) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (data: any) => callbackRef.current(data);
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event]);
}