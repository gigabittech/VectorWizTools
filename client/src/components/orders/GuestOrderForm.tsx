import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { guestOrderSchema, type GuestOrder } from "@shared/schema";

type FormStep = "service" | "contact" | "files" | "summary";

const services = [
  { value: "IMAGE_TO_VECTOR", label: "Image to Vector", price: 15, description: "Convert raster images to scalable vectors" },
  { value: "LOGO_VECTORIZATION", label: "Logo Vectorization", price: 25, description: "Professional logo conversion" },
  { value: "PDF_TO_VECTOR", label: "PDF to Vector", price: 20, description: "Extract graphics from PDF files" },
  { value: "DXF_CUTTER_READY", label: "DXF Cutter Ready", price: 30, description: "Prepare files for laser cutting" },
  { value: "RASTER_TO_VECTOR", label: "Raster to Vector", price: 18, description: "High-quality raster conversion" },
];

export default function GuestOrderForm() {
  const [currentStep, setCurrentStep] = useState<FormStep>("service");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const form = useForm<GuestOrder>({
    resolver: zodResolver(guestOrderSchema),
    defaultValues: {
      service: undefined as any,
      notes: "",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      guestCompany: "",
      priceCents: undefined,
      currency: "USD",
    },
  });

  // Watch form values to trigger re-renders when they change
  const watchedValues = form.watch(["service", "guestName", "guestEmail"]);

  const createOrderMutation = useMutation({
    mutationFn: async (data: GuestOrder) => {
      const response = await apiRequest("POST", "/api/orders/guest", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order submitted successfully!",
        description: "We'll send you a confirmation email shortly.",
      });
      // Reset form
      form.reset();
      setSelectedFiles([]);
      setCurrentStep("service");
    },
    onError: () => {
      toast({
        title: "Order submission failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const steps = [
    { key: "service", label: "Select Service", number: 1 },
    { key: "contact", label: "Contact Info", number: 2 },
    { key: "files", label: "Upload Files", number: 3 },
    { key: "summary", label: "Review & Submit", number: 4 },
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    const values = form.getValues();
    switch (currentStep) {
      case "service":
        return !!values.service;
      case "contact":
        return !!(values.guestName && values.guestEmail);
      case "files":
        return true; // Files are optional for guest orders
      case "summary":
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const currentIndex = steps.findIndex(step => step.key === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key as FormStep);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex(step => step.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key as FormStep);
    }
  };

  const onSubmit = async (data: GuestOrder) => {
    // Add selected service pricing
    const selectedService = services.find(s => s.value === data.service);
    if (selectedService) {
      data.priceCents = selectedService.price * 100;
    }
    
    // TODO: Handle file uploads to cloud storage
    // For now, we'll submit without files and handle uploads separately
    
    createOrderMutation.mutate(data);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const selectedService = services.find(s => s.value === form.watch("service"));

  return (
    <div className="max-w-4xl mx-auto" data-testid="guest-order-form">
      {/* Progress Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl">Create Your Order</CardTitle>
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div 
                key={step.key} 
                className={`flex items-center ${index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < currentStepIndex ? 'bg-primary text-primary-foreground' : 
                    index === currentStepIndex ? 'bg-primary text-primary-foreground' : 
                    'bg-muted text-muted-foreground'
                  }`}
                >
                  {index < currentStepIndex ? <Check className="h-4 w-4" /> : step.number}
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">{step.label}</span>
              </div>
            ))}
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {currentStep === "service" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Select Your Service</h3>
                  <p className="text-muted-foreground mb-6">Choose the type of vector conversion you need</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <Card 
                      key={service.value} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        form.watch("service") === service.value ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => form.setValue("service", service.value as any)}
                      data-testid={`service-${service.value}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{service.label}</h4>
                          <span className="text-lg font-bold text-primary">${service.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "contact" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Contact Information</h3>
                  <p className="text-muted-foreground mb-6">We'll use this to send you updates about your order</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guestName">Full Name *</Label>
                    <Input
                      id="guestName"
                      {...form.register("guestName")}
                      placeholder="Your full name"
                      data-testid="input-guest-name"
                    />
                    {form.formState.errors.guestName && (
                      <p className="text-destructive text-sm">{form.formState.errors.guestName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guestEmail">Email Address *</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      {...form.register("guestEmail")}
                      placeholder="your.email@example.com"
                      data-testid="input-guest-email"
                    />
                    {form.formState.errors.guestEmail && (
                      <p className="text-destructive text-sm">{form.formState.errors.guestEmail.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guestPhone">Phone Number</Label>
                    <Input
                      id="guestPhone"
                      {...form.register("guestPhone")}
                      placeholder="(555) 123-4567"
                      data-testid="input-guest-phone"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guestCompany">Company (Optional)</Label>
                    <Input
                      id="guestCompany"
                      {...form.register("guestCompany")}
                      placeholder="Your company name"
                      data-testid="input-guest-company"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === "files" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Upload Your Files</h3>
                  <p className="text-muted-foreground mb-6">Upload the images you want converted to vectors</p>
                </div>
                
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-lg font-medium">Click to upload files</span>
                    <p className="text-sm text-muted-foreground mt-2">
                      Support formats: JPG, PNG, GIF, PDF, AI, PSD
                    </p>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.ai,.psd"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="file-upload-input"
                  />
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Files:</h4>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-3 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          data-testid={`remove-file-${index}`}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Special Instructions (Optional)</Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Any special requirements or notes about your order..."
                    rows={4}
                    data-testid="input-notes"
                  />
                </div>
              </div>
            )}

            {currentStep === "summary" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Review Your Order</h3>
                  <p className="text-muted-foreground mb-6">Please review your order details before submitting</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Service</h4>
                      <p className="text-muted-foreground">{selectedService?.label}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Contact</h4>
                      <p className="text-muted-foreground">{form.getValues("guestName")}</p>
                      <p className="text-muted-foreground">{form.getValues("guestEmail")}</p>
                      {form.getValues("guestPhone") && (
                        <p className="text-muted-foreground">{form.getValues("guestPhone")}</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Files</h4>
                      <p className="text-muted-foreground">{selectedFiles.length} file(s) selected</p>
                    </div>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-4">Order Summary</h4>
                      <div className="flex justify-between mb-2">
                        <span>{selectedService?.label}</span>
                        <span>${selectedService?.price}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span>${selectedService?.price}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {currentStep !== "service" ? (
            <Button type="button" variant="outline" onClick={prevStep} data-testid="button-previous">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          ) : (
            <div />
          )}
          
          {currentStep !== "summary" ? (
            <Button 
              type="button" 
              onClick={nextStep} 
              disabled={!canProceed()}
              data-testid="button-next"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={!canProceed() || createOrderMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-submit-order"
            >
              {createOrderMutation.isPending ? "Submitting..." : "Submit Order"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}