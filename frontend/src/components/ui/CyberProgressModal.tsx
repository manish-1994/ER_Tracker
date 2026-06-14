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
            className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          <motion.div
            className="relative bg-[#0F172A] border border-primary/40 rounded-xl max-w-md w-full p-6 shadow-[0_0_30px_rgba(0,229,255,0.3)] z-10 font-mono"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary" />
            
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{getStepIcon(step)}</span>
              <h2 className="text-lg font-bold uppercase text-primary tracking-wider">
                Workbook Import Progress
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-slate-400 uppercase">Step Status</span>
                  <span className="text-[10px] text-primary font-bold">{step}</span>
                </div>
                
                <div className="w-full h-3 bg-[#0a0f1d] rounded-full overflow-hidden border border-cyan-500/20">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                
                <div className="flex justify-between mt-1 text-[10px]">
                  <span className="text-slate-500">{progress}% Complete</span>
                  <span className="text-cyan-400">{estimatedTimeLeft}</span>
                </div>
              </div>

              {(currentSheet || sheetsProcessed) && (
                <div className="p-3 bg-[#0a0f1d]/50 border border-cyan-500/10 rounded">
                  <div className="text-[10px] text-slate-400 uppercase mb-1">Currently Processing</div>
                  {currentSheet && (
                    <div className="text-sm text-primary font-bold">{currentSheet}</div>
                  )}
                  {totalSheets && sheetsProcessed && (
                    <div className="text-[10px] text-slate-300 mt-1">
                      Sheet {sheetsProcessed} of {totalSheets}
                    </div>
                  )}
                  {currentRow !== undefined && totalRows !== undefined && totalRows > 0 && (
                    <div className="text-[10px] text-slate-300 mt-1">
                      Row {currentRow} of {totalRows}
                    </div>
                  )}
                </div>
              )}

              {elapsedTime !== undefined && progress > 0 && (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 border border-cyan-500/10 rounded">
                    <span className="text-slate-500">Elapsed:</span>
                    <span className="ml-2 text-primary font-bold">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="p-2 border border-cyan-500/10 rounded">
                    <span className="text-slate-500">Rate:</span>
                    <span className="ml-2 text-success font-bold">
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