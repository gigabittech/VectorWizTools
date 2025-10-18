import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type ProcessingStatus = "idle" | "processing" | "success" | "error";

interface ProcessingIndicatorProps {
  status: ProcessingStatus;
  progress?: number;
  message?: string;
  successMessage?: string;
  errorMessage?: string;
}

export default function ProcessingIndicator({
  status,
  progress = 0,
  message = "Processing...",
  successMessage = "Complete!",
  errorMessage = "An error occurred",
}: ProcessingIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <Card className="p-6" data-testid="processing-indicator">
      <div className="flex flex-col items-center text-center space-y-4">
        {status === "processing" && (
          <>
            <Loader2 className="h-12 w-12 text-[#0B9F47] animate-spin" data-testid="processing-spinner" />
            <div className="w-full space-y-2">
              <p className="text-lg font-medium" data-testid="processing-message">
                {message}
              </p>
              {progress > 0 && (
                <div className="space-y-1">
                  <Progress value={progress} className="w-full" data-testid="progress-bar" />
                  <p className="text-sm text-gray-500">{Math.round(progress)}%</p>
                </div>
              )}
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" data-testid="success-icon" />
            </div>
            <p className="text-lg font-medium text-green-600" data-testid="success-message">
              {successMessage}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" data-testid="error-icon" />
            </div>
            <p className="text-lg font-medium text-red-600" data-testid="error-message">
              {errorMessage}
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

interface SimpleSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function SimpleSpinner({ message = "Loading...", size = "md" }: SimpleSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3" data-testid="simple-spinner">
      <Loader2 className={`${sizeClasses[size]} text-[#0B9F47] animate-spin`} />
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}
