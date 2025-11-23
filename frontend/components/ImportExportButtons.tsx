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
import { Upload, Download, FileSpreadsheet, FileText, Loader2, CheckCircle2, AlertCircle, Video, Play, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  exportClients, 
  importClients, 
  exportPayments, 
  importPayments,
  ImportResult 
} from "@/lib/api/importExport";
import { usePermissions } from "@/hooks/usePermissions";
import { TutorialVideoDialog } from "@/components/TutorialVideoDialog";

interface ImportExportButtonsProps {
  entityType: "clients" | "payments";
  onImportSuccess?: () => void; // Callback to refresh data after import
}

export function ImportExportButtons({ 
  entityType,
  onImportSuccess
}: ImportExportButtonsProps) {
  const { toast } = useToast();
  const { isSuperAdmin } = usePermissions();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const getStorageKey = () => {
    return entityType === "clients" ? "hideClientImportTutorial" : "hidePaymentImportTutorial";
  };

  const getVideoSrc = () => {
    return entityType === "clients" 
      ? "/videos/client_import_tutorial.mp4" 
      : "/videos/payment_import_tutorial.mp4";
  };

  const handleImportClick = () => {
    // Check if we should show tutorial
    const hideTutorial = typeof window !== "undefined" 
      ? localStorage.getItem(getStorageKey()) 
      : null;
    
    if (hideTutorial === "true") {
      // Skip tutorial, open import dialog directly
      setImportDialogOpen(true);
    } else {
      // Show tutorial video dialog first
      setTutorialDialogOpen(true);
    }
  };

  const handleTutorialContinue = (dontShowAgain: boolean) => {
    // Save preference if checkbox is checked
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem(getStorageKey(), "true");
    }
    
    // Close tutorial, open import dialog
    setTutorialDialogOpen(false);
    setImportDialogOpen(true);
  };

  const handleWatchTutorialAgain = () => {
    // Reset localStorage and show tutorial
    if (typeof window !== "undefined") {
      localStorage.removeItem(getStorageKey());
    }
    setImportDialogOpen(false);
    setTutorialDialogOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type - only CSV is supported by backend
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'csv') {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        event.target.value = ''; // Reset input
        return;
      }
      setSelectedFile(file);
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
    setImportResult(null);

    try {
      let result: ImportResult;
      
      if (entityType === "clients") {
        result = await importClients(selectedFile);
      } else {
        result = await importPayments(selectedFile);
      }
      
      setImportResult(result);
      
      // Show success toast
      toast({
        title: "Import Completed",
        description: result.message,
      });
      
      // Call success callback to refresh data
      if (onImportSuccess) {
        onImportSuccess();
      }
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Close dialog after showing results
      setTimeout(() => {
        setImportDialogOpen(false);
        setSelectedFile(null);
        setImportResult(null);
      }, result.errors.length > 0 ? 5000 : 2000);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
      
      // Reset file input on error
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (entityType === "clients") {
        await exportClients();
      } else {
        await exportPayments();
      }
      
      toast({
        title: "Export Successful",
        description: `${entityType} data exported as CSV`,
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
        onClick={handleImportClick}
      >
        <Upload className="h-4 w-4" />
        Import
      </Button>

      {/* Export Button - Only for Super Admins */}
      {isSuperAdmin() && (
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export CSV
            </>
          )}
        </Button>
      )}

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import {entityType === "clients" ? "Clients" : "Payments"}</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import {entityType} data
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
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isImporting}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Supported format: CSV only
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

            {/* Import Result */}
            {importResult && (
              <Alert className={importResult.errors.length > 0 ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950" : "border-green-500 bg-green-50 dark:bg-green-950"}>
                {importResult.errors.length > 0 ? (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {importResult.message}
                    </p>
                    {importResult.errors.length > 0 && (
                      <div className="text-xs space-y-1">
                        <p className="font-medium">Errors (showing first 5):</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {importResult.errors.slice(0, 5).map((err, idx) => (
                            <li key={idx}>
                              Row {err.row}: {err.error}
                            </li>
                          ))}
                        </ul>
                        {importResult.errors.length > 5 && (
                          <p className="italic">...and {importResult.errors.length - 5} more errors</p>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Instructions */}
            <Alert className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                    Import Guidelines:
                  </p>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Ensure your file has the correct column headers</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Required fields must not be empty</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Duplicate entries will be skipped</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Invalid data will be reported after import</span>
                    </li>
                  </ul>
                  
                  {/* Enhanced Watch Tutorial Button */}
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                    <button
                      onClick={handleWatchTutorialAgain}
                      className="group inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 hover:border-blue-600/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      type="button"
                    >
                      <div className="p-1 rounded-md bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors">
                        <Video className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Watch Tutorial Again
                      </span>
                      <Play className="h-3 w-3 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
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
                setImportResult(null);
                // Reset file input
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) {
                  fileInput.value = '';
                }
              }}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting || (importResult !== null && importResult.errors.length === 0)}
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

      {/* Tutorial Video Dialog */}
      <TutorialVideoDialog
        open={tutorialDialogOpen}
        onOpenChange={setTutorialDialogOpen}
        onContinue={handleTutorialContinue}
        videoSrc={getVideoSrc()}
        title={`How to Format Your ${entityType === "clients" ? "Client" : "Payment"} CSV`}
        storageKey={getStorageKey()}
      />
    </>
  );
}
