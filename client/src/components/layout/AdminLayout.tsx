import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "@mantine/core";
import {
    LayoutDashboard,
    Settings,
    Menu as MenuIcon,
    X,
    LogOut,
    User,
    Bell,
    Search,
    ChevronRight,
    Loader,
    Globe,
    ArrowRightLeft,
    UserCog,
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import logoImage from "@assets/VectorWiz-logo_1760804742760.png";
import logoIcon from "@assets/VectorWiz_Icon.png";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { user, logoutMutation } = useAuth();
    const [location, setLocation] = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    
    // Abstracted notifications custom hook
    const { 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead 
    } = useNotifications();

    const handleNotificationClick = (notif: AppNotification) => {
        markAsRead(notif.id);
        setLocation(notif.path);
    };
    
    const toggleExpand = (label: string) => {
        setExpandedItems(prev => 
            prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
        );
        if (!isSidebarOpen) {
            setIsSidebarOpen(true);
        }
    };
    
    const navItems = [
        {
            label: "Dashboard",
            href: "/admin/dashboard",
            icon: LayoutDashboard
        },
        {
            label: "Quote Management",
            href: "/admin/quotes-data",
            icon: ArrowRightLeft,
            subItems: [
                {
                    label: "Quote Data",
                    href: "/admin/quotes-data"
                },
                {
                    label: "Embed Form",
                    href: "/admin/embed-form"
                },
                {
                    label: "Email Settings",
                    href: "/admin/email-settings"
                },
                {
                    label: "Email Logs",
                    href: "/admin/email-logs"
                }
            ]
        },
        {
            label: "Tools Management",
            href: "/admin/management",
            icon: Settings
        },
        {
            label: "SEO & Redirects",
            href: "/admin/seo-redirects",
            icon: Globe
        },
        {
            label: "Settings",
            icon: UserCog,
            subItems: [
                {
                    label: "User Management",
                    href: "/admin/settings"
                }
            ]
        }
    ];

    const currentPath = location;

    const handleLogout = () => {
        logoutMutation.mutate();
    };

    const handleItemClick = (item: any) => {
        if (item.subItems) {
            toggleExpand(item.label);
            if (item.href) {
                setLocation(item.href);
            }
        }
    };

    return (
        <div className="flex h-screen bg-[#f8fafc]">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? "w-64" : "w-20"
                    } transition-all duration-300 flex flex-col h-full bg-[#06183C] text-white overflow-hidden z-50`}
            >
                <div className={`py-4 flex items-center justify-between border-b border-white/10 ${isSidebarOpen ? "pl-6 pr-0" : "px-4"}`}>
                    <Link href="/" className="flex items-center overflow-hidden flex-1">
                        <img
                            src={isSidebarOpen ? logoImage : logoIcon}
                            alt="VectorWiz"
                            className={`transition-all duration-300 ${isSidebarOpen ? "h-8 w-auto" : "h-8 mx-auto"}`}
                        />
                    </Link>
                   
                </div>

                <ScrollArea className="flex-1 py-6 px-4">
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const isParentActive = item.subItems 
                                ? item.subItems.some(sub => currentPath === sub.href)
                                : currentPath === item.href;
                            const isExpanded = expandedItems.includes(item.label) || isParentActive;
                            const Icon = item.icon!;
                            
                            if (item.subItems) {
                                return (
                                    <div key={item.label} className="space-y-1">
                                        <div
                                            onClick={() => handleItemClick(item)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isParentActive
                                                ? "bg-white/10 text-white"
                                                : "text-white/70 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon size={20} className="shrink-0" />
                                                {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                                            </div>
                                            {isSidebarOpen && (
                                                <div onClick={(e) => { e.stopPropagation(); toggleExpand(item.label); }}>
                                                    <ChevronRight 
                                                        size={14} 
                                                        className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        
                                        {isSidebarOpen && isExpanded && (
                                            <div className="ml-9 space-y-1 overflow-hidden transition-all duration-300">
                                                {item.subItems.map((sub) => {
                                                    const isSubActive = currentPath === sub.href;
                                                    return (
                                                        <Link key={sub.href} href={sub.href}>
                                                            <div
                                                                className={`px-3 py-2 rounded-lg cursor-pointer transition-all text-xs font-medium ${isSubActive
                                                                    ? "bg-[#0B9F47] text-white shadow-lg shadow-[#0B9F47]/20"
                                                                    : "text-white/50 hover:text-white hover:bg-white/5"
                                                                    }`}
                                                            >
                                                                {sub.label}
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <Link key={item.href} href={item.href!}>
                                    <div
                                        className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all ${isParentActive
                                            ? "bg-[#0B9F47] text-white shadow-lg shadow-[#0B9F47]/20"
                                            : "text-white/70 hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        <Icon size={20} className="shrink-0" />
                                        {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>

                <div className="p-4 border-t border-white/10">
                    <div
                        onClick={handleLogout}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg text-white/70 hover:bg-red-500/10 hover:text-red-400 cursor-pointer transition-all ${logoutMutation.isPending && "opacity-50 pointer-events-none"}`}
                    >
                        {logoutMutation.isPending ? (
                            <Loader size={20} className="animate-spin" />
                        ) : (
                            <LogOut size={20} className="shrink-0" />
                        )}
                        {isSidebarOpen && <span className="font-medium text-sm">{logoutMutation.isPending ? "Signing Out..." : "Sign Out"}</span>}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-40">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <MenuIcon size={20} />
                        </button>
                        <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-1.5 focus-within:ring-2 ring-[#0B9F47]/20 transition-all">
                            <Search size={16} className="text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none outline-none text-sm w-64"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Menu shadow="md" width={320} position="bottom-end" radius="md">
                            <Menu.Target>
                                <button className="relative text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all">
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm border-2 border-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            </Menu.Target>
                            <Menu.Dropdown p={0} className="w-80 shadow-xl overflow-hidden rounded-xl border border-gray-100">
                                <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/50">
                                    <span className="font-semibold text-sm text-gray-800">Notifications</span>
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={markAllAsRead}
                                            className="text-xs text-[#0B9F47] hover:text-[#0A8E3F] font-medium transition-colors"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map((notif) => (
                                            <div 
                                                key={notif.id} 
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`flex items-start gap-3 p-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${!notif.isRead ? 'bg-[#0B9F47]/5' : ''}`}
                                            >
                                                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!notif.isRead ? 'bg-[#0B9F47]/10 text-[#0B9F47]' : 'bg-gray-100 text-gray-500'}`}>
                                                    {notif.type === 'quote' ? <FileText size={14} /> : <Bell size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0 pb-1">
                                                    <div className="flex items-start justify-between gap-1 mb-0.5">
                                                        <span className={`text-sm truncate leading-tight ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                            {notif.title}
                                                        </span>
                                                        {!notif.isRead && (
                                                            <span className="mt-1.5 w-2 h-2 rounded-full bg-[#0B9F47] flex-shrink-0 shadow-sm" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 line-clamp-1 mb-1">{notif.description}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">{formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                                            <Bell size={24} className="text-gray-300 mb-2" />
                                            <span className="text-sm">No notifications yet</span>
                                        </div>
                                    )}
                                </div>
                            </Menu.Dropdown>
                        </Menu>
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        <Menu shadow="md" width={220} position="bottom-end" radius="md">
                            <Menu.Target>
                                <div className="flex items-center gap-3 pl-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-semibold text-gray-900 leading-none">{user?.username || 'Admin User'}</p>
                                        <p className="text-xs text-gray-500 mt-1 capitalize">{user?.role || 'Super Admin'}</p>
                                    </div>
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#0B9F47] to-[#0A8E3F] flex items-center justify-center text-white shadow-md">
                                        <User size={18} />
                                    </div>
                                </div>
                            </Menu.Target>

                            <Menu.Dropdown>
                                <Menu.Label>Application</Menu.Label>
                                <Menu.Item 
                                    leftSection={<UserCog size={14} />} 
                                    onClick={() => setLocation("/admin/settings")}
                                >
                                    Profile Settings
                                </Menu.Item>
                                
                                <Menu.Divider />
                                
                                <Menu.Item 
                                    color="red" 
                                    leftSection={logoutMutation.isPending ? <Loader size={14} className="animate-spin" /> : <LogOut size={14} />}
                                    onClick={handleLogout}
                                >
                                    Sign Out
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-full mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
