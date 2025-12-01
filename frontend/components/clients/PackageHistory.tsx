import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Package } from "lucide-react";
import { listClientPackages, ClientPackage } from "@/lib/api/client-packages";

interface PackageHistoryProps {
  clientId: number;
  isOpen: boolean;
}

export function PackageHistory({ clientId, isOpen }: PackageHistoryProps) {
  const [history, setHistory] = useState<ClientPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Fetch history when opened for the first time
  useEffect(() => {
    if (isOpen && !loaded) {
      setLoading(true);
      listClientPackages({ client: clientId })
        .then((data: ClientPackage[]) => {
          // Sort by created_at descending (newest first), with pending first
          const sorted = data.sort((a, b) => {
            // Pending packages first
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            // Then by created_at (newest first)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          setHistory(sorted);
          setLoaded(true);
        })
        .catch((error: Error) => {
          console.error("Failed to fetch package history:", error);
          setHistory([]);
          setLoaded(true);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, loaded, clientId]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Package History</h4>
        {[1, 2].map((i) => (
          <div key={i} className="p-4 bg-muted/30 rounded-lg space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Package History</h4>
        <div className="p-8 text-center bg-muted/20 rounded-lg border border-dashed">
          <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No package history available</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-muted-foreground mb-3">Package History</h4>
      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-border/50 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <h5 className="font-semibold text-foreground">{item.package_name || "Unknown Package"}</h5>
              </div>
              <Badge
                variant={item.status === "active" ? "default" : item.status === "pending" ? "secondary" : "outline"}
                className={`text-xs ${
                  item.status === "active" 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                    : item.status === "pending" 
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" 
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                }`}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {item.start_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs text-muted-foreground">Start:</Label>
                  <span className="font-medium">
                    {new Date(item.start_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {item.end_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs text-muted-foreground">End:</Label>
                  <span className="font-medium">
                    {new Date(item.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Created:</Label>
                <span className="font-medium">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Updated:</Label>
                <span className="font-medium">
                  {new Date(item.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
