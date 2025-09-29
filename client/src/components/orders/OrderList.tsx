import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "@shared/schema";
import { Image, FileText, Scissors, Award, RotateCcw, Eye } from "lucide-react";

const serviceIcons = {
  IMAGE_TO_VECTOR: Image,
  LOGO_VECTORIZATION: Award,
  PDF_TO_VECTOR: FileText,
  DXF_CUTTER_READY: Scissors,
  RASTER_TO_VECTOR: RotateCcw,
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

export default function OrderList() {
  const { data: orders = [], isLoading, error } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    select: (data: any) => data.orders || [],
  });

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="orders-loading">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card data-testid="orders-error">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Failed to load orders. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card data-testid="no-orders">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Image className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No orders yet</h3>
          <p className="text-muted-foreground mb-6">
            Start your first vector conversion project today
          </p>
          <Link href="/order/new">
            <Button className="gradient-primary">Create Your First Order</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="orders-list">
      {orders.map((order) => {
        const ServiceIcon = serviceIcons[order.service];
        const serviceName = serviceNames[order.service];
        const statusStyle = statusStyles[order.status];
        const statusLabel = statusLabels[order.status];

        return (
          <Card key={order.id} className="card-hover" data-testid={`order-${order.id}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-white">
                    <ServiceIcon className="h-5 w-5" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg" data-testid={`order-service-${order.id}`}>
                      {serviceName}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid={`order-id-${order.id}`}>
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`order-date-${order.id}`}>
                      Created {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    {order.notes && (
                      <p className="text-sm text-muted-foreground mt-1 max-w-md truncate">
                        {order.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <Badge className={`${statusStyle} px-3 py-1 text-sm font-medium`}>
                      {statusLabel}
                    </Badge>
                    <div className="mt-2">
                      <p className="font-semibold text-lg">
                        {order.priceCents ? `$${(order.priceCents / 100).toFixed(2)}` : "Quote pending"}
                      </p>
                    </div>
                  </div>
                  
                  <Link href={`/orders/${order.id}`}>
                    <Button 
                      variant="outline" 
                      className="border-primary text-primary hover:bg-primary hover:text-white"
                      data-testid={`view-order-${order.id}`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
