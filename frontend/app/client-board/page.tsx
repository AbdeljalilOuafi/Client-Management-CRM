"use client";

import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { KanbanColumn } from "@/components/client-board/KanbanColumn";
import { ClientDetailPanel } from "@/components/client-board/ClientDetailPanel";
import { Client } from "@/components/client-board/ClientCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";

const INITIAL_CLIENTS: Client[] = [
  { id: "1", name: "Sarah Johnson", packageName: "12-Week Transform", monthColumn: 1, lastCheckinDays: 2, adherence: 85, pendingCheckin: true },
  { id: "2", name: "Amy K", packageName: "Elite Package", monthColumn: 2, lastCheckinDays: 1, adherence: 78, pendingCheckin: true },
  { id: "3", name: "Mike T", packageName: "Elite Package", monthColumn: 3, lastCheckinDays: 7, adherence: 92, pendingReview: true },
  { id: "4", name: "Chris P", packageName: "Elite Package", monthColumn: 3, lastCheckinDays: 5, adherence: 88 },
  { id: "5", name: "David S", packageName: "Transform", monthColumn: 13, lastCheckinDays: 3, adherence: 95 },
  { id: "6", name: "Tom K", packageName: "Weight Loss", monthColumn: 0, lastCheckinDays: 0, adherence: 0, onboarding: true, onboardingSentDays: 3 },
  { id: "7", name: "Jessica L", packageName: "Elite Package", monthColumn: 4, lastCheckinDays: 4, adherence: 91 },
  { id: "8", name: "Robert M", packageName: "12-Week Transform", monthColumn: 5, lastCheckinDays: 6, adherence: 67 },
  { id: "9", name: "Emily R", packageName: "Weight Loss", monthColumn: 6, lastCheckinDays: 2, adherence: 82 },
  { id: "10", name: "James W", packageName: "Elite Package", monthColumn: 7, lastCheckinDays: 8, adherence: 55 },
  { id: "11", name: "Lisa B", packageName: "Transform", monthColumn: 8, lastCheckinDays: 3, adherence: 88 },
  { id: "12", name: "Mark D", packageName: "12-Week Transform", monthColumn: 9, lastCheckinDays: 5, adherence: 76 },
  { id: "13", name: "Nicole F", packageName: "Elite Package", monthColumn: 10, lastCheckinDays: 4, adherence: 93 },
  { id: "14", name: "Paul G", packageName: "Weight Loss", monthColumn: 11, lastCheckinDays: 7, adherence: 71 },
  { id: "15", name: "Rachel H", packageName: "Transform", monthColumn: 13, lastCheckinDays: 2, adherence: 89 },
];

const ClientBoardContent = () => {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState("all");

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceId = result.source.droppableId;
    const destId = result.destination.droppableId;
    
    // Don't allow dragging into or out of action queues
    if (sourceId.startsWith("action-") || destId.startsWith("action-")) return;
    
    const clientId = result.draggableId;
    const newMonth = parseInt(destId.replace("month-", ""));
    
    setClients(prev => prev.map(client => 
      client.id === clientId ? { ...client, monthColumn: newMonth } : client
    ));
  };

  const markAsReviewed = (clientId: string, type: "checkin" | "review") => {
    setClients(prev => prev.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          pendingCheckin: type === "checkin" ? false : client.pendingCheckin,
          pendingReview: type === "review" ? false : client.pendingReview,
        };
      }
      return client;
    }));
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPackage = packageFilter === "all" || client.packageName === packageFilter;
    return matchesSearch && matchesPackage;
  });

  const checkinClients = filteredClients.filter(c => c.pendingCheckin);
  const reviewClients = filteredClients.filter(c => c.pendingReview);
  const onboardingClients = filteredClients.filter(c => c.onboarding);

  const packages = Array.from(new Set(clients.map(c => c.packageName)));

  return (
    <div className="flex flex-col h-screen">
      {/* Filters */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={packageFilter} onValueChange={setPackageFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by package" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Packages</SelectItem>
              {packages.map(pkg => (
                <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full">
            {/* Sticky Action Queues */}
            <div className="flex-shrink-0 border-r bg-card/50 backdrop-blur">
              <div className="flex gap-4 p-4">
                <KanbanColumn
                  id="action-checkins"
                  title="⚡ Check-ins To Review"
                  clients={checkinClients}
                  count={checkinClients.length}
                  isActionQueue
                  onCardClick={setSelectedClient}
                  onMarkReviewed={(id) => markAsReviewed(id, "checkin")}
                />
                <KanbanColumn
                  id="action-reviews"
                  title="📋 Reviews To Review"
                  clients={reviewClients}
                  count={reviewClients.length}
                  isActionQueue
                  onCardClick={setSelectedClient}
                  onMarkReviewed={(id) => markAsReviewed(id, "review")}
                />
                <KanbanColumn
                  id="action-onboarding"
                  title="🆕 Onboarding To Complete"
                  clients={onboardingClients}
                  count={onboardingClients.length}
                  isActionQueue
                  onCardClick={setSelectedClient}
                />
              </div>
            </div>

            {/* Scrollable Month Columns */}
            <ScrollArea className="flex-1">
              <div className="flex gap-4 p-4">
                {Array.from({ length: 11 }, (_, i) => i + 1).map(month => (
                  <KanbanColumn
                    key={month}
                    id={`month-${month}`}
                    title={`Month ${month}`}
                    clients={filteredClients.filter(c => c.monthColumn === month)}
                    count={filteredClients.filter(c => c.monthColumn === month).length}
                    onCardClick={setSelectedClient}
                  />
                ))}
                <KanbanColumn
                  id="month-13"
                  title="Month 12+"
                  clients={filteredClients.filter(c => c.monthColumn === 13)}
                  count={filteredClients.filter(c => c.monthColumn === 13).length}
                  onCardClick={setSelectedClient}
                />
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </DragDropContext>
      </div>

      {/* Client Detail Panel */}
      {selectedClient && (
        <ClientDetailPanel
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
};

export default function ClientBoardPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <ClientBoardContent />
      </AppLayout>
    </AuthGuard>
  );
}
