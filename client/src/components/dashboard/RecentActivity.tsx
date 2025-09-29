import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import type { Activity } from "@shared/schema";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "order" | "payment" | "file";
}

export default function RecentActivity() {
  const { data: activitiesResponse, isLoading } = useQuery<{ activities: Activity[] }>({
    queryKey: ["/api/admin/activities"],
    select: (data: any) => data || { activities: [] },
  });

  const activities = activitiesResponse?.activities || [];

  const mapActivityToItem = (activity: Activity): ActivityItem => {
    let type: ActivityItem["type"] = "order";
    
    switch (activity.type) {
      case "PAYMENT_PROCESSED":
        type = "payment";
        break;
      case "FILE_UPLOADED":
      case "PROOF_UPLOADED":
        type = "file";
        break;
      default:
        type = "order";
    }

    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      time: formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }),
      type,
    };
  };

  const activityItems = activities.map(mapActivityToItem);

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
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-muted rounded-full mt-2 animate-pulse" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : activityItems.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            activityItems.map((activity) => (
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
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
