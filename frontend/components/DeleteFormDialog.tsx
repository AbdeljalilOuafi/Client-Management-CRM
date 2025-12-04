"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

interface DeleteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formTitle: string;
  packageName: string;
  onConfirmDelete: () => Promise<void>;
}

export function DeleteFormDialog({
  open,
  onOpenChange,
  formTitle,
  packageName,
  onConfirmDelete,
}: DeleteFormDialogProps) {
  const [deleteText, setDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isDeleteEnabled = deleteText === "DELETE";

  const handleDelete = async () => {
    if (!isDeleteEnabled) return;

    setIsDeleting(true);
    try {
      await onConfirmDelete();
      setDeleteText("");
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setDeleteText("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Delete Form</DialogTitle>
              <DialogDescription className="text-base">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Form Information */}
          <div className="rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Form Name</p>
              <p className="text-base font-bold text-foreground mt-1">{formTitle}</p>
            </div>
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Package</p>
              <p className="text-base font-bold text-primary mt-1">{packageName}</p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="rounded-xl border-2 border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 p-4 shadow-sm">
            <p className="text-sm text-destructive font-semibold flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Deleting this form will permanently remove all associated data, including:</span>
            </p>
            <ul className="mt-3 text-sm text-destructive/90 space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>Form questions and configuration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>Schedule settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>All client responses (if any)</span>
              </li>
            </ul>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="delete-confirm" className="text-sm font-semibold">
              Type <span className="font-mono font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">DELETE</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="Type DELETE here"
              className="font-mono text-base h-11 border-2 border-border/60 focus:border-destructive/50 transition-colors"
              disabled={isDeleting}
              autoComplete="off"
            />
            {deleteText && deleteText !== "DELETE" && (
              <p className="text-xs text-destructive/70 flex items-center gap-1">
                <span>•</span>
                <span>Must type exactly: DELETE</span>
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-6 hover:bg-muted transition-colors"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isDeleteEnabled || isDeleting}
            className="px-8 bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive/80 shadow-lg shadow-destructive/20 hover:shadow-xl hover:shadow-destructive/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Form
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

