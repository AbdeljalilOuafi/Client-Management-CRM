import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Client } from "./ClientCard";
import { Calendar, TrendingUp, MessageSquare, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientDetailPanelProps {
  client: Client;
  onClose: () => void;
}

export const ClientDetailPanel = ({ client, onClose }: ClientDetailPanelProps) => {
  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 80) return "text-green-600";
    if (adherence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Mock activity data
  const activities = [
    { type: "checkin", date: "2 days ago", content: "Weekly check-in submitted - Weight: 165 lbs" },
    { type: "note", date: "5 days ago", content: "Coach note: Great progress on nutrition goals" },
    { type: "review", date: "7 days ago", content: "Monthly review completed - All metrics on track" },
    { type: "checkin", date: "9 days ago", content: "Weekly check-in submitted - Weight: 167 lbs" },
  ];

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-2xl">{client.name}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-6">
          <div className="space-y-6 pr-4">
            {/* Client Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Package</p>
                <Badge variant="secondary">{client.packageName}</Badge>
              </div>
              
              {!client.onboarding && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Month</p>
                    <span className="font-semibold">
                      {client.monthColumn === 13 ? "12+" : client.monthColumn}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Last Check-in</p>
                    <span>{client.lastCheckinDays} days ago</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Adherence</p>
                    <span className={cn("font-bold", getAdherenceColor(client.adherence))}>
                      {client.adherence}%
                    </span>
                  </div>
                </>
              )}

              {client.onboarding && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Onboarding Status</p>
                  <Badge variant="outline">Form sent {client.onboardingSentDays}d ago</Badge>
                </div>
              )}
            </div>

            {/* Pending Actions */}
            {(client.pendingCheckin || client.pendingReview) && (
              <div className="border rounded-lg p-4 bg-primary/5">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Pending Actions
                </h3>
                <div className="space-y-2">
                  {client.pendingCheckin && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weekly check-in</span>
                      <Button size="sm">Review</Button>
                    </div>
                  )}
                  {client.pendingReview && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly review</span>
                      <Button size="sm">Review</Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Add Note
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  View Forms
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule Call
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <TrendingUp className="h-4 w-4" />
                  View Progress
                </Button>
              </div>
            </div>

            {/* Activity Feed */}
            {!client.onboarding && (
              <div>
                <h3 className="font-semibold mb-3">Recent Activity</h3>
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {activity.type === "checkin" && <TrendingUp className="h-4 w-4 text-primary" />}
                        {activity.type === "note" && <MessageSquare className="h-4 w-4 text-primary" />}
                        {activity.type === "review" && <FileText className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
