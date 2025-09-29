import { createContext, useContext, useEffect, useRef, useState } from "react";

interface WebSocketContextType {
  subscribe: (orderId: string) => void;
  unsubscribe: (orderId: string) => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const subscriptions = useRef<Set<string>>(new Set());

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          setIsConnected(true);
          // Re-subscribe to any existing subscriptions
          subscriptions.current.forEach((orderId) => {
            ws.current?.send(JSON.stringify({ type: 'subscribe', orderId }));
          });
        };

        ws.current.onclose = () => {
          setIsConnected(false);
          // Attempt to reconnect after 5 seconds if not manually closed
          setTimeout(() => {
            if (ws.current?.readyState === WebSocket.CLOSED) {
              connectWebSocket();
            }
          }, 5000);
        };

        ws.current.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
        setIsConnected(false);
        // Retry connection after delay if failed to create
        setTimeout(() => {
          connectWebSocket();
        }, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const subscribe = (orderId: string) => {
    subscriptions.current.add(orderId);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'subscribe', orderId }));
    }
  };

  const unsubscribe = (orderId: string) => {
    subscriptions.current.delete(orderId);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'unsubscribe', orderId }));
    }
  };

  return (
    <WebSocketContext.Provider value={{ subscribe, unsubscribe, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
