import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import GuestOrderForm from "@/components/orders/GuestOrderForm";

export default function NewOrder() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="new-order-page">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="back-to-home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h1 className="text-3xl font-bold mb-4">Create New Order</h1>
            <p className="text-muted-foreground">
              Transform your images into perfect vectors with our professional conversion service. 
              Fill out the form below to get started.
            </p>
          </div>
        </div>

        <GuestOrderForm />
      </main>
    </div>
  );
}
