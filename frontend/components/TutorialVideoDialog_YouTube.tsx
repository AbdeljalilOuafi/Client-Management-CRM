"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Video, CheckCircle2, Sparkles, PlayCircle } from "lucide-react";

interface TutorialVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  youtubeVideoId: string; // e.g., "dQw4w9WgXcQ" from https://youtube.com/watch?v=dQw4w9WgXcQ
  storageKey: string;
  onContinue: () => void;
}

export function TutorialVideoDialog({
  open,
  onOpenChange,
  title,
  youtubeVideoId,
  storageKey,
  onContinue,
}: TutorialVideoDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setDontShowAgain(false);
      setIsVideoLoaded(false);
    }
  }, [open]);

  const handleSkip = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem(storageKey, "true");
    }
    onOpenChange(false);
  };

  const handleContinue = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem(storageKey, "true");
    }
    onOpenChange(false);
    onContinue();
  };

  const handleClose = (open: boolean) => {
    if (!open && dontShowAgain) {
      // If user closes with X but has checked the box, save preference
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, "true");
      }
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden border-2 border-primary/20">
        {/* Header with Gradient Background */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Video className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary" className="gap-1 px-2 py-0.5">
                  <Sparkles className="h-3 w-3" />
                  Quick Tutorial
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-base">
                Watch this quick guide to learn how to format your CSV file correctly for a smooth import experience.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Video Player Section */}
        <div className="p-6 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            {/* YouTube Embed Container */}
            <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700/50 ring-4 ring-primary/10">
              {/* Loading State */}
              {!isVideoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 z-10">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <PlayCircle className="h-16 w-16 text-primary/50 animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">Loading tutorial video...</p>
                  </div>
                </div>
              )}
              
              {/* YouTube iFrame */}
              <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&color=white&autohide=1`}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsVideoLoaded(true)}
              />
            </div>

            {/* Video Info Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10"
            >
              <p className="text-xs text-white font-medium flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Tutorial Video
              </p>
            </motion.div>
          </motion.div>

          {/* Checkbox with Enhanced Styling */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border border-border hover:bg-muted/70 transition-colors"
          >
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              className="h-5 w-5"
            />
            <Label
              htmlFor="dont-show"
              className="text-sm font-medium cursor-pointer select-none flex-1"
            >
              I understand, don&apos;t show this tutorial again
            </Label>
            {dontShowAgain && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-green-600 dark:text-green-400"
              >
                <CheckCircle2 className="h-5 w-5" />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/30 border-t">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="gap-2"
          >
            Skip Tutorial
          </Button>
          <Button
            onClick={handleContinue}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <CheckCircle2 className="h-4 w-4" />
            Continue to Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
