import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Paper,
  Box,
  Title,
  Button,
  TextInput,
  Textarea,
  Select,
  Progress,
  Badge,
  Loader,
  Switch,
  Radio,
  Group,
  Stack,
  Checkbox,
} from "@mantine/core";
import { MantineForm, MantineFormField } from "@/components/ui/mantine-form";
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  FileImage,
  Zap,
  Clock,
  Sparkles,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { guestOrderSchema, type GuestOrder } from "@shared/schema";
import { analyzeImage, getQuickEstimate, formatPrice, type ImageAnalysisResult } from "@/lib/imageAnalysis";

type FormStep = "service" | "contact" | "files" | "options" | "summary";

interface FileWithAnalysis {
  file: File;
  clientAnalysis?: ImageAnalysisResult;
  serverAnalysis?: any;
  isAnalyzing: boolean;
  quickEstimate?: {
    estimatedPrice: number;
    complexityTier: string;
    processingTime: string;
  };
}

const services = [
  { value: "IMAGE_TO_VECTOR", label: "Image to Vector", basePrice: 1500, description: "Convert raster images to scalable vectors" },
  { value: "LOGO_VECTORIZATION", label: "Logo Vectorization", basePrice: 2500, description: "Professional logo conversion" },
  { value: "PDF_TO_VECTOR", label: "PDF to Vector", basePrice: 2000, description: "Extract graphics from PDF files" },
  { value: "DXF_CUTTER_READY", label: "DXF Cutter Ready", basePrice: 3000, description: "Prepare files for laser cutting" },
  { value: "RASTER_TO_VECTOR", label: "Raster to Vector", basePrice: 1800, description: "High-quality raster conversion" },
];

const turnaroundOptions = [
  { value: "STANDARD", label: "Standard", description: "2-7 business days", multiplier: 1.0 },
  { value: "RUSH_24HR", label: "Rush 24hr", description: "24 hours", multiplier: 1.5 },
  { value: "RUSH_12HR", label: "Super Rush 12hr", description: "12 hours", multiplier: 2.0 },
];

const addonOptions = [
  { value: "BACKGROUND_REMOVAL", label: "Background Removal", price: 500, description: "Remove background for clean vector" },
  { value: "COLOR_CHANGE", label: "Color Adjustment", price: 300, description: "Modify colors in final output" },
  { value: "SIMPLIFICATION", label: "Image Simplification", price: 700, description: "Simplify complex designs" },
  { value: "EXTRA_FORMATS", label: "Extra Formats", price: 500, description: "Additional file formats (DXF, EPS)" },
];

