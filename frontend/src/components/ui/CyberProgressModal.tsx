import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ImportProgressProps {
  isOpen: boolean;
  progress: number;
  step: string;
  currentSheet?: string;
  currentRow?: number;
  totalRows?: number;
  sheetsProcessed?: number;
  totalSheets?: number;
  elapsedTime?: number;
  onComplete?: () => void;
}

export const CyberProgressModal: React.FC<ImportProgressProps> = ({
  isOpen,
  progress,
  step,
  currentSheet,
  currentRow,
  totalRows,
  sheetsProcessed,
  totalSheets,
  elapsedTime,
}) => {
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<string>("Calculating...");
  const [startTime] = useState<number>(Date.now());

  useEffect(() => {
    if (progress > 0 && progress < 100) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = progress / elapsed;
      const remaining = ((100 - progress) / rate);
      
      if (remaining < 60) {
        setEstimatedTimeLeft(`${Math.ceil(remaining)} seconds remaining`);
      } else {
        setEstimatedTimeLeft(`${Math.ceil(remaining / 60)} minute(s) remaining`);
      }
    } else if (progress >= 100) {
      setEstimatedTimeLeft("Complete!");
    }
  }, [progress, startTime]);

  const getStepIcon = (step: string) => {
    if (step.includes("Analyzing")) return "📊";
    if (step.includes("Detecting")) return "🔍";
    if (step.includes("Creating")) return "🏗️";
    if (step.includes("Importing Sheets")) return "📄";
    if (step.includes("Importing Rows") || step.includes("Uploading sheet")) return "📊";
    if (step.includes("Finalizing")) return "✨";
    if (step.includes("Complete")) return "✅";
    return "⚡";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          <motion.div
            className="relative glass-panel-strong border border-secondary/20 rounded-lg max-w-md w-full p-6 shadow-glass-xl z-10 font-sans"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{getStepIcon(step)}</span>
              <h2 className="text-lg font-semibold text-textPrimary tracking-tight">
                Workbook Import Progress
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-textSecondary uppercase tracking-wider">Step Status</span>
                  <span className="text-[10px] text-primary font-semibold">{step}</span>
                </div>
                
                <div className="w-full h-2 bg-secondary/10 rounded-full overflow-hidden border border-secondary/20">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                
                <div className="flex justify-between mt-1 text-[10px]">
                  <span className="text-textSecondary">{progress}% Complete</span>
                  <span className="text-primary">{estimatedTimeLeft}</span>
                </div>
              </div>

              {(currentSheet || sheetsProcessed) && (
                <div className="p-3 glass-panel-light border border-secondary/20 rounded-lg">
                  <div className="text-[10px] text-textSecondary uppercase mb-1 tracking-wider">Currently Processing</div>
                  {currentSheet && (
                    <div className="text-sm text-primary font-semibold">{currentSheet}</div>
                  )}
                  {totalSheets && sheetsProcessed && (
                    <div className="text-[10px] text-textSecondary mt-1">
                      Sheet {sheetsProcessed} of {totalSheets}
                    </div>
                  )}
                  {currentRow !== undefined && totalRows !== undefined && totalRows > 0 && (
                    <div className="text-[10px] text-textSecondary mt-1">
                      Row {currentRow} of {totalRows}
                    </div>
                  )}
                </div>
              )}

              {elapsedTime !== undefined && progress > 0 && (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 border border-secondary/20 rounded-lg">
                    <span className="text-textSecondary">Elapsed:</span>
                    <span className="ml-2 text-primary font-semibold">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="p-2 border border-secondary/20 rounded-lg">
                    <span className="text-textSecondary">Rate:</span>
                    <span className="ml-2 text-success font-semibold">
                      {progress > 0 && elapsedTime > 0 ? `${Math.round((progress / elapsedTime) * 10) / 10}%/s` : "-"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CyberProgressModal;