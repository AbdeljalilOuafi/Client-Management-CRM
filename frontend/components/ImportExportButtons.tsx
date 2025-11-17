"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, Download, FileSpreadsheet, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportExportButtonsProps {
  entityType: "clients" | "payments";
  onImport?: (file: File, format: string) => Promise<void>;
  onExport?: (format: string) => Promise<void>;
}

export function ImportExportButtons({ 
  entityType, 
  onImport, 
  onExport 
}: ImportExportButtonsProps) {
  const { toast } = useToast();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<"csv" | "xlsx">("csv");
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'csv' && fileExtension !== 'xlsx') {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV or XLSX file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setImportFormat(fileExtension as "csv" | "xlsx");
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportSuccess(false);

    try {
      if (onImport) {
        await onImport(selectedFile, importFormat);
      } else {
        // Placeholder for backend integration
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("Import file:", selectedFile.name, "Format:", importFormat);
      }
      
      setImportSuccess(true);
      toast({
        title: "Import Successful",
        description: `${entityType} data has been imported successfully`,
      });
      
      // Close dialog after a short delay
      setTimeout(() => {
        setImportDialogOpen(false);
        setSelectedFile(null);
        setImportSuccess(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    setIsExporting(true);

    try {
      if (onExport) {
        await onExport(format);
      } else {
        // Placeholder for backend integration
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log("Export format:", format);
        
        // Simulate file download
        toast({
          title: "Export Started",
          description: `Preparing ${entityType} data for download...`,
        });
      }
      
      toast({
        title: "Export Successful",
        description: `${entityType} data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportDialogOpen(false);
    }
  };

  return (
    <>
      {/* Import Button */}
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setImportDialogOpen(true)}
      >
        <Upload className="h-4 w-4" />
        Import
      </Button>

      {/* Export Dropdown */}
      <DropdownMenu open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport("csv")}>
            <FileText className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("xlsx")}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import {entityType === "clients" ? "Clients" : "Payments"}</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import {entityType} data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload Area */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isImporting}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? selectedFile.name : "Choose file..."}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isImporting}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: CSV, XLSX (Max 10MB)
              </p>
            </div>

            {/* File Info */}
            {selectedFile && (
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Size: {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {importSuccess && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Import completed successfully!
                </AlertDescription>
              </Alert>
            )}

            {/* Instructions */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Import Guidelines:</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li>Ensure your file has the correct column headers</li>
                  <li>Required fields must not be empty</li>
                  <li>Duplicate entries will be skipped</li>
                  <li>Invalid data will be reported after import</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                setSelectedFile(null);
                setImportSuccess(false);
              }}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting || importSuccess}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