export default function EnhancedGuestOrderForm() {
  const [currentStep, setCurrentStep] = useState<FormStep>("service");
  const [filesWithAnalysis, setFilesWithAnalysis] = useState<FileWithAnalysis[]>([]);
  const [turnaroundTier, setTurnaroundTier] = useState<string>("STANDARD");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [pricingBreakdown, setPricingBreakdown] = useState<any>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
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

  const watchedService = form.watch("service");
  const watchedName = form.watch("guestName");
  const watchedEmail = form.watch("guestEmail");
  const selectedService = services.find((s) => s.value === watchedService);

  useEffect(() => {
    if (filesWithAnalysis.length > 0 && selectedService && currentStep === "options") {
      calculatePricing();
    }
  }, [filesWithAnalysis, turnaroundTier, selectedAddons, selectedService, currentStep]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const newFilesWithAnalysis: FileWithAnalysis[] = files.map((file) => ({
      file,
      isAnalyzing: true,
    }));

    setFilesWithAnalysis((prev) => [...prev, ...newFilesWithAnalysis]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const index = filesWithAnalysis.length + i;

      try {
        if (file.type.startsWith("image/")) {
          const analysis = await analyzeImage(file);
          const estimate = getQuickEstimate(
            analysis,
            selectedService?.value || "IMAGE_TO_VECTOR",
            selectedService?.basePrice || 1500
          );

          setFilesWithAnalysis((prev) =>
            prev.map((item, idx) =>
              idx === index
                ? {
                    ...item,
                    clientAnalysis: analysis,
                    quickEstimate: estimate,
                    isAnalyzing: false,
                  }
                : item
            )
          );
        } else {
          setFilesWithAnalysis((prev) =>
            prev.map((item, idx) =>
              idx === index
                ? {
                    ...item,
                    isAnalyzing: false,
                  }
                : item
            )
          );
        }
      } catch (error) {
        console.error("Error analyzing image:", error);
        setFilesWithAnalysis((prev) =>
          prev.map((item, idx) =>
            idx === index
              ? {
                  ...item,
                  isAnalyzing: false,
                }
              : item
          )
        );
        toast({
          title: "Analysis Warning",
          description: `Could not analyze ${file.name}. Using default pricing.`,
          variant: "default",
        });
      }
    }
  };

  const removeFile = (index: number) => {
    setFilesWithAnalysis((prev) => prev.filter((_, i) => i !== index));
  };

  const calculatePricing = async () => {
    if (!selectedService || filesWithAnalysis.length === 0) return;

    setIsCalculatingPrice(true);

    try {
      const configs = filesWithAnalysis.map((fileItem) => ({
        serviceType: selectedService.value,
        complexityTier: fileItem.clientAnalysis?.complexityTier || "MEDIUM",
        turnaroundTier,
        addons: selectedAddons.map((type) => ({ type })),
      }));

      const response = await apiRequest("POST", "/api/pricing/bulk", { configs });
      const data = await response.json();
      setPricingBreakdown(data.result);
    } catch (error) {
      console.error("Error calculating pricing:", error);
      toast({
        title: "Pricing Error",
        description: "Could not calculate pricing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: GuestOrder) => {
      const response = await apiRequest("POST", "/api/orders/guest", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order submitted successfully!",
        description: "We'll send you a confirmation email shortly.",
      });
      form.reset();
      setFilesWithAnalysis([]);
      setCurrentStep("service");
      setPricingBreakdown(null);
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
    { key: "service", label: "Service", number: 1 },
    { key: "contact", label: "Contact", number: 2 },
    { key: "files", label: "Upload", number: 3 },
    { key: "options", label: "Options", number: 4 },
    { key: "summary", label: "Review", number: 5 },
  ];

  const currentStepIndex = steps.findIndex((step) => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case "service":
        return !!watchedService;
      case "contact":
        return !!(watchedName && watchedEmail);
      case "files":
        return filesWithAnalysis.length > 0;
      case "options":
        return true;
      case "summary":
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const currentIndex = steps.findIndex((step) => step.key === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key as FormStep);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex((step) => step.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key as FormStep);
    }
  };

  const onSubmit = async (data: GuestOrder) => {
    if (currentStep !== "summary") return;

    if (pricingBreakdown) {
      data.priceCents = pricingBreakdown.total;
    }

    createOrderMutation.mutate(data);
  };

  const getComplexityColor = (tier: string) => {
    switch (tier) {
      case "SIMPLE":
        return "green";
      case "MEDIUM":
        return "yellow";
      case "COMPLEX":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <div className="max-w-5xl mx-auto" data-testid="enhanced-guest-order-form">
      <Paper withBorder p="lg" className="mb-8">
        <Box>
          <div className="flex items-center justify-between mb-4">
            <Title order={2}>Create Your Order</Title>
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <Progress value={progress} size="sm" />
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={`flex items-center ${
                  index <= currentStepIndex ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : index === currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStepIndex ? <Check className="h-4 w-4" /> : step.number}
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">{step.label}</span>
              </div>
            ))}
          </div>
        </Box>
      </Paper>

      <Paper withBorder p="xl">
        {currentStep === "service" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Select Your Service</h3>
              <p className="text-muted-foreground mb-6">
                Choose the type of vector conversion you need
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <Paper
                  key={service.value}
                  withBorder
                  p="md"
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    watchedService === service.value ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => form.setValue("service", service.value as any)}
                  data-testid={`service-${service.value}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{service.label}</h4>
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(service.basePrice)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">Base price + complexity</p>
                </Paper>
              ))}
            </div>
          </div>
        )}

        {currentStep === "contact" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Contact Information</h3>
              <p className="text-muted-foreground mb-6">
                We'll use this to send you updates about your order
              </p>
            </div>

            <MantineForm>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MantineFormField
                  name="guestName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextInput
                      label="Full Name *"
                      placeholder="Your full name"
                      error={fieldState.error?.message}
                      data-testid="input-guest-name"
                      {...field}
                    />
                  )}
                />

                <MantineFormField
                  name="guestEmail"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextInput
                      label="Email Address *"
                      type="email"
                      placeholder="your.email@example.com"
                      error={fieldState.error?.message}
                      data-testid="input-guest-email"
                      {...field}
                    />
                  )}
                />

                <MantineFormField
                  name="guestPhone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextInput
                      label="Phone Number"
                      placeholder="(555) 123-4567"
                      error={fieldState.error?.message}
                      data-testid="input-guest-phone"
                      {...field}
                    />
                  )}
                />

                <MantineFormField
                  name="guestCompany"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextInput
                      label="Company (Optional)"
                      placeholder="Your company name"
                      error={fieldState.error?.message}
                      data-testid="input-guest-company"
                      {...field}
                    />
                  )}
                />
              </div>
            </MantineForm>
          </div>
        )}

        {currentStep === "files" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Files</h3>
              <p className="text-muted-foreground mb-6">
                Upload images for analysis and conversion. We'll analyze complexity automatically.
              </p>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-lg font-medium">Click to upload files</span>
                <p className="text-sm text-muted-foreground mt-2">
                  Support formats: JPG, PNG, GIF, PDF, AI, PSD
                </p>
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,.pdf,.ai,.psd"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="file-upload-input"
              />
            </div>

            {filesWithAnalysis.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Uploaded Files with Analysis:</h4>
                {filesWithAnalysis.map((fileItem, index) => (
                  <Paper key={index} withBorder p="md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <FileImage className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{fileItem.file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(fileItem.file.size / 1024).toFixed(2)} KB
                          </p>

                          {fileItem.isAnalyzing && (
                            <div className="flex items-center gap-2 mt-2">
                              <Loader size="xs" />
                              <span className="text-sm text-muted-foreground">Analyzing...</span>
                            </div>
                          )}

                          {fileItem.clientAnalysis && !fileItem.isAnalyzing && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge color={getComplexityColor(fileItem.clientAnalysis.complexityTier)}>
                                  {fileItem.clientAnalysis.complexityTier}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {fileItem.clientAnalysis.width} × {fileItem.clientAnalysis.height}px
                                </span>
                              </div>
                              {fileItem.quickEstimate && (
                                <p className="text-sm font-medium text-primary">
                                  Est: {formatPrice(fileItem.quickEstimate.estimatedPrice)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="subtle"
                        size="sm"
                        color="red"
                        onClick={() => removeFile(index)}
                        data-testid={`remove-file-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Paper>
                ))}
              </div>
            )}

            <MantineFormField
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Textarea
                  label="Special Instructions (Optional)"
                  placeholder="Any special requirements or notes about your order..."
                  rows={4}
                  error={fieldState.error?.message}
                  data-testid="input-notes"
                  {...field}
                  value={field.value || ""}
                />
              )}
            />
          </div>
        )}

        {currentStep === "options" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Service Options</h3>
              <p className="text-muted-foreground mb-6">Customize your order with these options</p>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Turnaround Time
              </h4>
              <Radio.Group value={turnaroundTier} onChange={setTurnaroundTier}>
                <Stack gap="sm">
                  {turnaroundOptions.map((option) => (
                    <Paper key={option.value} withBorder p="md" className={turnaroundTier === option.value ? "ring-2 ring-primary" : ""}>
                      <Radio
                        value={option.value}
                        label={
                          <div className="flex justify-between items-center w-full">
                            <div>
                              <span className="font-medium">{option.label}</span>
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                            </div>
                            <span className="text-sm text-primary font-medium">
                              {option.multiplier === 1 ? "Standard" : `+${(option.multiplier - 1) * 100}%`}
                            </span>
                          </div>
                        }
                        data-testid={`turnaround-${option.value}`}
                      />
                    </Paper>
                  ))}
                </Stack>
              </Radio.Group>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Add-on Services
              </h4>
              <Stack gap="sm">
                {addonOptions.map((addon) => (
                  <Paper key={addon.value} withBorder p="md">
                    <Checkbox
                      checked={selectedAddons.includes(addon.value)}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          setSelectedAddons([...selectedAddons, addon.value]);
                        } else {
                          setSelectedAddons(selectedAddons.filter((a) => a !== addon.value));
                        }
                      }}
                      label={
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <span className="font-medium">{addon.label}</span>
                            <p className="text-sm text-muted-foreground">{addon.description}</p>
                          </div>
                          <span className="text-sm text-primary font-medium ml-4">
                            {formatPrice(addon.price)}
                          </span>
                        </div>
                      }
                      data-testid={`addon-${addon.value}`}
                    />
                  </Paper>
                ))}
              </Stack>
            </div>

            {pricingBreakdown && (
              <Paper withBorder p="md" className="bg-muted/50">
                <h4 className="font-medium mb-3">Price Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({filesWithAnalysis.length} files)</span>
                    <span>{formatPrice(pricingBreakdown.subtotal)}</span>
                  </div>
                  {pricingBreakdown.bulkDiscountPercent > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Bulk Discount ({pricingBreakdown.bulkDiscountPercent}%)</span>
                      <span>-{formatPrice(pricingBreakdown.bulkDiscountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-lg text-primary">{formatPrice(pricingBreakdown.total)}</span>
                  </div>
                </div>
              </Paper>
            )}

            {isCalculatingPrice && (
              <div className="flex items-center justify-center gap-2 p-4">
                <Loader size="sm" />
                <span className="text-sm text-muted-foreground">Calculating pricing...</span>
              </div>
            )}
          </div>
        )}

        {currentStep === "summary" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Review Your Order</h3>
              <p className="text-muted-foreground mb-6">
                Please review your order details before submitting
              </p>
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
                  <p className="text-muted-foreground">{filesWithAnalysis.length} file(s)</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Turnaround</h4>
                  <p className="text-muted-foreground">
                    {turnaroundOptions.find((o) => o.value === turnaroundTier)?.label}
                  </p>
                </div>

                {selectedAddons.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Add-ons</h4>
                    {selectedAddons.map((addon) => (
                      <p key={addon} className="text-muted-foreground">
                        {addonOptions.find((a) => a.value === addon)?.label}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {pricingBreakdown && (
                <Paper withBorder p="md">
                  <h4 className="font-medium mb-4">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(pricingBreakdown.subtotal)}</span>
                    </div>
                    {pricingBreakdown.bulkDiscountPercent > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Bulk Discount ({pricingBreakdown.bulkDiscountPercent}%)</span>
                        <span>-{formatPrice(pricingBreakdown.bulkDiscountAmount)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(pricingBreakdown.total)}</span>
                      </div>
                    </div>
                  </div>
                </Paper>
              )}
            </div>
          </div>
        )}
      </Paper>

      <div className="flex justify-between mt-8">
        {currentStep !== "service" ? (
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            data-testid="button-previous"
          >
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
            type="button"
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={!canProceed() || createOrderMutation.isPending}
            color="green"
            data-testid="button-submit-order"
          >
            <Zap className="mr-2 h-4 w-4" />
            {createOrderMutation.isPending ? "Submitting..." : "Submit Order"}
          </Button>
        )}
      </div>
    </div>
  );
}
