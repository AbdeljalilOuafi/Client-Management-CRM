import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { ClientCard, Client } from "./ClientCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  clients: Client[];
  count: number;
  isActionQueue?: boolean;
  onCardClick: (client: Client) => void;
  onMarkReviewed?: (id: string) => void;
}

export const KanbanColumn = ({ 
  id, 
  title, 
  clients, 
  count, 
  isActionQueue, 
  onCardClick,
  onMarkReviewed 
}: KanbanColumnProps) => {
  return (
    <div className={cn("flex-shrink-0 w-[174px]", isActionQueue && "bg-card/30 rounded-lg p-2")}>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        </div>
      </div>

      <Droppable droppableId={id} isDropDisabled={isActionQueue}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[200px] space-y-3 rounded-lg p-2 transition-colors",
              snapshot.isDraggingOver && !isActionQueue && "bg-primary/10",
              isActionQueue && "bg-transparent"
            )}
          >
            {clients.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {isActionQueue ? "No pending items ✓" : "No clients"}
              </div>
            )}
            {clients.map((client, index) => (
              <ClientCard
                key={client.id}
                client={client}
                index={index}
                isActionQueue={isActionQueue}
                onCardClick={onCardClick}
                onMarkReviewed={onMarkReviewed}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
