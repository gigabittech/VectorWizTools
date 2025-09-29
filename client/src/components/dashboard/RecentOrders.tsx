import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order } from "@shared/schema";
import { Image, FileText, Scissors } from "lucide-react";

const serviceIcons = {
  IMAGE_TO_VECTOR: Image,
  LOGO_VECTORIZATION: Image,
  PDF_TO_VECTOR: FileText,
  DXF_CUTTER_READY: Scissors,
  RASTER_TO_VECTOR: Image,
};

const serviceNames = {
  IMAGE_TO_VECTOR: "Image to Vector",
  LOGO_VECTORIZATION: "Logo Vectorization", 
  PDF_TO_VECTOR: "PDF to Vector",
  DXF_CUTTER_READY: "DXF Cutter Ready",
  RASTER_TO_VECTOR: "Raster to Vector",
};

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

export default function RecentOrders() {
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    select: (data: any) => data.orders || [],
  });

  const recentOrders = orders.slice(0, 3);

  if (isLoading) {
    return (
      <div className="lg:col-span-2">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Orders</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-xl animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2" data-testid="recent-orders">
      <Card className="shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" data-testid="view-all-orders">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {recentOrders.length === 0 ? (
            <div className="text-center py-8" data-testid="no-orders-message">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">Start your first vector conversion project</p>
              <Link href="/order/new">
                <Button className="gradient-primary">Create Order</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => {
                const ServiceIcon = serviceIcons[order.service];
                const serviceName = serviceNames[order.service];
                const statusStyle = statusStyles[order.status];
                const statusLabel = statusLabels[order.status];
                
                return (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <div 
                      className="flex items-center space-x-4 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                      data-testid={`order-${order.id}`}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-white">
                        <ServiceIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-foreground">{serviceName}</h3>
                          <Badge className={`${statusStyle} px-2 py-1 text-xs font-medium`}>
                            {statusLabel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {order.priceCents ? `$${(order.priceCents / 100).toFixed(2)}` : "Quote pending"}
                        </p>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs mt-1">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
