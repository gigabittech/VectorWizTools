import { Card, CardContent } from "@/components/ui/card";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "order" | "payment" | "file";
}

export default function RecentActivity() {
  // Mock data - in real app this would come from API
  const activities: ActivityItem[] = [
    {
      id: "1",
      title: "Order VW-2024-001 updated",
      description: "Proof uploaded for review",
      time: "2 hours ago",
      type: "order",
    },
    {
      id: "2", 
      title: "Order VW-2024-002 completed",
      description: "Files ready for download",
      time: "1 day ago",
      type: "order",
    },
    {
      id: "3",
      title: "Payment processed",
      description: "Invoice #INV-001 paid",
      time: "2 days ago",
      type: "payment",
    },
  ];

  const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "order":
        return "bg-primary";
      case "payment":
        return "bg-blue-500";
      case "file":
        return "bg-emerald-500";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card className="shadow-sm" data-testid="recent-activity">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3" data-testid={`activity-${activity.id}`}>
              <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full mt-2 flex-shrink-0`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium" data-testid={`activity-title-${activity.id}`}>
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground" data-testid={`activity-description-${activity.id}`}>
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground" data-testid={`activity-time-${activity.id}`}>
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
