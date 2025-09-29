import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import PayPalButton from "./PayPalButton";

interface PayPalWrapperProps {
  amount: string;
  currency: string;
  intent: string;
}

export default function PayPalWrapper({ amount, currency, intent }: PayPalWrapperProps) {
  const [paypalAvailable, setPaypalAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPayPalAvailability = async () => {
      try {
        const response = await fetch("/setup");
        if (response.ok) {
          const data = await response.json();
          setPaypalAvailable(!!data.clientToken);
        } else {
          console.warn("PayPal setup failed:", response.status);
          setPaypalAvailable(false);
        }
      } catch (error) {
        console.warn("PayPal availability check failed:", error);
        setPaypalAvailable(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPayPalAvailability();
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-muted-foreground">Initializing payment options...</div>
      </div>
    );
  }

  if (paypalAvailable === false) {
    return (
      <Alert data-testid="paypal-unavailable">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          PayPal payment is currently unavailable. Please contact support for alternative payment options.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div data-testid="paypal-available">
      <PayPalButton amount={amount} currency={currency} intent={intent} />
    </div>
  );
}