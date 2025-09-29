import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ServiceSelection from "./ServiceSelection";
import FileUpload from "./FileUpload";
import OrderDetails from "./OrderDetails";
import PayPalWrapper from "@/components/PayPalWrapper";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface OrderWizardProps {
  open: boolean;
  onClose: () => void;
}

type WizardStep = "service" | "files" | "details" | "payment";

interface OrderData {
  service: string;
  files: Array<{ name: string; size: number; url: string }>;
  notes: string;
  estimatedPrice: number;
}

export default function OrderWizard({ open, onClose }: OrderWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("service");
  const [orderData, setOrderData] = useState<Partial<OrderData>>({});
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Created",
        description: "Your order has been created successfully.",
      });
      onClose();
      setLocation(`/orders/${data.order.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const steps = [
    { key: "service", label: "Service", number: 1 },
    { key: "files", label: "Files", number: 2 },
    { key: "details", label: "Details", number: 3 },
    { key: "payment", label: "Payment", number: 4 },
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case "service":
        return !!orderData.service;
      case "files":
        return orderData.files && orderData.files.length > 0;
      case "details":
        return true; // Notes are optional
      case "payment":
        return false; // Handled by PayPal button
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key as WizardStep);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key as WizardStep);
    }
  };

  const handleCreateOrder = async () => {
    if (!orderData.service) return;

    await createOrderMutation.mutateAsync({
      service: orderData.service,
      notes: orderData.notes || "",
      // Files will be linked separately after upload
    });
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful",
      description: "Your order has been paid and is now being processed.",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" data-testid="order-wizard">
        <DialogHeader className="gradient-primary p-6 text-white -m-6 mb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">Create New Order</DialogTitle>
              <p className="opacity-90">Transform your images into perfect vectors</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
              data-testid="close-wizard"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="mt-6">
            <Progress value={progress} className="mb-4" />
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index <= currentStepIndex 
                      ? "bg-white text-primary" 
                      : "bg-white/20 text-white"
                  }`}>
                    {step.number}
                  </div>
                  <span className={`ml-2 text-sm ${
                    index <= currentStepIndex ? "text-white" : "text-white/70"
                  }`}>
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="w-16 h-0.5 bg-white/30 mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStep === "service" && (
            <ServiceSelection
              selectedService={orderData.service}
              onServiceSelect={(service) => setOrderData({ ...orderData, service })}
            />
          )}

          {currentStep === "files" && (
            <FileUpload
              files={orderData.files || []}
              onFilesChange={(files) => setOrderData({ ...orderData, files })}
            />
          )}

          {currentStep === "details" && (
            <OrderDetails
              notes={orderData.notes || ""}
              onNotesChange={(notes) => setOrderData({ ...orderData, notes })}
            />
          )}

          {currentStep === "payment" && (
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Complete Your Order</h3>
                <p className="text-muted-foreground">
                  Service: {orderData.service?.replace(/_/g, " ")}
                </p>
                <p className="text-2xl font-bold text-primary mt-4">
                  Estimated: $45.00
                </p>
              </div>
              
              <div className="max-w-md mx-auto">
                <PayPalWrapper
                  amount="45.00"
                  currency="USD"
                  intent="capture"
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                Final pricing will be confirmed after review
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between p-6 border-t border-border bg-muted/20 -m-6 mt-0">
          <Button 
            variant="ghost" 
            onClick={onClose}
            data-testid="cancel-order"
          >
            Cancel
          </Button>
          
          <div className="flex space-x-3">
            {currentStepIndex > 0 && (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                data-testid="previous-step"
              >
                Previous
              </Button>
            )}
            
            {currentStep !== "payment" ? (
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
                className="gradient-primary"
                data-testid="next-step"
              >
                Next Step
              </Button>
            ) : (
              <Button 
                onClick={handleCreateOrder}
                disabled={createOrderMutation.isPending}
                className="gradient-primary"
                data-testid="create-order"
              >
                {createOrderMutation.isPending ? "Creating..." : "Create Order"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
