import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
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
    ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import logoImage from "@assets/VectorWiz-logo_1760804742760.png";
import { useAuth } from "@/hooks/use-auth";

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { user, logoutMutation } = useAuth();
    const [location] = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navItems = [
        {
            label: "Dashboard",
            href: "/tools/admin/dashboard",
            icon: LayoutDashboard
        },
        {
            label: "Tools Management",
            href: "/tools/admin/management",
            icon: Settings
        },
        {
            label: "SEO & Redirects",
            href: "/tools/admin/seo-redirects",
            icon: Globe
        }
    ];

    const currentPath = location;

    const handleLogout = () => {
        logoutMutation.mutate();
    };

    return (
        <div className="flex h-screen bg-[#f8fafc]">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? "w-64" : "w-20"
                    } transition-all duration-300 flex flex-col h-full bg-[#06183C] text-white overflow-hidden z-50`}
            >
                <div className="p-6 flex items-center justify-between border-b border-white/10">
                    <Link href="/" className="flex items-center overflow-hidden">
                        <img
                            src={logoImage}
                            alt="VectorWiz"
                            className={`h-8 transition-all ${!isSidebarOpen && "scale-150 ml-2"}`}
                        />
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="md:hidden text-white/70 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <ScrollArea className="flex-1 py-6 px-4">
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const isActive = currentPath === item.href;
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href}>
                                    <div
                                        className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all ${isActive
                                            ? "bg-[#0B9F47] text-white shadow-lg shadow-[#0B9F47]/20"
                                            : "text-white/70 hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        <Icon size={20} className="shrink-0" />
                                        {isSidebarOpen && <span className="font-medium">{item.label}</span>}
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
                        <button className="relative text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-gray-900 leading-none">{user?.username || 'Admin User'}</p>
                                <p className="text-xs text-gray-500 mt-1 capitalize">{user?.role || 'Super Admin'}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#0B9F47] to-[#0A8E3F] flex items-center justify-center text-white shadow-md">
                                <User size={18} />
                            </div>
                        </div>
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
