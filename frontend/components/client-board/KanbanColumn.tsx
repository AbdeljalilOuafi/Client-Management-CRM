import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { ClientCard, Client } from "./ClientCard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex-shrink-0 w-[194px]",
        isActionQueue && "bg-gradient-to-b from-card/50 to-card/30 rounded-xl p-3 border border-border/50 shadow-sm"
      )}
    >
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className={cn(
            "font-semibold text-sm",
            isActionQueue ? "text-primary" : "text-foreground"
          )}>
            {title}
          </h3>
          <Badge
            variant={count > 0 ? "default" : "secondary"}
            className={cn(
              "text-xs font-bold min-w-[24px] justify-center",
              count > 0 && isActionQueue && "bg-orange-500 hover:bg-orange-600"
            )}
          >
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
              "min-h-[300px] space-y-3 rounded-xl p-3 transition-all duration-200 flex flex-col items-center",
              snapshot.isDraggingOver && !isActionQueue && "bg-primary/10 ring-2 ring-primary/30 scale-[1.02]",
              isActionQueue && "bg-transparent",
              !isActionQueue && "bg-muted/20"
            )}
          >
            {clients.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-sm text-muted-foreground"
              >
                {isActionQueue ? (
                  <div className="space-y-2">
                    <div className="text-2xl">✓</div>
                    <div>No pending items</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-2xl">📭</div>
                    <div>No clients</div>
                  </div>
                )}
              </motion.div>
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
    </motion.div>
  );
};
