"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, BarChart3, PieChart, Table2, Sparkles, AlertCircle } from "lucide-react";
import { chartOptions, tableOptions } from "@/lib/mockData";
import type { WidgetType, ChartType } from "@/hooks/useDashboardLayout";

type AddWidgetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: WidgetType, title: string, dataSource: string, chartType?: ChartType) => boolean;
  chartCount: number;
  tableCount: number;
  maxCharts: number;
  maxTables: number;
};

const chartTypeIcons = {
  line: LineChart,
  bar: BarChart3,
  pie: PieChart,
};

const chartTypePreviews = {
  line: (
    <svg viewBox="0 0 100 60" className="w-full h-full">
      <path d="M 10 50 L 30 30 L 50 40 L 70 20 L 90 35" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="10" cy="50" r="2" fill="currentColor" />
      <circle cx="30" cy="30" r="2" fill="currentColor" />
      <circle cx="50" cy="40" r="2" fill="currentColor" />
      <circle cx="70" cy="20" r="2" fill="currentColor" />
      <circle cx="90" cy="35" r="2" fill="currentColor" />
    </svg>
  ),
  bar: (
    <svg viewBox="0 0 100 60" className="w-full h-full">
      <rect x="10" y="30" width="12" height="25" fill="currentColor" rx="2" />
      <rect x="28" y="20" width="12" height="35" fill="currentColor" rx="2" />
      <rect x="46" y="35" width="12" height="20" fill="currentColor" rx="2" />
      <rect x="64" y="15" width="12" height="40" fill="currentColor" rx="2" />
      <rect x="82" y="25" width="12" height="30" fill="currentColor" rx="2" />
    </svg>
  ),
  pie: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="20" strokeDasharray="70 150" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="20" strokeDasharray="50 170" strokeDashoffset="-70" opacity="0.6" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="20" strokeDasharray="100 120" strokeDashoffset="-120" opacity="0.3" />
    </svg>
  ),
};

export const AddWidgetDialog = ({ 
  open, 
  onOpenChange, 
  onAdd, 
  chartCount, 
  tableCount,
  maxCharts,
  maxTables 
}: AddWidgetDialogProps) => {
  const [widgetType, setWidgetType] = useState<WidgetType>("chart");
  const [title, setTitle] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [chartType, setChartType] = useState<ChartType>("line");

  const handleSubmit = () => {
    if (!title || !dataSource) {
      return;
    }

    const success = onAdd(
      widgetType,
      title,
      dataSource,
      widgetType === "chart" ? chartType : undefined
    );

    if (success) {
      setTitle("");
      setDataSource("");
      setChartType("line");
      onOpenChange(false);
    }
  };

  const handleDataSourceChange = (value: string) => {
    setDataSource(value);
    const option = widgetType === "chart" 
      ? chartOptions.find(opt => opt.value === value)
      : tableOptions.find(opt => opt.value === value);
    
    if (option) {
      setTitle(option.label);
      if (widgetType === "chart" && 'type' in option) {
        setChartType(option.type as ChartType);
      }
    }
  };

  const isMaxReached = (widgetType === "chart" && chartCount >= maxCharts) || 
                       (widgetType === "table" && tableCount >= maxTables);

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <DialogTitle className="text-xl">Add Widget to Dashboard</DialogTitle>
                </div>
              </DialogHeader>

              <div className="px-6 py-4">
                <Tabs value={widgetType} onValueChange={(v) => setWidgetType(v as WidgetType)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-11">
                    <TabsTrigger 
                      value="chart" 
                      disabled={chartCount >= maxCharts}
                      className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <LineChart className="h-4 w-4" />
                      Chart {chartCount >= maxCharts && `(${chartCount}/${maxCharts})`}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="table" 
                      disabled={tableCount >= maxTables}
                      className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Table2 className="h-4 w-4" />
                      Table {tableCount >= maxTables && `(${tableCount}/${maxTables})`}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="chart" className="space-y-5 mt-5">
                    {/* Chart Type Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Chart Type</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['line', 'bar', 'pie'] as ChartType[]).map((type) => {
                          const Icon = chartTypeIcons[type];
                          return (
                            <motion.button
                              key={type}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setChartType(type)}
                              className={`relative p-4 rounded-lg border-2 transition-all ${
                                chartType === type
                                  ? 'border-primary bg-primary/5 shadow-md'
                                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                              }`}
                            >
                              <div className={`mb-2 ${chartType === type ? 'text-primary' : 'text-muted-foreground'}`}>
                                {chartTypePreviews[type]}
                              </div>
                              <div className="flex items-center justify-center gap-1.5">
                                <Icon className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium capitalize">{type}</span>
                              </div>
                              {chartType === type && (
                                <motion.div
                                  layoutId="chartTypeIndicator"
                                  className="absolute inset-0 border-2 border-primary rounded-lg"
                                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Data Source */}
                    <div className="space-y-2">
                      <Label htmlFor="chart-data" className="text-sm font-semibold">Data Source</Label>
                      <Select value={dataSource} onValueChange={handleDataSourceChange}>
                        <SelectTrigger id="chart-data" className="h-11">
                          <SelectValue placeholder="Select data source" />
                        </SelectTrigger>
                        <SelectContent>
                          {chartOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <span>{option.label}</span>
                                <span className="text-xs text-muted-foreground">({option.type})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="chart-title" className="text-sm font-semibold">Widget Title</Label>
                      <Input
                        id="chart-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter widget title"
                        className="h-11"
                      />
                    </div>

                    {chartCount >= maxCharts && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>Maximum {maxCharts} charts reached. Remove a chart to add a new one.</p>
                      </motion.div>
                    )}
                  </TabsContent>

                  <TabsContent value="table" className="space-y-5 mt-5">
                    {/* Data Source */}
                    <div className="space-y-2">
                      <Label htmlFor="table-data" className="text-sm font-semibold">Data Source</Label>
                      <Select value={dataSource} onValueChange={handleDataSourceChange}>
                        <SelectTrigger id="table-data" className="h-11">
                          <SelectValue placeholder="Select data source" />
                        </SelectTrigger>
                        <SelectContent>
                          {tableOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="table-title" className="text-sm font-semibold">Widget Title</Label>
                      <Input
                        id="table-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter widget title"
                        className="h-11"
                      />
                    </div>

                    {tableCount >= maxTables && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>Maximum {maxTables} tables reached. Remove a table to add a new one.</p>
                      </motion.div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <DialogFooter className="px-6 py-4 bg-muted/30 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="h-10"
                >
                  Cancel
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!title || !dataSource || isMaxReached}
                    className="h-10 gap-2 bg-primary hover:bg-primary/90"
                  >
                    <Sparkles className="h-4 w-4" />
                    Add to Dashboard
                  </Button>
                </motion.div>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
