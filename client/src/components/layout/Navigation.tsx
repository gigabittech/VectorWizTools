import { Link, useLocation } from "wouter";
import { Button, Avatar, Badge, Menu, Drawer, Stack, Divider, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAuth } from "@/hooks/use-auth";
import { Bell, ChevronDown, LayoutDashboard, ShoppingBag, Wrench, Folder, Crown, Menu as MenuIcon, X } from "lucide-react";

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [opened, { open, close }] = useDisclosure(false);

  // Public navigation for guests and general users
  const publicNavItems = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/order/new", label: "Create Order", icon: ShoppingBag },
    { href: "/tools", label: "Tools", icon: Wrench },
  ];

  // Admin-only navigation items
  const adminNavItems = [
    { href: "/admin", label: "Admin", icon: Crown },
  ];

  // Show different navigation based on user role
  const navItems = user?.role === "ADMIN" ? adminNavItems : publicNavItems;

  const isActive = (href: string) => {
    // For the root path, require exact match to avoid always being active
    if (href === "/") {
      return location === "/";
    }
    // For other paths, use startsWith for sub-route matching
    return location === href || location.startsWith(href);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <>
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50" data-testid="main-navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <Link href={user?.role === "ADMIN" ? "/admin" : "/"} className="flex items-center space-x-2 sm:space-x-3" data-testid="logo-link">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-secondary">VectorWiz</span>
                <Badge variant="light" size="xs" className="hidden sm:block">{user?.role === "ADMIN" ? "Admin" : "Services"}</Badge>
              </Link>
              
              {/* Desktop Navigation */}
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
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Menu Button */}
              <Button 
                variant="subtle" 
                className="md:hidden" 
                onClick={open}
                data-testid="mobile-menu-button"
                size="sm"
              >
                <MenuIcon className="h-5 w-5" />
              </Button>

              {/* Desktop User Menu */}
              {user ? (
                <>
                  {user.role === "ADMIN" && (
                    <Button 
                      variant="subtle" 
                      size="sm" 
                      className="relative hidden sm:flex"
                      data-testid="notifications-button"
                    >
                      <Bell className="h-4 w-4" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
                    </Button>
                  )}
                  
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <Button variant="subtle" className="flex items-center space-x-2 sm:space-x-3" data-testid="user-menu-trigger">
                        <Avatar size="sm" color="primary">
                          {getInitials(user?.name || null)}
                        </Avatar>
                        <div className="hidden lg:block text-left">
                          <div className="text-sm font-medium" data-testid="user-name">{user?.name || "User"}</div>
                          <div className="text-xs text-muted-foreground" data-testid="user-email">{user?.email}</div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item onClick={logout} data-testid="logout-button">
                        Logout
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login" className="hidden sm:block">
                    <Button variant="subtle" data-testid="sign-in-button">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/order/new">
                    <Button color="green" size="sm" data-testid="order-now-button">
                      <span className="hidden sm:inline">Order Now</span>
                      <span className="sm:hidden">Order</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <Drawer 
        opened={opened} 
        onClose={close} 
        title={
          <Group>
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">VectorWiz</span>
          </Group>
        }
        size="xs"
        data-testid="mobile-navigation-drawer"
      >
        <Stack gap="sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={close}
              >
                <Button
                  variant={isActive(item.href) ? "filled" : "subtle"}
                  color={isActive(item.href) ? "green" : "gray"}
                  fullWidth
                  justify="flex-start"
                  leftSection={<Icon className="h-4 w-4" />}
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
          
          {!user && (
            <>
              <Divider my="sm" />
              <Link href="/login" onClick={close}>
                <Button variant="outline" fullWidth>
                  Sign In
                </Button>
              </Link>
              <Link href="/signup" onClick={close}>
                <Button color="green" fullWidth>
                  Create Account
                </Button>
              </Link>
            </>
          )}

          {user && (
            <>
              <Divider my="sm" />
              <Group>
                <Avatar size="md" color="primary">
                  {getInitials(user?.name || null)}
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{user?.name || "User"}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </div>
              </Group>
              <Button variant="outline" fullWidth onClick={() => { logout(); close(); }}>
                Logout
              </Button>
            </>
          )}
        </Stack>
      </Drawer>
    </>
  );
}
