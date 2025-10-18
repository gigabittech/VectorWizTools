import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertQuoteRequestSchema, type InsertQuoteRequest } from "@shared/schema";
import { Send, CheckCircle } from "lucide-react";

export default function QuoteRequestForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertQuoteRequest>({
    resolver: zodResolver(insertQuoteRequestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      projectDetails: "",
      numberOfFiles: "",
      turnaroundTime: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertQuoteRequest) => {
      const response = await apiRequest("POST", "/api/quote-requests", data);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      form.reset();
      toast({
        title: "Quote Request Submitted",
        description: "We've received your request and will get back to you soon!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertQuoteRequest) => {
    submitMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center" data-testid="quote-success">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
        <p className="text-muted-foreground mb-6">
          Your quote request has been submitted successfully. We'll review your project and get back to you within 24 hours.
        </p>
        <Button
          onClick={() => setIsSubmitted(false)}
          className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
          data-testid="button-submit-another"
        >
          Submit Another Request
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6" data-testid="quote-request-form">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Request a Quote</h2>
        <p className="text-muted-foreground">
          Fill out the form below and we'll get back to you with a custom quote for your project.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              data-testid="input-first-name"
              {...form.register("firstName")}
              placeholder="John"
            />
            {form.formState.errors.firstName && (
              <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              data-testid="input-last-name"
              {...form.register("lastName")}
              placeholder="Doe"
            />
            {form.formState.errors.lastName && (
              <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            data-testid="input-email"
            {...form.register("email")}
            placeholder="john.doe@example.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectDetails">
            Project Details & Notes <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="projectDetails"
            data-testid="input-project-details"
            {...form.register("projectDetails")}
            placeholder="Please describe your project, what you need vectorized, any specific requirements, etc."
            rows={5}
          />
          {form.formState.errors.projectDetails && (
            <p className="text-sm text-red-500">{form.formState.errors.projectDetails.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numberOfFiles">Number of Files/Images (Optional)</Label>
            <Input
              id="numberOfFiles"
              data-testid="input-number-of-files"
              {...form.register("numberOfFiles")}
              placeholder="e.g., 5 images"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="turnaroundTime">Turnaround Time (Optional)</Label>
            <Input
              id="turnaroundTime"
              data-testid="input-turnaround-time"
              {...form.register("turnaroundTime")}
              placeholder="e.g., 2-3 days, Rush 24hr"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>File Uploads (Optional)</Label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              After submitting this form, we'll send you an email with instructions for uploading your files securely.
            </p>
            <p className="text-xs text-muted-foreground">
              Or mention in the project details if you'll send files via email.
            </p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitMutation.isPending}
          className="w-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white"
          size="lg"
          data-testid="button-submit-quote"
        >
          {submitMutation.isPending ? (
            "Submitting..."
          ) : (
            <>
              Submit Quote Request
              <Send className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
