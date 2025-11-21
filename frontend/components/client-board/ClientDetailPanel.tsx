import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Client } from "./ClientCard";
import { Calendar, TrendingUp, MessageSquare, FileText, Mail, Phone, Package, Clock, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold">{client.name}</SheetTitle>
            <SheetDescription className="flex items-center gap-2 mt-2">
              <Package className="h-4 w-4" />
              {client.packageName}
            </SheetDescription>
          </SheetHeader>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="space-y-6 p-6">
            {/* Client Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              {!client.onboarding && (
                <>
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                      <Calendar className="h-4 w-4" />
                      <p className="text-xs font-medium">Month</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {client.monthColumn === 13 ? "12+" : client.monthColumn}
                    </p>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                      <Clock className="h-4 w-4" />
                      <p className="text-xs font-medium">Last Check-in</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {client.lastCheckinDays}d
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">ago</p>
                  </Card>
                </>
              )}

              {client.onboarding && (
                <Card className="col-span-2 p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                    <Activity className="h-4 w-4" />
                    <p className="text-xs font-medium">Onboarding Status</p>
                  </div>
                  <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                    Form sent {client.onboardingSentDays} days ago
                  </p>
                </Card>
              )}
            </div>

            {/* Adherence Progress */}
            {!client.onboarding && (
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Adherence Rate</p>
                    </div>
                    <span className={cn("text-2xl font-bold", getAdherenceColor(client.adherence))}>
                      {client.adherence}%
                    </span>
                  </div>
                  <Progress value={client.adherence} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {client.adherence >= 80 ? "Excellent progress! 🎉" : 
                     client.adherence >= 60 ? "Good progress, keep it up! 💪" : 
                     "Needs attention 🔔"}
                  </p>
                </div>
              </Card>
            )}

            {/* Pending Actions */}
            {(client.pendingCheckin || client.pendingReview) && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-4 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-900 dark:text-orange-100">
                    <Clock className="h-4 w-4" />
                    Pending Actions
                  </h3>
                  <div className="space-y-2">
                    {client.pendingCheckin && (
                      <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                          <span className="text-sm font-medium">Weekly check-in</span>
                        </div>
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">Review</Button>
                      </div>
                    )}
                    {client.pendingReview && (
                      <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-sm font-medium">Monthly review</span>
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Review</Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            <Separator />

            {/* Quick Actions */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-primary/10 hover:border-primary">
                  <MessageSquare className="h-4 w-4" />
                  Add Note
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-primary/10 hover:border-primary">
                  <FileText className="h-4 w-4" />
                  View Forms
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-primary/10 hover:border-primary">
                  <Calendar className="h-4 w-4" />
                  Schedule Call
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-primary/10 hover:border-primary">
                  <TrendingUp className="h-4 w-4" />
                  View Progress
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-primary/10 hover:border-primary">
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-primary/10 hover:border-primary">
                  <Phone className="h-4 w-4" />
                  Call Client
                </Button>
              </div>
            </div>

            <Separator />

            {/* Activity Feed */}
            {!client.onboarding && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="p-3 hover:shadow-md transition-shadow">
                        <div className="flex gap-3">
                          <div className={cn(
                            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                            activity.type === "checkin" && "bg-green-100 dark:bg-green-900/30",
                            activity.type === "note" && "bg-blue-100 dark:bg-blue-900/30",
                            activity.type === "review" && "bg-purple-100 dark:bg-purple-900/30"
                          )}>
                            {activity.type === "checkin" && <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />}
                            {activity.type === "note" && <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                            {activity.type === "review" && <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{activity.content}</p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {activity.date}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
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
