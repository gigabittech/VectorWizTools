import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Bell, ChevronDown, LayoutDashboard, ShoppingBag, Wrench, Folder, Crown } from "lucide-react";

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/orders", label: "Orders", icon: ShoppingBag },
    { href: "/tools", label: "Tools", icon: Wrench },
    { href: "/files", label: "Files", icon: Folder },
    ...(user?.role === "ADMIN" ? [{ href: "/admin", label: "Admin", icon: Crown }] : []),
  ];

  const isActive = (href: string) => {
    return location === href || (href !== "/dashboard" && location.startsWith(href));
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50" data-testid="main-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-3" data-testid="logo-link">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-secondary">VectorWiz</span>
              <Badge variant="secondary" className="text-xs">Portal</Badge>
            </Link>
            
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center space-x-2 ${
                      isActive(item.href) 
                        ? "nav-active" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              data-testid="notifications-button"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3" data-testid="user-menu-trigger">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {getInitials(user?.name || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium" data-testid="user-name">{user?.name || "User"}</div>
                    <div className="text-xs text-muted-foreground" data-testid="user-email">{user?.email}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={logout} data-testid="logout-button">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
