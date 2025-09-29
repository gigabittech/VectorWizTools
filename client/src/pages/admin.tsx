import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Crown,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import type { Order } from "@shared/schema";
import RecentActivity from "@/components/dashboard/RecentActivity";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Crown className="h-4 w-4 text-white" />
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

  return (
    <div className="bg-gradient-to-br from-background to-muted">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="admin-page">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Crown className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage orders, users, and monitor system performance
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
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
                <div className="p-3 bg-green-100 rounded-xl">
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
                <div className="p-3 bg-orange-100 rounded-xl">
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
                <div className="p-3 bg-emerald-100 rounded-xl">
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="orders" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="orders" data-testid="orders-tab">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="analytics" data-testid="analytics-tab">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="settings" data-testid="settings-tab">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

          <TabsContent value="orders">
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
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
                          <Badge variant="secondary">{count}</Badge>
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
                          <Badge variant="secondary">{count}</Badge>
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
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-medium mb-2">Order Management</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure default settings for order processing
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm">
                        Update Status Templates
                      </Button>
                      <Button variant="outline" size="sm">
                        Configure Notifications
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-medium mb-2">User Management</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage user roles and permissions
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm">
                        Manage Roles
                      </Button>
                      <Button variant="outline" size="sm">
                        View User Activity
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Recent Activity */}
          <div>
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
}