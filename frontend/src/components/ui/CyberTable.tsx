import React, { FC, ReactNode } from "react";

export interface PremiumColumn {
  header: string;
  accessor: string;
  render?: (row: any) => ReactNode;
  Header?: () => ReactNode;
}

interface PremiumTableProps {
  columns: PremiumColumn[];
  data: any[];
  className?: string;
  actions?: (row: any) => ReactNode;
}

export const PremiumTable: FC<PremiumTableProps> = ({ 
  columns, 
  data, 
  className = "", 
  actions 
}) => {
  return (
    <div className={`w-full overflow-hidden glass-panel rounded-lg shadow-lg ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-sm">
          <thead>
            <tr className="table-header-fluent border-b border-secondary/20">
              {columns.map((col) => (
<th
                   key={col.accessor}
                   className="px-4 py-3 text-[var(--text)] font-semibold text-xs border-r border-secondary/20"
                 >
                  {col.Header ? col.Header() : col.header}
                </th>
              ))}
{actions && (
                 <th className="px-4 py-3 text-[var(--text)] font-semibold text-xs text-center">
                   Actions
                 </th>
               )}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary/15">
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (actions ? 1 : 0)} 
                  className="px-6 py-10 text-center text-secondary"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr 
                  key={row.id || i} 
                  className="table-row-fluent transition-colors duration-200"
                >
                  {columns.map((col) => (
<td 
                        key={col.accessor} 
                        className="px-4 py-2.5 text-[var(--text)] border-r border-secondary/15"
                      >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Keep CyberTable as alias for backward compatibility
export const CyberTable = PremiumTable;