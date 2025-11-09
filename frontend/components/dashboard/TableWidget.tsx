"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, GripVertical, Table2, TrendingUp, Users, Calendar, Award } from "lucide-react";
import { tableDatasets } from "@/lib/mockData";
import type { Widget } from "@/hooks/useDashboardLayout";

type TableWidgetProps = {
  widget: Widget;
  onDelete: () => void;
  onEdit?: () => void;
  isDragging?: boolean;
};

export const TableWidget = ({ widget, onDelete, onEdit, isDragging }: TableWidgetProps) => {
  const data = useMemo(() => {
    const dataset = tableDatasets[widget.dataSource as keyof typeof tableDatasets];
    return dataset || [];
  }, [widget.dataSource]);

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const getTableIcon = () => {
    const source = widget.dataSource;
    const iconClass = "h-4 w-4";
    if (source.includes('client')) return <Users className={iconClass} />;
    if (source.includes('payment')) return <TrendingUp className={iconClass} />;
    if (source.includes('instalment')) return <Calendar className={iconClass} />;
    if (source.includes('coach') || source.includes('performance')) return <Award className={iconClass} />;
    return <Table2 className={iconClass} />;
  };

  const formatCellValue = (value: any, column: string) => {
    if (typeof value === 'number') {
      if (column.toLowerCase().includes('amount') || column.toLowerCase().includes('revenue') || column.toLowerCase().includes('ltv')) {
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (column.toLowerCase().includes('satisfaction')) {
        return `${value.toFixed(1)} ⭐`;
      }
      return value.toLocaleString();
    }
    return value;
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
                {getTableIcon()}
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
                  <Table2 className="h-4 w-4" />
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
          {!data || data.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">No data available</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      {columns.map((column) => (
                        <TableHead key={column} className="font-semibold text-xs uppercase tracking-wider">
                          {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row: any, index: number) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        {columns.map((column) => (
                          <TableCell key={column} className="py-3 text-sm">
                            {column === 'status' || column.toLowerCase().includes('status') ? (
                              <motion.span
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  row[column] === 'Active' || row[column] === 'Completed' || row[column] === 'Scheduled'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : row[column] === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                }`}
                              >
                                {row[column]}
                              </motion.span>
                            ) : (
                              <span className={column === columns[0] ? 'font-medium' : ''}>
                                {formatCellValue(row[column], column)}
                              </span>
                            )}
                          </TableCell>
                        ))}
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
