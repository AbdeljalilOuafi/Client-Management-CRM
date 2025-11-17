"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, LineChart as LineChartIcon, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { chartDatasets } from "@/lib/mockData";
import type { Widget } from "@/hooks/useDashboardLayout";

type ChartWidgetProps = {
  widget: Widget;
  onDelete: () => void;
  onEdit?: () => void;
  isDragging?: boolean;
};

// Beautiful color palettes
const LINE_COLORS = ['#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];
const BAR_COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
const PIE_COLORS = ['#60A5FA', '#F472B6', '#34D399', '#FBBF24', '#A78BFA'];

export const ChartWidget = ({ widget, onDelete, onEdit, isDragging }: ChartWidgetProps) => {
  const data = useMemo(() => {
    const dataset = chartDatasets[widget.dataSource as keyof typeof chartDatasets];
    return dataset || [];
  }, [widget.dataSource]);

  const getChartIcon = () => {
    const chartType = widget.chartType || 'line';
    const iconClass = "h-4 w-4";
    switch (chartType) {
      case 'line': return <LineChartIcon className={iconClass} />;
      case 'bar': return <BarChart3 className={iconClass} />;
      case 'pie': return <PieChartIcon className={iconClass} />;
      default: return <LineChartIcon className={iconClass} />;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-lg shadow-lg p-3"
        >
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm">No data available</p>
          </div>
        </div>
      );
    }

    const chartType = widget.chartType || 'line';

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              {Object.keys(data[0]).slice(1).map((key, index) => (
                <linearGradient key={key} id={`gradient-${widget.id}-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={LINE_COLORS[index % LINE_COLORS.length]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={LINE_COLORS[index % LINE_COLORS.length]} stopOpacity={0.2}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
            <XAxis 
              dataKey={Object.keys(data[0])[0]} 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            {Object.keys(data[0]).slice(1).map((key, index) => (
              <Line 
                key={key}
                type="monotone" 
                dataKey={key} 
                stroke={LINE_COLORS[index % LINE_COLORS.length]}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                animationDuration={1000}
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
            <XAxis 
              dataKey={Object.keys(data[0])[0]} 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            {Object.keys(data[0]).slice(1).map((key, index) => (
              <Bar 
                key={key}
                dataKey={key} 
                fill={BAR_COLORS[index % BAR_COLORS.length]}
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'pie') {
      const pieData = data.map((item: any) => ({
        name: item.name || Object.values(item)[0],
        value: item.value || Object.values(item)[1]
      }));

      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
              animationDuration={1000}
              animationBegin={0}
            >
              {pieData.map((entry: any, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px' }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className={`h-full transition-all duration-300 ${
        isDragging 
          ? 'opacity-50 rotate-2 scale-105 shadow-2xl' 
          : 'hover:shadow-xl border-border/50'
      }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-6 pt-6">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
            </motion.div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                {getChartIcon()}
              </div>
              <CardTitle className="text-base font-semibold">{widget.title}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEdit}
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <LineChartIcon className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {renderChart()}
        </CardContent>
      </Card>
    </motion.div>
  );
};
