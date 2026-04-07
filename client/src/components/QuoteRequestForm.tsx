import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { insertQuoteRequestSchema, type InsertQuoteRequest } from "@shared/schema";
import { prefixUrl } from "@/lib/queryClient";
import { Send, CheckCircle, UploadCloud, FileText, Trash2, Loader, User, Mail } from "lucide-react";
import { Text } from "@mantine/core";

interface QuoteRequestFormProps {
  theme?: "light" | "dark";
  primaryColor?: string;
  hiddenFields?: string[];
  isEmbedded?: boolean;
  padding?: string | number;
  margin?: string | number;
  radius?: string | number;
}

export default function QuoteRequestForm({ 
  theme = "dark", 
  primaryColor = "#0B9F47", 
  hiddenFields = [],
  isEmbedded = false,
  padding = 32,
  margin = 0,
  radius = 12
}: QuoteRequestFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const isLight = theme === "light";
  
  const textColor = isLight ? "text-slate-900" : "text-white";
  const mutedTextColor = isLight ? "text-slate-500" : "text-gray-200";
  const bgColor = isLight ? "bg-white" : "bg-transparent";
  const inputBg = isLight ? "bg-slate-50" : "bg-white/5";
  const inputBorder = isLight ? "border-slate-200" : "border-white/10";
  const inputFocusBg = isLight ? "focus:bg-white" : "focus:bg-white/10";
  const cardBg = isLight ? "bg-slate-50/50 border-slate-100" : "backdrop-blur-md bg-white/10 border-white/20";

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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Use absolute URL if embedded and an API URL is provided, otherwise relative with prefixUrl (BASE_PATH)
      const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
      const endpoint = isEmbedded && apiBase
        ? `${apiBase}${prefixUrl("/api/quote-requests")}`
        : prefixUrl("/api/quote-requests");

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit request");
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      form.reset();
      setFiles([]);
      toast({
        title: "Quote Request Submitted",
        description: "We've received your request and your files correctly!",
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
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    files.forEach((file) => {
      formData.append("files", file);
    });

    submitMutation.mutate(formData);
  };

  if (isSubmitted) {
    return (
      <div 
        className="max-w-2xl mx-auto text-center" 
        data-testid="quote-success"
        style={{ padding: `${padding}px`, margin: `${margin}px` }}
      >
        <div className={`${cardBg} p-8`} style={{ borderRadius: `${radius}px` }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${primaryColor}20`, border: `1px solid ${primaryColor}40` }}>
            <CheckCircle className="h-8 w-8" style={{ color: primaryColor }} />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Thank You!</h2>
          <p className={`${mutedTextColor} mb-6`}>
            Your quote request has been submitted successfully. We'll review your project and get back to you within 24 hours.
          </p>
          <Button
            onClick={() => setIsSubmitted(false)}
            style={{ backgroundColor: primaryColor }}
            className="text-white shadow-lg hover:shadow-xl transition-all"
            data-testid="button-submit-another"
          >
            Submit Another Request
          </Button>
        </div>
      </div>
    );
  }

  const isHidden = (fieldName: string) => hiddenFields.includes(fieldName);

  return (
    <div 
      className={`w-full mx-auto ${isEmbedded ? 'px-2' : 'px-4 sm:px-6 md:px-8'}`} 
      data-testid="quote-request-form"
      style={{ padding: `${padding}px`, margin: `${margin}px`, borderRadius: `${radius}px` }}
    >
      {!isHidden('title') && (
        <div className="mb-6 text-center">
          <h2 className={`text-3xl font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'} leading-tight`}>
            Request a Vector Conversion Quote <br className="hidden md:block" /> (Upload Your Files)
          </h2>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className={`${isLight ? 'text-slate-700' : 'text-white'} font-medium flex items-center gap-2`}>
              <User size={14} style={{ color: primaryColor }} /> First Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="firstName"
              data-testid="input-first-name"
              {...form.register("firstName")}
              placeholder="John"
              className={`backdrop-blur-md ${inputBg} ${inputBorder} ${isLight ? 'text-slate-900' : 'text-white'} placeholder:${isLight ? 'text-slate-400' : 'text-white/30'} ${inputFocusBg} focus:border-[${primaryColor}]/50 transition-all h-12`}
            />
            {form.formState.errors.firstName && (
              <p className="text-xs text-red-400 italic">{form.formState.errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className={`${isLight ? 'text-slate-700' : 'text-white'} font-medium flex items-center gap-2`}>
              <User size={14} style={{ color: primaryColor }} /> Last Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="lastName"
              data-testid="input-last-name"
              {...form.register("lastName")}
              placeholder="Doe"
              className={`backdrop-blur-md ${inputBg} ${inputBorder} ${isLight ? 'text-slate-900' : 'text-white'} placeholder:${isLight ? 'text-slate-400' : 'text-white/30'} ${inputFocusBg} focus:border-[${primaryColor}]/50 transition-all h-12`}
            />
            {form.formState.errors.lastName && (
              <p className="text-xs text-red-400 italic">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className={`${isLight ? 'text-slate-700' : 'text-white'} font-medium flex items-center gap-2`}>
            <Mail size={14} style={{ color: primaryColor }} /> Email Address <span className="text-red-400">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            data-testid="input-email"
            {...form.register("email")}
            placeholder="john.doe@example.com"
            className={`backdrop-blur-md ${inputBg} ${inputBorder} ${isLight ? 'text-slate-900' : 'text-white'} placeholder:${isLight ? 'text-slate-400' : 'text-white/30'} ${inputFocusBg} focus:border-[${primaryColor}]/50 transition-all h-12`}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-400 italic">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectDetails" className={`${isLight ? 'text-slate-700' : 'text-white'} font-medium flex items-center gap-2`}>
            <FileText size={14} style={{ color: primaryColor }} /> Project Details <span className="text-red-400">*</span>
          </Label>
          <Textarea
            id="projectDetails"
            data-testid="input-project-details"
            {...form.register("projectDetails")}
            placeholder="Describe your design, specific requirements, or specific formats needed..."
            rows={4}
            className={`backdrop-blur-md ${inputBg} ${inputBorder} ${isLight ? 'text-slate-900' : 'text-white'} placeholder:${isLight ? 'text-slate-400' : 'text-white/30'} ${inputFocusBg} focus:border-[${primaryColor}]/50 transition-all resize-none p-4`}
          />
          {form.formState.errors.projectDetails && (
            <p className="text-xs text-red-400 italic">{form.formState.errors.projectDetails.message}</p>
          )}
        </div>

        {!isHidden('fileUpload') && (
          <div className="space-y-3">
            <Label className={`${isLight ? 'text-slate-700' : 'text-white'} font-medium flex items-center justify-between`}>
              <span>Upload Files (Logos, Images, etc)</span>
              <span className="text-xs text-gray-400">JPG, PNG, PDF, AI, EPS, ZIP allowed</span>
            </Label>
            
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative group cursor-pointer transition-all duration-300 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 ${
                isDragging 
                  ? `border-[${primaryColor}] bg-[${primaryColor}]/10` 
                  : `${inputBorder} ${inputBg} hover:border-white/20 hover:bg-white/8`
              }`}
              style={isDragging ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
            >
              <input 
                type="file" 
                multiple 
                onChange={onFileChange}
                id="file-upload"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".jpg,.jpeg,.png,.pdf,.ai,.eps,.zip,.svg"
              />
              
              <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-opacity-20' : 'bg-white/5 text-gray-400 group-hover:text-white'}`} style={isDragging ? { backgroundColor: `${primaryColor}33`, color: primaryColor } : {}}>
                <UploadCloud size={32} />
              </div>
              
              <div className="text-center">
                <Text fw={600} className={isLight ? 'text-slate-900' : 'text-white'}>Drag & Drop or Click to Choose</Text>
                <Text size="xs" c="dimmed" mt={2}>Max file size: 20MB. Multiple files supported.</Text>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {files.map((file, idx) => (
                  <div key={idx} className={`flex items-center justify-between ${inputBg} backdrop-blur-sm ${inputBorder} rounded-lg p-3 group transition-all`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded text-gray-400">
                        <FileText size={16} />
                      </div>
                      <div>
                        <Text size="xs" fw={600} className={isLight ? 'text-slate-900' : 'text-white'} lineClamp={1}>{file.name}</Text>
                        <Text size="10px" c="dimmed">{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isHidden('numberOfFiles') && (
            <div className="space-y-2">
              <Label htmlFor="numberOfFiles" className={`${isLight ? 'text-slate-700' : 'text-white'} font-medium`}>Number of Files / Images (Optional)</Label>
              <Input
                id="numberOfFiles"
                data-testid="input-number-of-files"
                {...form.register("numberOfFiles")}
                placeholder="e.g. 5 logos"
                className={`backdrop-blur-md ${inputBg} ${inputBorder} ${isLight ? 'text-slate-900' : 'text-white'} placeholder:${isLight ? 'text-slate-400' : 'text-white/30'} ${inputFocusBg} focus:border-[${primaryColor}]/50 transition-all h-11`}
              />
            </div>
          )}

          {!isHidden('turnaroundTime') && (
            <div className="space-y-2">
              <Label htmlFor="turnaroundTime" className={`${isLight ? 'text-slate-700' : 'text-white'} font-medium`}>Urgency / Turnaround Time (Optional)</Label>
              <Input
                id="turnaroundTime"
                data-testid="input-turnaround-time"
                {...form.register("turnaroundTime")}
                placeholder="e.g. 24h Rush"
                className={`backdrop-blur-md ${inputBg} ${inputBorder} ${isLight ? 'text-slate-900' : 'text-white'} placeholder:${isLight ? 'text-slate-400' : 'text-white/30'} ${inputFocusBg} focus:border-[${primaryColor}]/50 transition-all h-11`}
              />
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={submitMutation.isPending}
          style={{ backgroundColor: primaryColor }}
          className="w-full text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01] h-14 font-bold text-lg rounded-xl mt-4"
          size="lg"
          data-testid="button-submit-quote"
        >
          {submitMutation.isPending ? (
            <div className="flex items-center gap-2">
              <Loader className="animate-spin h-5 w-5" />
              <span>Sending Order Details...</span>
            </div>
          ) : (
            <>
              Request My Quote
              <Send className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
