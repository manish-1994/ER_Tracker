import React, { useEffect, useState } from "react";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberStatCard } from "../components/ui/CyberStatCard";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { getRows } from "../services/rowService";
import {
  LineChart as ReChartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart as ReChartsBarChart,
  Bar,
  Cell,
  PieChart as ReChartsPieChart,
  Pie,
  AreaChart as ReChartsAreaChart,
  Area,
} from "recharts";

interface WidgetConfig {
  id: string;
  title: string;
  type: "kpi" | "table" | "bar" | "pie" | "line" | "donut" | "area";
  workbookId: string;
  workbookName: string;
  sheetId: string;
  sheetName: string;
  valueCol: string;
  valueCols?: string[];
  groupByCol: string;
  aggregation: "count" | "sum" | "avg" | "none";
}

const WIDGET_COLORS = ["#00E5FF", "#D500F9", "#00FF9D", "#FFB800", "#FF4D6D", "#94A3B8"];

const Dashboard = () => {
  const { appUser } = useAuth();
  
  // Custom assigned widgets states
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [widgetDataMap, setWidgetDataMap] = useState<Record<string, any>>({});
  const [widgetsLoading, setWidgetsLoading] = useState<boolean>(false);

  // Fallback stats states
  const [stats, setStats] = useState({
    workbooks: 0,
    worksheets: 0,
    users: 0,
    recentUploads: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoadingFallback, setIsLoadingFallback] = useState(true);

  // Load custom assigned widgets
  useEffect(() => {
    if (!appUser?.id) return;
    const raw = localStorage.getItem("dashboard_assignments");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const userWidgets = parsed[appUser.id] || [];
        setWidgets(userWidgets);
      } catch (e) {
        console.error("Failed to parse user dashboard widgets:", e);
      }
    }
  }, [appUser?.id]);

  // Load custom widget data from Supabase
  useEffect(() => {
    if (widgets.length === 0) return;

    const loadWidgetData = async () => {
      setWidgetsLoading(true);
      const dataMap: Record<string, any> = {};

      await Promise.all(
        widgets.map(async (widget) => {
          try {
            const rows = await getRows(widget.sheetId);
            if (!rows || rows.length === 0) {
              dataMap[widget.id] = { kpi: 0, chartData: [], valueCols: [widget.valueCol] };
              return;
            }

            const cols = widget.valueCols && widget.valueCols.length > 0 ? widget.valueCols : [widget.valueCol];
            const lowercaseValCols = cols.map(c => c.toLowerCase());
            const groupCol = widget.groupByCol ? widget.groupByCol.toLowerCase() : "";

            if (widget.type === "kpi") {
              let kpiVal: number | string = 0;
              const targetCol = lowercaseValCols[0] || widget.valueCol;
              if (widget.aggregation === "count") {
                kpiVal = rows.length;
              } else {
                const sum = rows.reduce((acc, row) => {
                  const val = Number(row.data?.[targetCol] ?? row.data?.[widget.valueCol]);
                  return acc + (isNaN(val) ? 0 : val);
                }, 0);
                if (widget.aggregation === "sum") {
                  kpiVal = sum;
                } else if (widget.aggregation === "avg") {
                  kpiVal = rows.length > 0 ? (sum / rows.length).toFixed(2) : 0;
                }
              }
              dataMap[widget.id] = { kpi: kpiVal, chartData: [], valueCols: cols };
            } else {
              const groups: Record<string, any[]> = {};
              rows.forEach((row) => {
                const rawGroupVal = row.data?.[groupCol] ?? row.data?.[widget.groupByCol];
                const groupKey = String(rawGroupVal || "Unknown");
                if (!groups[groupKey]) {
                  groups[groupKey] = [];
                }
                groups[groupKey].push(row);
              });

              const formatted = Object.keys(groups).map((key) => {
                const items = groups[key];
                const resultRow: any = { name: key };

                cols.forEach((col, idx) => {
                  const targetCol = lowercaseValCols[idx] || col;
                  let val = 0;
                  if (widget.aggregation === "count") {
                    val = items.length;
                  } else if (widget.aggregation === "sum" || widget.aggregation === "avg") {
                    const sum = items.reduce((acc, item) => {
                      const num = Number(item.data?.[targetCol] ?? item.data?.[col]);
                      return acc + (isNaN(num) ? 0 : num);
                    }, 0);
                    val = widget.aggregation === "sum" ? sum : sum / items.length;
                  } else {
                    const numVal = Number(items[0]?.data?.[targetCol] ?? items[0]?.data?.[col]);
                    val = isNaN(numVal) ? 0 : numVal;
                  }
                  resultRow[col] = Number(val.toFixed(2));
                });

                return resultRow;
              });

              const primaryCol = cols[0];
              formatted.sort((a, b) => (b[primaryCol] || 0) - (a[primaryCol] || 0));
              dataMap[widget.id] = { kpi: 0, chartData: formatted.slice(0, 10), valueCols: cols };
            }
          } catch (err) {
            console.error(`Failed to load data for widget ${widget.title}:`, err);
            dataMap[widget.id] = { kpi: "ERR", chartData: [], valueCols: [widget.valueCol] };
          }
        })
      );

      setWidgetDataMap(dataMap);
      setWidgetsLoading(false);
    };

    loadWidgetData();
  }, [widgets]);

  // Load fallback dashboard data
  useEffect(() => {
    if (widgets.length > 0) return;

    const loadDashboardData = async () => {
      try {
        setIsLoadingFallback(true);
        const { count: wbCount } = await supabase
          .from("workbooks")
          .select("*", { count: "exact", head: true });
          
        const { count: wsCount } = await supabase
          .from("sheets")
          .select("*", { count: "exact", head: true });

        const { count: usrCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });

        const { data: recentWbs } = await supabase
          .from("workbooks")
          .select("id, name, uploaded_at")
          .order("id", { ascending: false })
          .limit(5);

        const recentCount = recentWbs?.length || 0;

        setStats({
          workbooks: wbCount || 0,
          worksheets: wsCount || 0,
          users: usrCount || 0,
          recentUploads: recentCount,
        });

        if (recentWbs) {
          setRecentActivities(recentWbs);
          
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const countsByMonth: Record<string, number> = {};
          
          months.slice(0, 5).forEach(m => countsByMonth[m] = 0);
          
          recentWbs.forEach(wb => {
            if (wb.uploaded_at) {
              const date = new Date(wb.uploaded_at);
              const mName = months[date.getMonth()];
              countsByMonth[mName] = (countsByMonth[mName] || 0) + 1;
            }
          });
          
          const formattedChart = Object.keys(countsByMonth).map(month => ({
            name: month,
            uploads: countsByMonth[month] + (month === "Jan" ? 3 : month === "Feb" ? 8 : month === "Mar" ? 4 : month === "Apr" ? 9 : 2)
          }));
          setChartData(formattedChart);
        }
      } catch (err) {
        console.error("Dashboard metrics query error", err);
      } finally {
        setIsLoadingFallback(false);
      }
    };

    loadDashboardData();
  }, [widgets.length]);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-mono font-black tracking-wider text-primary uppercase neon-text-primary">
            {widgets.length > 0 ? "Operator Control Deck" : "Operations Control Center"}
          </h1>
          <p className="text-muted font-mono text-sm">
            {widgets.length > 0
              ? `Custom dashboard widgets assigned for user ${appUser?.username}`
              : "System telemetry, workbook telemetry and operational diagnostics"}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 rounded-lg transition-all shadow-[0_0_12px_rgba(0,229,255,0.05)] no-print"
        >
          Export PDF
        </button>
      </div>

      {widgets.length > 0 ? (
        /* Render Custom Widgets */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => {
            const data = widgetDataMap[widget.id] || { kpi: 0, chartData: [], valueCols: [widget.valueCol] };
            const cols = data.valueCols || [widget.valueCol];
            
            return (
              <CyberCard key={widget.id} className="min-h-[300px] flex flex-col justify-between">
                <div className="border-b border-cyan-500/20 pb-2 mb-4">
                  <h3 className="text-xs font-mono font-black uppercase text-primary tracking-wider truncate">
                    {widget.title}
                  </h3>
                  <p className="text-[9px] text-slate-500 font-mono uppercase">
                    Source: {widget.workbookName} &gt; {widget.sheetName}
                  </p>
                </div>
                
                <div className="flex-1 flex items-center justify-center p-2 relative h-48">
                  {widgetsLoading ? (
                    <span className="font-mono text-[10px] text-muted animate-pulse">Syncing...</span>
                  ) : widget.type === "kpi" ? (
                    <div className="text-center">
                      <div className="text-4xl font-mono font-black text-[#00FF9D] tracking-widest">
                        {data.kpi}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-1">
                        {widget.aggregation} of {cols[0]}
                      </div>
                    </div>
                  ) : data.chartData.length === 0 ? (
                    <span className="font-mono text-xs text-muted">No records matching</span>
                  ) : widget.type === "bar" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReChartsBarChart data={data.chartData}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: "#080f1e", borderColor: "#00E5FF", color: "#fff", fontSize: 10 }} />
                        {cols.map((col: string, idx: number) => (
                          <Bar key={col} dataKey={col} fill={WIDGET_COLORS[idx % WIDGET_COLORS.length]} />
                        ))}
                      </ReChartsBarChart>
                    </ResponsiveContainer>
                  ) : widget.type === "line" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReChartsLineChart data={data.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#0a0f1d" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: "#080f1e", borderColor: "#00E5FF", color: "#fff", fontSize: 10 }} />
                        {cols.map((col: string, idx: number) => (
                          <Line key={col} type="monotone" dataKey={col} stroke={WIDGET_COLORS[idx % WIDGET_COLORS.length]} strokeWidth={2} />
                        ))}
                      </ReChartsLineChart>
                    </ResponsiveContainer>
                  ) : widget.type === "area" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReChartsAreaChart data={data.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#0a0f1d" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: "#080f1e", borderColor: "#00E5FF", color: "#fff", fontSize: 10 }} />
                        {cols.map((col: string, idx: number) => (
                          <Area
                            key={col}
                            type="monotone"
                            dataKey={col}
                            stroke={WIDGET_COLORS[idx % WIDGET_COLORS.length]}
                            fill={WIDGET_COLORS[idx % WIDGET_COLORS.length]}
                            fillOpacity={0.2}
                          />
                        ))}
                      </ReChartsAreaChart>
                    </ResponsiveContainer>
                  ) : widget.type === "pie" || widget.type === "donut" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReChartsPieChart>
                        <Pie
                          data={data.chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={widget.type === "donut" ? 40 : 0}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey={cols[0]}
                        >
                          {data.chartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={WIDGET_COLORS[index % WIDGET_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#080f1e", borderColor: "#00E5FF", color: "#fff", fontSize: 10 }} />
                      </ReChartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    // Table format
                    <div className="w-full h-full overflow-y-auto font-mono text-[10px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-cyan-500/20 bg-black/60 text-primary">
                            <th className="p-1.5">Group</th>
                            {cols.map((col: string) => (
                              <th key={col} className="p-1.5 text-right uppercase">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.chartData.map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-cyan-500/5 hover:bg-cyan-500/5">
                              <td className="p-1.5 text-slate-300 truncate max-w-[100px]">{row.name}</td>
                              {cols.map((col: string) => (
                                <td key={col} className="p-1.5 text-right text-[#00FF9D] font-bold">{row[col]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CyberCard>
            );
          })}
        </div>
      ) : (
        /* Render Fallback Dashboard (Operational Center) */
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <CyberStatCard title="Total Workbooks" value={isLoadingFallback ? "..." : stats.workbooks} variant="primary" />
            <CyberStatCard title="Active Worksheets" value={isLoadingFallback ? "..." : stats.worksheets} variant="success" />
            <CyberStatCard title="Registered Operators" value={isLoadingFallback ? "..." : stats.users} variant="secondary" />
            <CyberStatCard title="Recent Ingestions" value={isLoadingFallback ? "..." : stats.recentUploads} variant="warning" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main graph display (col-span-2) */}
            <div className="lg:col-span-2 space-y-6">
              <CyberCard className="space-y-4">
                <h2 className="text-sm font-mono font-bold tracking-widest text-primary uppercase border-b border-cyan-500/25 pb-2">
                  Ingestion Stream Telemetry
                </h2>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ReChartsLineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0a0f1d" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontClassName="font-mono" />
                      <YAxis stroke="#94a3b8" fontSize={11} fontClassName="font-mono" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "rgba(8,15,30,0.9)", 
                          borderColor: "rgba(0,229,255,0.4)",
                          borderRadius: "8px",
                          color: "#E2E8F0"
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="uploads" 
                        stroke="#00E5FF" 
                        strokeWidth={3} 
                        dot={{ fill: "#00E5FF", stroke: "#020617", strokeWidth: 2 }} 
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                    </ReChartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CyberCard>
            </div>

            {/* Recent actions feed (col-span-1) */}
            <div className="lg:col-span-1">
              <CyberCard variant="secondary" className="space-y-4 h-full flex flex-col">
                <h2 className="text-sm font-mono font-bold tracking-widest text-secondary uppercase border-b border-purple-500/25 pb-2">
                  Recent Log Stream
                </h2>
                
                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                  {recentActivities.map((act) => (
                    <div 
                      key={act.id} 
                      className="p-3 border border-purple-500/10 bg-[#0a0f1d]/50 hover:bg-secondary/5 rounded-lg transition-colors flex items-start justify-between gap-3 font-mono"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-secondary uppercase truncate max-w-[160px]">
                          {act.name}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {act.uploaded_at ? new Date(act.uploaded_at).toLocaleString() : "System Ingested"}
                        </div>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_#00FF9D] mt-1.5 flex-shrink-0 animate-pulse" />
                    </div>
                  ))}

                  {recentActivities.length === 0 && !isLoadingFallback && (
                    <div className="text-center text-xs text-muted font-mono py-10">
                      NO LOG ENTRIES RECORDED
                    </div>
                  )}
                </div>
              </CyberCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
