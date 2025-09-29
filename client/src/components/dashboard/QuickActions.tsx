import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calculator, Clock, Search } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      href: "/order/new",
      icon: Plus,
      title: "Start New Order",
      description: "Upload files & get started",
      bgColor: "gradient-primary",
      iconColor: "text-white",
    },
    {
      href: "/tools/dpi-calculator",
      icon: Calculator,
      title: "DPI Calculator",
      description: "Check image resolution",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      href: "/tools/turnaround-estimator",
      icon: Clock,
      title: "Turnaround Time",
      description: "Estimate delivery",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      href: "/tools/vector-checker",
      icon: Search,
      title: "Vector Checker",
      description: "Verify file format",
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <Card className="shadow-sm" data-testid="quick-actions">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="space-y-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-3 h-auto bg-muted/30 hover:bg-muted/50"
                  data-testid={`action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${action.iconColor}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
