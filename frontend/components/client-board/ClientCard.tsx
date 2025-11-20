import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
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
              "w-[150px] p-3 cursor-pointer hover:shadow-lg transition-all border-l-4",
              getStatusColor(client.adherence),
              hasPendingAction && !isActionQueue && "ring-2 ring-primary/50",
              isActionQueue && "animate-pulse shadow-md"
            )}
            onClick={() => onCardClick(client)}
          >
            <div className="space-y-2">
              <div>
                <p className="font-bold text-sm leading-tight">{client.name}</p>
                <p className="text-xs text-muted-foreground">{client.packageName}</p>
              </div>

              {!client.onboarding && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Last check-in: {client.lastCheckinDays}d ago
                  </p>
                  <div className="flex items-center justify-between">
                    <p className={cn("text-xs font-semibold", getAdherenceColor(client.adherence))}>
                      Adh: {client.adherence}%
                    </p>
                  </div>
                </>
              )}

              {client.onboarding && (
                <p className="text-xs text-muted-foreground">
                  Sent {client.onboardingSentDays}d ago
                </p>
              )}

              {/* Badges for pending actions */}
              {(client.pendingCheckin || client.pendingReview) && (
                <div className="flex flex-wrap gap-1">
                  {client.pendingCheckin && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      Check-in
                    </Badge>
                  )}
                  {client.pendingReview && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      Review
                    </Badge>
                  )}
                </div>
              )}

              {/* Show home month indicator in action queue */}
              {isActionQueue && !client.onboarding && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ArrowRight className="h-3 w-3" />
                  <span>Month {client.monthColumn === 13 ? "12+" : client.monthColumn}</span>
                </div>
              )}

              {/* Mark as reviewed button in action queue */}
              {isActionQueue && onMarkReviewed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs"
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
