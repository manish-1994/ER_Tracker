import React, { useState, useEffect, useMemo } from "react";
import { getWorksheets, getCleanSheetName, getColumns } from "../services/worksheetService";
import { getRows } from "../services/rowService";
import { CyberCard } from "./ui/CyberCard";
import { CyberInput } from "./ui/CyberInput";
import { CyberButton } from "./ui/CyberButton";
import { motion, AnimatePresence } from "framer-motion";

interface SheetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  workbookId: string;
  onSelect: (sheetId: string) => void;
}

type SheetWithDetails = {
  id: string;
  name: string;
  cleanName: string;
  rowCount: number;
  colCount: number;
  lastUpdated: string;
};

export const SheetSelector: React.FC<SheetSelectorProps> = ({
  isOpen,
  onClose,
  workbookId,
  onSelect,
}) => {
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sheetDetails, setSheetDetails] = useState<
    Record<string, { rowCount: number; colCount: number; lastUpdated: string }>
  >({});

  // Reset search when workbook or modal state changes
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSheetDetails({});
    }
  }, [isOpen, workbookId]);

  // Load sheets and dynamically fetch their live metadata details
  useEffect(() => {
    if (!isOpen || !workbookId) return;

    setLoading(true);
    getWorksheets(workbookId)
      .then(async (data) => {
        setSheets(data || []);
        
        // Fetch details (columns, rows, updates) for each sheet in parallel
        const detailsMap: Record<string, { rowCount: number; colCount: number; lastUpdated: string }> = {};
        await Promise.all(
          (data || []).map(async (sheet) => {
            try {
              const [cols, rows] = await Promise.all([
                getColumns(sheet.id),
                getRows(sheet.id),
              ]);

              let latestTime = "-";
              if (rows && rows.length > 0) {
                const timestamps = rows
                  .map((r) => r.updated_at || r.created_at)
                  .filter(Boolean) as string[];
                if (timestamps.length > 0) {
                  const maxDate = new Date(Math.max(...timestamps.map((t) => new Date(t).getTime())));
                  latestTime = maxDate.toLocaleDateString() + " " + maxDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
              }

              detailsMap[sheet.id] = {
                rowCount: rows?.length || 0,
                colCount: cols?.length || 0,
                lastUpdated: latestTime,
              };
            } catch (err) {
              console.warn(`Failed loading details for sheet ID ${sheet.id}:`, err);
              detailsMap[sheet.id] = { rowCount: 0, colCount: 0, lastUpdated: "-" };
            }
          })
        );
        setSheetDetails(detailsMap);
      })
      .catch((err) => {
        console.error("Error loading worksheets details:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, workbookId]);

  // Map sheet items with clean descriptive names and details
  const sheetsWithDetails = useMemo<SheetWithDetails[]>(() => {
    return sheets.map((s) => {
      const details = sheetDetails[s.id] || { rowCount: 0, colCount: 0, lastUpdated: "-" };
      return {
        id: String(s.id),
        name: s.name,
        cleanName: getCleanSheetName(s.id, s.name),
        rowCount: details.rowCount,
        colCount: details.colCount,
        lastUpdated: details.lastUpdated,
      };
    });
  }, [sheets, sheetDetails]);

  // Filter sheets by clean human-readable name or internal name
  const filteredSheets = useMemo(() => {
    const term = search.toLowerCase();
    return sheetsWithDetails.filter(
      (s) =>
        s.cleanName.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term)
    );
  }, [sheetsWithDetails, search]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl bg-[#040912] border border-cyan-500/30 rounded-xl p-6 relative overflow-hidden shadow-[0_0_50px_rgba(0,229,255,0.15)] flex flex-col max-h-[85vh]"
          >
            {/* Tech accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary" />

            {/* Modal Header */}
            <div className="border-b border-cyan-500/20 pb-3 mb-4 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-md font-black tracking-widest text-primary uppercase neon-text-primary">
                  Worksheet Selection Catalog
                </h3>
                <p className="text-[10px] text-slate-500">
                  Select a clean dataset grid to inspect or modify
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-rose-500 font-bold transition-colors text-xs border border-cyan-500/20 hover:border-rose-500/50 bg-[#070d19] px-2 py-1 rounded"
              >
                CLOSE
              </button>
            </div>

            {/* Search Box */}
            <div className="mb-4 shrink-0">
              <CyberInput
                type="text"
                placeholder="Search sheet names..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs"
              />
            </div>

            {/* Grid List area */}
            <div className="flex-1 overflow-y-auto pr-1">
              {loading && sheets.length === 0 ? (
                <div className="flex justify-center items-center py-16 text-xs text-primary animate-pulse uppercase tracking-widest">
                  SYNCHRONIZING SCHEMAS...
                </div>
              ) : filteredSheets.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500 uppercase tracking-widest">
                  No sheets matching query.
                </div>
              ) : (
                <div className="border border-cyan-500/10 rounded-lg overflow-hidden bg-black/30">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-cyan-950/20 text-primary border-b border-cyan-500/20 text-[10px] tracking-wider uppercase font-bold">
                        <th className="p-3">Sheet Name</th>
                        <th className="p-3 text-center">Rows</th>
                        <th className="p-3 text-center">Columns</th>
                        <th className="p-3 text-center">Last Updated</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSheets.map((sheet) => (
                        <tr
                          key={sheet.id}
                          onClick={() => onSelect(sheet.id)}
                          className="border-b border-cyan-500/5 hover:bg-cyan-500/5 transition-colors cursor-pointer"
                        >
                          <td className="p-3 font-bold text-text truncate max-w-[200px]" title={sheet.name}>
                            {sheet.cleanName}
                          </td>
                          <td className="p-3 text-center text-slate-300">
                            {loading && sheetDetails[sheet.id] === undefined ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              sheet.rowCount
                            )}
                          </td>
                          <td className="p-3 text-center text-slate-300">
                            {loading && sheetDetails[sheet.id] === undefined ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              sheet.colCount
                            )}
                          </td>
                          <td className="p-3 text-center text-[10px] text-slate-500">
                            {loading && sheetDetails[sheet.id] === undefined ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              sheet.lastUpdated
                            )}
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <CyberButton
                              onClick={() => onSelect(sheet.id)}
                              variant="primary"
                              size="sm"
                              className="py-1 px-3 text-[10px]"
                            >
                              OPEN
                            </CyberButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
