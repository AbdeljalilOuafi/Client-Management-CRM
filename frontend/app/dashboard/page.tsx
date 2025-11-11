"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Users, LayoutDashboard, CreditCard, DollarSign, Plus, Trash2, Sparkles } from "lucide-react";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { ChartWidget } from "@/components/dashboard/ChartWidget";
import { TableWidget } from "@/components/dashboard/TableWidget";
import { AddWidgetDialog } from "@/components/dashboard/AddWidgetDialog";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export default function Dashboard() {
  const router = useRouter();
  const {
    widgets,
    isLoading,
    addWidget,
    removeWidget,
    reorderWidgets,
    getWidgetCounts,
    clearAllWidgets,
    maxCharts,
    maxTables,
  } = useDashboardLayout();

  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const counts = getWidgetCounts();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    reorderWidgets(result.source.index, result.destination.index);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Sparkles className="h-8 w-8 text-primary" />
          </motion.div>
          <div className="text-lg text-muted-foreground mt-4">Loading dashboard...</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
              >
                FitCoach Manager
              </motion.h1>
              <div className="flex gap-2">
                {[
                  { icon: Users, label: 'Clients', path: '/' },
                  { icon: CreditCard, label: 'Payments', path: '/payments' },
                  { icon: DollarSign, label: 'Instalments', path: '/instalments' },
                  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', active: true },
                  { icon: Users, label: 'Staff', path: '/staff' },
                ].map((item) => (
                  <motion.div key={item.path} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      className={`gap-2 transition-all ${
                        item.active 
                          ? 'bg-primary/10 text-primary border-b-2 border-primary rounded-b-none' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => router.push(item.path)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <span className="text-sm text-muted-foreground">Coach Portal</span>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h2>
            <p className="text-muted-foreground">
              Customize your dashboard with up to {maxCharts} charts and {maxTables} tables
            </p>
          </div>
          <div className="flex items-center gap-3">
            {widgets.length > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllWidgets}
                  className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setAddWidgetOpen(true)}
                className="gap-2 shadow-lg shadow-primary/20"
                disabled={counts.charts >= maxCharts && counts.tables >= maxTables}
              >
                <Plus className="h-4 w-4" />
                Add Widget
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Widget Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {[
            { label: 'Total Widgets', value: counts.total, icon: LayoutDashboard, color: 'text-blue-500' },
            { label: 'Charts', value: `${counts.charts} / ${maxCharts}`, icon: Sparkles, color: 'text-purple-500' },
            { label: 'Tables', value: `${counts.tables} / ${maxTables}`, icon: CreditCard, color: 'text-green-500' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              className="rounded-xl border bg-card p-6 transition-all hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </div>
                <div className={`p-3 rounded-lg bg-muted/50 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Widgets Grid */}
        <AnimatePresence mode="wait">
          {widgets.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-16 text-center bg-muted/20"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <LayoutDashboard className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">No widgets yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get started by adding your first chart or table widget to visualize your data
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={() => setAddWidgetOpen(true)} className="gap-2 shadow-lg">
                  <Plus className="h-4 w-4" />
                  Add Your First Widget
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="dashboard-widgets">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all ${
                      snapshot.isDraggingOver ? 'bg-muted/20 rounded-lg p-2' : ''
                    }`}
                  >
                    <AnimatePresence>
                      {widgets.map((widget, index) => (
                        <Draggable key={widget.id} draggableId={widget.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {widget.type === "chart" ? (
                                <ChartWidget
                                  widget={widget}
                                  onDelete={() => removeWidget(widget.id)}
                                  isDragging={snapshot.isDragging}
                                />
                              ) : (
                                <TableWidget
                                  widget={widget}
                                  onDelete={() => removeWidget(widget.id)}
                                  isDragging={snapshot.isDragging}
                                />
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </AnimatePresence>
      </main>

      {/* Add Widget Dialog */}
      <AddWidgetDialog
        open={addWidgetOpen}
        onOpenChange={setAddWidgetOpen}
        onAdd={addWidget}
        chartCount={counts.charts}
        tableCount={counts.tables}
        maxCharts={maxCharts}
        maxTables={maxTables}
      />
    </div>
  );
}
