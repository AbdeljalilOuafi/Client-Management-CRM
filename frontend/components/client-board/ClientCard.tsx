import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Client {
  id: string;
  name: string;
  packageName: string;
  monthColumn: number; // 1-12, 13 for 12+
  lastCheckinDays: number;
  adherence: number;
  pendingCheckin?: boolean;
  pendingReview?: boolean;
  onboarding?: boolean;
  onboardingSentDays?: number;
}

interface ClientCardProps {
  client: Client;
  index: number;
  isActionQueue?: boolean;
  onCardClick: (client: Client) => void;
  onMarkReviewed?: (id: string) => void;
}

export const ClientCard = ({ client, index, isActionQueue, onCardClick, onMarkReviewed }: ClientCardProps) => {
  const getStatusColor = (adherence: number) => {
    if (adherence >= 80) return "border-l-green-500";
    if (adherence >= 60) return "border-l-yellow-500";
    return "border-l-red-500";
  };

  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 80) return "text-green-600";
    if (adherence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const hasPendingAction = client.pendingCheckin || client.pendingReview;

  return (
    <Draggable draggableId={client.id} index={index} isDragDisabled={isActionQueue}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Card
            className={cn(
              "w-[170px] p-3 cursor-pointer transition-all duration-200 border-l-4 group relative overflow-hidden",
              getStatusColor(client.adherence),
              hasPendingAction && !isActionQueue && "ring-2 ring-primary/50 shadow-lg",
              isActionQueue && "animate-pulse shadow-md bg-gradient-to-br from-card to-primary/5",
              snapshot.isDragging && "shadow-2xl ring-2 ring-primary rotate-2 scale-105",
              !snapshot.isDragging && "hover:shadow-xl hover:-translate-y-1"
            )}
            onClick={() => onCardClick(client)}
          >
            {/* Drag indicator */}
            {!isActionQueue && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}

            <div className="space-y-2">
              <div>
                <p className="font-bold text-sm leading-tight pr-6">{client.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{client.packageName}</p>
              </div>

              {!client.onboarding && (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    <span>Last check-in: {client.lastCheckinDays}d ago</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">Adherence</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs font-bold px-2 py-0.5",
                        getAdherenceColor(client.adherence)
                      )}
                    >
                      {client.adherence}%
                    </Badge>
                  </div>
                </>
              )}

              {client.onboarding && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    Onboarding
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {client.onboardingSentDays}d ago
                  </span>
                </div>
              )}

              {/* Badges for pending actions */}
              {(client.pendingCheckin || client.pendingReview) && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {client.pendingCheckin && (
                    <Badge className="text-[10px] px-2 py-1 bg-orange-500 hover:bg-orange-600">
                      ⚡ Check-in
                    </Badge>
                  )}
                  {client.pendingReview && (
                    <Badge className="text-[10px] px-2 py-1 bg-blue-500 hover:bg-blue-600">
                      📋 Review
                    </Badge>
                  )}
                </div>
              )}

              {/* Show home month indicator in action queue */}
              {isActionQueue && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1">
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-medium">Month {client.monthColumn === 13 ? "12+" : client.monthColumn}</span>
                </div>
              )}

              {/* Mark as reviewed button in action queue */}
              {isActionQueue && onMarkReviewed && (
                <Button
                  size="sm"
                  className="w-full h-7 text-xs bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkReviewed(client.id);
                  }}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark Done
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </Draggable>
  );
};
