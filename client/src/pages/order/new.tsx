import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/Navigation";
import OrderWizard from "@/components/orders/OrderWizard";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NewOrder() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showWizard, setShowWizard] = useState(false);

  // Page is publicly accessible - no authentication check needed

  // Auto-open wizard when page loads (works for both authenticated and guest users)
  useEffect(() => {
    setShowWizard(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold">V</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Page works for both authenticated and guest users

  const handleWizardClose = () => {
    setShowWizard(false);
    // For authenticated users, go to orders page. For guests, stay on current page
    if (user) {
      setLocation("/orders");
    }
    // For non-authenticated users, just close the wizard and stay on the page
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="new-order-page">
        <div className="mb-8">
          {user ? (
            <Link href="/orders">
              <Button variant="ghost" className="mb-4" data-testid="back-to-orders">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>
            </Link>
          ) : (
            <Link href="/">
              <Button variant="ghost" className="mb-4" data-testid="back-to-home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          )}
          
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Create New Order</h1>
            <p className="text-muted-foreground mb-8">
              Transform your images into perfect vectors with our professional conversion service. 
              Our wizard will guide you through the process step by step.
            </p>
            
            {!showWizard && (
              <Button 
                onClick={() => setShowWizard(true)} 
                className="gradient-primary text-lg px-8 py-3"
                data-testid="start-order-wizard"
              >
                <Plus className="mr-2 h-5 w-5" />
                Start Order Wizard
              </Button>
            )}
          </div>
        </div>

        <OrderWizard open={showWizard} onClose={handleWizardClose} />
      </main>
    </div>
  );
}
