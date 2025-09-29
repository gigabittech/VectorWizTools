import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/Navigation";
import MessageCenter from "@/components/messaging/MessageCenter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "@shared/schema";
import { ArrowLeft, Download, MessageCircle, Clock, DollarSign } from "lucide-react";
import { Link } from "wouter";

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

export default function OrderDetail() {
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ["/api/orders", id],
    select: (data: any) => data.order,
    enabled: !!id,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-24 mb-4" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The order you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Link href="/orders">
                <Button>Back to Orders</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const serviceName = serviceNames[order.service];
  const statusStyle = statusStyles[order.status];
  const statusLabel = statusLabels[order.status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="order-detail-page">
        <div className="mb-8">
          <Link href="/orders">
            <Button variant="ghost" className="mb-4" data-testid="back-to-orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="order-title">
                {serviceName}
              </h1>
              <p className="text-muted-foreground" data-testid="order-id">
                Order #{order.id.slice(0, 8)}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="order-created">
                Created {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <Badge className={`${statusStyle} px-4 py-2 text-lg font-medium`} data-testid="order-status">
              {statusLabel}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Order Information */}
            <Card data-testid="order-info">
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium" data-testid="service-name">{serviceName}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={statusStyle} data-testid="status-badge">
                    {statusLabel}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium text-lg" data-testid="order-price">
                    {order.priceCents ? `$${(order.priceCents / 100).toFixed(2)}` : "Quote pending"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span data-testid="created-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {order.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Requirements & Notes:</h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg" data-testid="order-notes">
                      {order.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Files & Downloads */}
            <Card data-testid="files-section">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Files & Downloads</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.status === "COMPLETE" ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <h4 className="font-medium text-emerald-700 mb-2">✓ Files Ready for Download</h4>
                      <p className="text-sm text-emerald-600 mb-3">
                        Your vectorized files are ready. Download them below.
                      </p>
                      <Button className="gradient-primary" data-testid="download-files">
                        <Download className="mr-2 h-4 w-4" />
                        Download All Files
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-medium mb-2">Files In Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      Your files will be available for download once the order is complete.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            {(order.priceCents || order.status === "WAITING_PAYMENT") && (
              <Card data-testid="payment-section">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Payment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.status === "WAITING_PAYMENT" ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-medium text-amber-700 mb-2">Payment Required</h4>
                      <p className="text-sm text-amber-600 mb-3">
                        Complete your payment to start processing your order.
                      </p>
                      <Button className="gradient-primary" data-testid="pay-now">
                        Pay ${(order.priceCents || 0) / 100}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-medium">${(order.priceCents || 0) / 100}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Messages */}
          <div>
            <MessageCenter orderId={order.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
