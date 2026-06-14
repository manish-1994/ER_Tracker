import React, { FC, ReactNode } from "react";

export interface CyberColumn {
  header: string;
  accessor: string;
  render?: (row: any) => ReactNode;
  Header?: () => ReactNode;
}

interface CyberTableProps {
  columns: CyberColumn[];
  data: any[];
  className?: string;
  actions?: (row: any) => ReactNode;
}

export const CyberTable: FC<CyberTableProps> = ({ 
  columns, 
  data, 
  className = "", 
  actions 
}) => {
  return (
    <div className={`w-full overflow-hidden border border-cyan-500/20 bg-black/40 backdrop-blur-md rounded-xl shadow-lg ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-sm">
          <thead>
            <tr className="bg-primary/5 border-b border-cyan-500/25">
              {columns.map((col) => (
                <th
                  key={col.accessor}
                  className="px-6 py-4 text-primary font-bold uppercase tracking-wider text-xs border-r border-cyan-500/10"
                >
                  {col.Header ? col.Header() : col.header}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-4 text-primary font-bold uppercase tracking-wider text-xs text-center">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-500/10">
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (actions ? 1 : 0)} 
                  className="px-6 py-10 text-center text-muted"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr 
                  key={row.id || i} 
                  className="hover:bg-primary/5 transition-colors duration-200"
                >
                  {columns.map((col) => (
                    <td 
                      key={col.accessor} 
                      className="px-6 py-3 text-text border-r border-cyan-500/10"
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-3 text-center">
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
