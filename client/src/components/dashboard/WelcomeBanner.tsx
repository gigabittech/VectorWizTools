import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Wrench } from "lucide-react";

export default function WelcomeBanner() {
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="mb-8" data-testid="welcome-banner">
      <div className="gradient-secondary rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2" data-testid="welcome-title">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-slate-300 mb-6">
            Ready to transform your images into perfect vectors? Let's get started with your next project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/order/new">
              <Button className="gradient-primary hover:opacity-90 text-white" data-testid="new-order-button">
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </Link>
            <Link href="/tools">
              <Button 
                variant="secondary" 
                className="bg-white/10 hover:bg-white/20 backdrop-blur text-white border-white/20"
                data-testid="use-tools-button"
              >
                <Wrench className="mr-2 h-4 w-4" />
                Use Tools
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
      </div>
    </div>
  );
}
