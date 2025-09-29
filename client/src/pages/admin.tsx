import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Crown,
  Clock,
  CheckCircle,
  Home,
  Menu,
  X,
  LogOut
} from "lucide-react";
import type { Order } from "@shared/schema";
import RecentActivity from "@/components/dashboard/RecentActivity";

// Content Components
function DashboardContent({ orderStats, userStats, orderStatsLoading, userStatsLoading }: {
  orderStats: any;
  userStats: any;
  orderStatsLoading: boolean;
  userStatsLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">
                  {orderStatsLoading ? "..." : orderStats?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">
                  {userStatsLoading ? "..." : userStats?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">
                  {orderStatsLoading ? "..." : orderStats?.byStatus?.IN_PROGRESS || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {orderStatsLoading ? "..." : orderStats?.byStatus?.COMPLETE || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline" data-testid="quick-action-orders">
              <ShoppingCart className="mr-2 h-4 w-4" />
              View All Orders
            </Button>
            <Button className="w-full justify-start" variant="outline" data-testid="quick-action-reports">
              <BarChart3 className="mr-2 h-4 w-4" />
              Generate Reports
            </Button>
            <Button className="w-full justify-start" variant="outline" data-testid="quick-action-settings">
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OrdersContent({ orders, ordersLoading, statusStyles, statusLabels, serviceNames }: {
  orders: Order[];
  ordersLoading: boolean;
  statusStyles: any;
  statusLabels: any;
  serviceNames: any;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {ordersLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-muted/30 rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-48 mb-2" />
                <div className="h-3 bg-muted rounded w-32" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No orders found
          </div>
        ) : (
          <div className="space-y-4" data-testid="admin-orders-list">
            {orders.map((order) => (
              <div key={order.id} className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">Order #{order.id.slice(-8)}</span>
                    <Badge className={statusStyles[order.status as keyof typeof statusStyles]}>
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {serviceNames[order.service as keyof typeof serviceNames]}
                  </span>
                  <span className="font-medium">
                    ${((order.priceCents || 0) / 100).toFixed(2)}
                  </span>
                </div>
                {order.guestName && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Customer: {order.guestName} ({order.guestEmail})
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsContent({ orderStats, userStats, orderStatsLoading, userStatsLoading, statusLabels, serviceNames }: {
  orderStats: any;
  userStats: any;
  orderStatsLoading: boolean;
  userStatsLoading: boolean;
  statusLabels: any;
  serviceNames: any;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Orders by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {orderStatsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between p-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-8" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(orderStats?.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm">{statusLabels[status as keyof typeof statusLabels]}</span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders by Service</CardTitle>
        </CardHeader>
        <CardContent>
          {orderStatsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between p-2">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-4 bg-muted rounded w-8" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(orderStats?.byService || {}).map(([service, count]) => (
                <div key={service} className="flex justify-between items-center">
                  <span className="text-sm">{serviceNames[service as keyof typeof serviceNames]}</span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users by Role</CardTitle>
        </CardHeader>
        <CardContent>
          {userStatsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between p-2">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-4 bg-muted rounded w-8" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(userStats?.byRole || {}).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{role.toLowerCase()}</span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Configure default settings for order processing
          </p>
          <div className="space-y-3">
            <Button variant="outline" data-testid="settings-status-templates">
              Update Status Templates
            </Button>
            <Button variant="outline" data-testid="settings-notifications">
              Configure Notifications
            </Button>
            <Button variant="outline" data-testid="settings-pricing">
              Pricing Management
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Manage system-wide configurations
          </p>
          <div className="space-y-3">
            <Button variant="outline" data-testid="settings-email">
              Email Settings
            </Button>
            <Button variant="outline" data-testid="settings-storage">
              File Storage Configuration
            </Button>
            <Button variant="outline" data-testid="settings-payments">
              Payment Gateway Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type AdminSection = "dashboard" | "orders" | "analytics" | "settings";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    select: (data: any) => data.orders || [],
    enabled: user?.role === "ADMIN"
  });

  const { data: orderStats, isLoading: orderStatsLoading } = useQuery<{
    total: number;
    byStatus: Record<string, number>;
    byService: Record<string, number>;
  }>({
    queryKey: ["/api/admin/analytics/orders"],
    enabled: user?.role === "ADMIN"
  });

  const { data: userStats, isLoading: userStatsLoading } = useQuery<{
    total: number;
    byRole: Record<string, number>;
  }>({
    queryKey: ["/api/admin/analytics/users"],
    enabled: user?.role === "ADMIN"
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null; // Redirecting
  }

  const statusStyles = {
    QUEUED: "status-badge-queued",
    IN_PROGRESS: "status-badge-progress",
    NEEDS_REVISION: "status-badge-revision",
    WAITING_PAYMENT: "status-badge-queued",
    COMPLETE: "status-badge-complete",
    CANCELED: "bg-gray-100 text-gray-600",
  };

  const statusLabels = {
    QUEUED: "Queued",
    IN_PROGRESS: "In Progress",
    NEEDS_REVISION: "Needs Revision",
    WAITING_PAYMENT: "Waiting Payment",
    COMPLETE: "Complete",
    CANCELED: "Canceled",
  };

  const serviceNames = {
    IMAGE_TO_VECTOR: "Image to Vector",
    LOGO_VECTORIZATION: "Logo Vectorization",
    PDF_TO_VECTOR: "PDF to Vector",
    DXF_CUTTER_READY: "DXF Cutter Ready",
    RASTER_TO_VECTOR: "Raster to Vector",
  };

  const navigationItems = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "orders", label: "Orders", icon: ShoppingCart },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardContent orderStats={orderStats} userStats={userStats} orderStatsLoading={orderStatsLoading} userStatsLoading={userStatsLoading} />;
      case "orders":
        return <OrdersContent orders={orders} ordersLoading={ordersLoading} statusStyles={statusStyles} statusLabels={statusLabels} serviceNames={serviceNames} />;
      case "analytics":
        return <AnalyticsContent orderStats={orderStats} userStats={userStats} orderStatsLoading={orderStatsLoading} userStatsLoading={userStatsLoading} statusLabels={statusLabels} serviceNames={serviceNames} />;
      case "settings":
        return <SettingsContent />;
      default:
        return <DashboardContent orderStats={orderStats} userStats={userStats} orderStatsLoading={orderStatsLoading} userStatsLoading={userStatsLoading} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex" data-testid="admin-page">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold">VectorWiz Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
            data-testid="close-sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setActiveSection(item.key as AdminSection);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors",
                  activeSection === item.key
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
                data-testid={`nav-${item.key}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.email}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => setLocation("/logout")}
            data-testid="logout-button"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              data-testid="open-sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {navigationItems.find(item => item.key === activeSection)?.label || "Dashboard"}
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}