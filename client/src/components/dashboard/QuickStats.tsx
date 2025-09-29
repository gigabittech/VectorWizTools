import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Check, FileText, DollarSign } from "lucide-react";

interface StatsData {
  activeOrders: number;
  completed: number;
  files: number;
  totalSpent: number;
}

export default function QuickStats() {
  const { data: stats } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
    initialData: {
      activeOrders: 0,
      completed: 0,
      files: 0,
      totalSpent: 0,
    },
  });

  const statCards = [
    {
      title: "Active Orders",
      value: stats.activeOrders,
      change: "+2",
      period: "this week",
      icon: ShoppingBag,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Completed",
      value: stats.completed,
      change: "+4",
      period: "this month",
      icon: Check,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Files Uploaded",
      value: stats.files,
      change: "+12",
      period: "this week",
      icon: FileText,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Spent",
      value: `$${stats.totalSpent.toLocaleString()}`,
      change: "+$380",
      period: "this month",
      icon: DollarSign,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="quick-stats">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="shadow-sm" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground" data-testid={`stat-value-${index}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={stat.iconColor}>{stat.change}</span>
                <span className="text-muted-foreground ml-1">{stat.period}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
