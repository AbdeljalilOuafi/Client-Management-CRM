import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusChangeScheduleCardProps {
  onStatusChangeSelect: (type: "stop" | "pause" | "package_change") => void;
}

export function StatusChangeScheduleCard({ onStatusChangeSelect }: StatusChangeScheduleCardProps) {
  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800 hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardHeader className="bg-amber-100/50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
          Client Status Change Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Label className="text-sm font-medium text-muted-foreground">Schedule a status change for this client</Label>
          <Select onValueChange={(value) => onStatusChangeSelect(value as "stop" | "pause" | "package_change")}>
            <SelectTrigger className="bg-background hover:border-amber-500 transition-all focus:ring-2 focus:ring-amber-500/20 h-11">
              <SelectValue placeholder="Select status change type..." />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="stop" className="hover:bg-red-50 dark:hover:bg-red-950/30">
                🛑 Stop Client
              </SelectItem>
              <SelectItem value="pause" className="hover:bg-yellow-50 dark:hover:bg-yellow-950/30">
                ⏸️ Pause Client
              </SelectItem>
              <SelectItem value="package_change" className="hover:bg-blue-50 dark:hover:bg-blue-950/30">
                📦 Package Change
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
