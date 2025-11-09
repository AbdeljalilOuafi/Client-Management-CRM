"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export type WidgetType = 'chart' | 'table';
export type ChartType = 'line' | 'bar' | 'pie';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  chartType?: ChartType;
  position: number;
  createdAt: string;
}

interface DashboardLayout {
  widgets: Widget[];
  lastUpdated: string;
}

const STORAGE_KEY = 'fitcoach-dashboard-layout';
const MAX_CHARTS = 5;
const MAX_TABLES = 5;

export const useDashboardLayout = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load layout from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const layout: DashboardLayout = JSON.parse(stored);
        setWidgets(layout.widgets);
      }
    } catch (error) {
      console.error('Failed to load dashboard layout:', error);
      toast.error('Failed to load dashboard layout');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save layout to localStorage whenever widgets change
  const saveLayout = useCallback((updatedWidgets: Widget[]) => {
    try {
      const layout: DashboardLayout = {
        widgets: updatedWidgets,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
      toast.error('Failed to save dashboard layout');
    }
  }, []);

  // Add a new widget
  const addWidget = useCallback((
    type: WidgetType,
    title: string,
    dataSource: string,
    chartType?: ChartType
  ) => {
    const chartCount = widgets.filter(w => w.type === 'chart').length;
    const tableCount = widgets.filter(w => w.type === 'table').length;

    // Check limits
    if (type === 'chart' && chartCount >= MAX_CHARTS) {
      toast.error(`Maximum ${MAX_CHARTS} charts allowed`);
      return false;
    }

    if (type === 'table' && tableCount >= MAX_TABLES) {
      toast.error(`Maximum ${MAX_TABLES} tables allowed`);
      return false;
    }

    const newWidget: Widget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      dataSource,
      chartType,
      position: widgets.length,
      createdAt: new Date().toISOString(),
    };

    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    saveLayout(updatedWidgets);
    
    toast.success(`${type === 'chart' ? 'Chart' : 'Table'} added successfully`);
    return true;
  }, [widgets, saveLayout]);

  // Remove a widget
  const removeWidget = useCallback((widgetId: string) => {
    const updatedWidgets = widgets
      .filter(w => w.id !== widgetId)
      .map((w, index) => ({ ...w, position: index }));
    
    setWidgets(updatedWidgets);
    saveLayout(updatedWidgets);
    toast.success('Widget removed');
  }, [widgets, saveLayout]);

  // Update widget
  const updateWidget = useCallback((
    widgetId: string,
    updates: Partial<Omit<Widget, 'id' | 'createdAt'>>
  ) => {
    const updatedWidgets = widgets.map(w =>
      w.id === widgetId ? { ...w, ...updates } : w
    );
    
    setWidgets(updatedWidgets);
    saveLayout(updatedWidgets);
    toast.success('Widget updated');
  }, [widgets, saveLayout]);

  // Reorder widgets (for drag and drop)
  const reorderWidgets = useCallback((startIndex: number, endIndex: number) => {
    const result = Array.from(widgets);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    // Update positions
    const updatedWidgets = result.map((w, index) => ({ ...w, position: index }));
    
    setWidgets(updatedWidgets);
    saveLayout(updatedWidgets);
  }, [widgets, saveLayout]);

  // Get widget counts
  const getWidgetCounts = useCallback(() => {
    const chartCount = widgets.filter(w => w.type === 'chart').length;
    const tableCount = widgets.filter(w => w.type === 'table').length;
    
    return {
      charts: chartCount,
      tables: tableCount,
      total: widgets.length,
      canAddChart: chartCount < MAX_CHARTS,
      canAddTable: tableCount < MAX_TABLES,
    };
  }, [widgets]);

  // Clear all widgets
  const clearAllWidgets = useCallback(() => {
    setWidgets([]);
    saveLayout([]);
    toast.success('Dashboard cleared');
  }, [saveLayout]);

  return {
    widgets,
    isLoading,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    getWidgetCounts,
    clearAllWidgets,
    maxCharts: MAX_CHARTS,
    maxTables: MAX_TABLES,
  };
};
