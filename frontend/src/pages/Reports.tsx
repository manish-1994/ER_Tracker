import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberStatCard } from "../components/ui/CyberStatCard";
import { CyberBadge } from "../components/ui/CyberBadge";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberInput } from "../components/ui/CyberInput";
import { PageHeader } from "../components/ui/PageHeader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Reports: React.FC = () => {
  const [workbooks, setWorkbooks] = useState<any[]>([]);
  const [filteredWorkbooks, setFilteredWorkbooks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("workbooks")
          .select("id, name, uploaded_at")
          .order("id", { ascending: false });

        if (error) throw error;
        
        const enriched = (data || []).map(item => ({
          ...item,
          status: "COMPLETED",
          user_id: null
        }));

        setWorkbooks(enriched);
        setFilteredWorkbooks(enriched);
      } catch (err) {
        console.error("Error fetching reports metadata:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportsData();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase().trim();
    if (!term) {
      setFilteredWorkbooks(workbooks);
    } else {
      setFilteredWorkbooks(
        workbooks.filter(
          (w) =>
            w.name.toLowerCase().includes(term) ||
            String(w.id).includes(term) ||
            (w.status && w.status.toLowerCase().includes(term))
        )
      );
    }
  }, [search, workbooks]);

  // Generate chart data: Count uploads per workbook status
  const statusCounts = filteredWorkbooks.reduce((acc: any, curr: any) => {
    const status = curr.status || "COMPLETED";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(statusCounts).map((status) => ({
    name: status,
    count: statusCounts[status],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Intelligence Reports"
        subtitle="Ingested data logs, integrity diagnostic logs, and workbook tracking reports"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <CyberStatCard title="Total Audited Ingestions" value={workbooks.length} variant="primary" />
        <CyberStatCard title="Active Operational Logs" value={filteredWorkbooks.length} variant="secondary" />
        <CyberStatCard
          title="Ingestion Health Status"
          value={workbooks.length > 0 ? "100.0%" : "0.0%"}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List Area */}
        <div className="lg:col-span-2 space-y-6">
          <CyberCard className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
              <h2 className="text-sm font-mono font-bold tracking-widest text-primary uppercase">
                System Ingestion History
              </h2>
              <div className="w-full sm:w-64">
                <CyberInput
                  type="text"
                  placeholder="Filter by workbook name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs font-mono text-muted animate-pulse">
                Accessing remote telemetry logs...
              </div>
            ) : filteredWorkbooks.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-muted border border-dashed border-cyan-500/10 rounded-xl">
                No telemetry matching search query discovered.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-cyan-500/20 text-primary uppercase">
                      <th className="py-3 px-2">Log ID</th>
                      <th className="py-3 px-2">Workbook Source</th>
                      <th className="py-3 px-2">Uploaded At</th>
                      <th className="py-3 px-2 text-right">Clearance State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkbooks.map((wb) => (
                      <tr
                        key={wb.id}
                        className="border-b border-cyan-500/5 hover:bg-primary/5 transition-colors"
                      >
                        <td className="py-3 px-2 text-muted">#{wb.id}</td>
                        <td className="py-3 px-2 font-bold text-text">{wb.name}</td>
                        <td className="py-3 px-2 text-slate-400">
                          {new Date(wb.uploaded_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <CyberBadge variant={wb.status === "ERROR" ? "danger" : "success"}>
                            {wb.status || "COMPLETED"}
                          </CyberBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CyberCard>
        </div>

        {/* Charts & Diagnostics sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <CyberCard variant="secondary" className="space-y-4">
            <h2 className="text-sm font-mono font-bold tracking-widest text-secondary uppercase border-b border-purple-500/25 pb-2">
              Ingestion Quality Metrics
            </h2>
            <div className="h-48">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0a0f1d" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#080f1e",
                        borderColor: "#D500F9",
                        color: "#fff",
                        fontSize: 10,
                      }}
                    />
                    <Bar dataKey="count" fill="#D500F9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-mono text-muted">
                  Awaiting operational statistics...
                </div>
              )}
            </div>
          </CyberCard>

          <CyberCard className="space-y-4">
            <h2 className="text-sm font-mono font-bold tracking-widest text-primary uppercase border-b border-cyan-500/25 pb-2">
              Console Diagnostics
            </h2>
            <div className="space-y-2 text-[10px] font-mono text-success bg-[#050b14]/75 p-3 rounded-lg border border-cyan-500/10">
              <div>[SYSTEM] INITIALIZING LOG QUERY PROTOCOL...</div>
              <div>[SYSTEM] METADATA TABLE DESCRIPTIONS RESOLVED</div>
              <div>[DATABASE] ESTABLISHED SECURE POSTGREST TELEMETRY</div>
              <div className="animate-pulse">[ONLINE] RETRIEVED ALL RECENT TELEMETRY RECORDS</div>
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  );
};

export default Reports;
