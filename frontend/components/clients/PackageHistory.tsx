import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, Package } from "lucide-react";
import { getClientPackageHistory, PackageHistoryItem } from "@/lib/api/package-history";

interface PackageHistoryProps {
  clientId: number;
  isOpen: boolean;
}

export function PackageHistory({ clientId, isOpen }: PackageHistoryProps) {
  const [history, setHistory] = useState<PackageHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Fetch history when opened for the first time
  useEffect(() => {
    if (isOpen && !loaded) {
      setLoading(true);
      getClientPackageHistory(clientId)
        .then((data: PackageHistoryItem[]) => {
          setHistory(data);
          setLoaded(true);
        })
        .catch((error: Error) => {
          console.error("Failed to fetch package history:", error);
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
                <h5 className="font-semibold text-foreground">{item.package_name}</h5>
              </div>
              <Badge
                variant={item.status === "completed" ? "secondary" : "default"}
                className="text-xs"
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">Payment:</Label>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {item.currency} ${item.payment_amount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Method:</Label>
                <span className="font-medium">{item.payment_method}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">Start:</Label>
                <span className="font-medium">
                  {new Date(item.start_date).toLocaleDateString()}
                </span>
              </div>

              {item.end_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs text-muted-foreground">End:</Label>
                  <span className="font-medium">
                    {new Date(item.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
