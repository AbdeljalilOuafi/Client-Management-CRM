"use client";

import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Users, TrendingUp, Clock, Filter, X } from "lucide-react";
import { KanbanColumn } from "@/components/client-board/KanbanColumn";
import { ClientDetailPanel } from "@/components/client-board/ClientDetailPanel";
import { Client } from "@/components/client-board/ClientCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { motion, AnimatePresence } from "framer-motion";

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

  // Calculate statistics
  const totalClients = filteredClients.length;
  const avgAdherence = Math.round(
    filteredClients.filter(c => !c.onboarding).reduce((sum, c) => sum + c.adherence, 0) / 
    filteredClients.filter(c => !c.onboarding).length
  );
  const pendingActions = checkinClients.length + reviewClients.length + onboardingClients.length;

  return (
    <div className="flex flex-col h-screen">
      {/* Header with Title and Stats */}
      <div className="border-b bg-gradient-to-r from-card to-card/50 px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Client Board</h1>
              <p className="text-muted-foreground mt-1">Track and manage client progress</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Clients</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{totalClients}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Avg Adherence</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">{avgAdherence}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Pending Actions</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">{pendingActions}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[250px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={packageFilter} onValueChange={setPackageFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by package" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">All Packages</SelectItem>
                  {packages.map(pkg => (
                    <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {packageFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {packageFilter}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setPackageFilter("all")}
                  />
                </Badge>
              )}
            </div>
          </div>
        </motion.div>
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
