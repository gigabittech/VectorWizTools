import { useState, useEffect } from "react";
import { socket } from "@/lib/socket";

export interface AppNotification {
    id: string;
    type: 'quote' | string;
    title: string;
    description: string;
    timestamp: Date;
    isRead: boolean;
    path: string;
}

export function useNotifications() {
    const saved = localStorage.getItem("notifications");
    const [notifications, setNotifications] = useState<AppNotification[]>(
        saved ? JSON.parse(saved) : []
    );

    useEffect(() => {
        localStorage.setItem("notifications", JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        const handleNewQuote = (newQuote: any) => {
            setNotifications(prev => [{
                id: newQuote.id || Date.now().toString(),
                type: 'quote',
                title: 'New Quote Request',
                description: `${newQuote.firstName} ${newQuote.lastName} requested a quote.`,
                timestamp: new Date(),
                isRead: false,
                path: '/admin/quotes-data'
            }, ...prev]);
        };

        socket.on("new_quote_request", handleNewQuote);

        return () => {
            socket.off("new_quote_request", handleNewQuote);
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };
    
    const clearNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification
    };
}
