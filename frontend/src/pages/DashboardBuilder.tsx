import React, { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { getUsers } from "../services/userService";
import { getWorkbooks } from "../services/workbookService";
import { getWorksheets, getColumns } from "../services/worksheetService";
import { getRows } from "../services/rowService";
import { logAudit } from "../services/auditService";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberInput } from "../components/ui/CyberInput";
import { CyberBadge } from "../components/ui/CyberBadge";
import {
  BarChart as ReChartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as ReChartsPieChart,
  Pie,
  Cell,
  LineChart as ReChartsLineChart,
  Line,
  AreaChart as ReChartsAreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import {
  getWidgetsForUser,
  createWidgetAssignment,
  deleteWidgetAssignment,
} from "../services/dashboardWidgetService";

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

const WIDGET_COLORS = ["var(--info)", "var(--secondary)", "var(--success)", "var(--warning)", "var(--danger)", "var(--text-muted)"];

export const DashboardBuilder: React.FC = () => {
  const toast = useToast();
  const { appUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [workbooks, setWorkbooks] = useState<any[]>([]);
  const [worksheets, setWorksheets] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  
  // Selection states
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [assignedWidgets, setAssignedWidgets] = useState<WidgetConfig[]>([]);
  
  // Form states for new widget
  const [widgetTitle, setWidgetTitle] = useState<string>("");
  const [widgetType, setWidgetType] = useState<WidgetConfig["type"]>("kpi");
  const [selWbId, setSelWbId] = useState<string>("");
  const [selWsId, setSelWsId] = useState<string>("");
  const [selValCols, setSelValCols] = useState<string[]>([]);
  const [selGroupCol, setSelGroupCol] = useState<string>("");
  const [selAgg, setSelAgg] = useState<WidgetConfig["aggregation"]>("count");
  
  // Preview / live data states
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewKpi, setPreviewKpi] = useState<string | number>("");
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  // Hydrate initial list of users and workbooks
  useEffect(() => {
    const init = async () => {
      try {
        const uList = await getUsers();
        setUsers(uList || []);
        
        const wList = await getWorkbooks();
        setWorkbooks(wList || []);
        
        if (uList && uList.length > 0) {
          setSelectedUserId(String(uList[0].id));
        }
      } catch (err) {
        console.error("Dashboard builder init error:", err);
        toast.error("Failed to retrieve operational nodes.");
      }
    };
    init();
  }, []);

  // Fetch worksheets when selected workbook changes
  useEffect(() => {
    if (!selWbId) {
      setWorksheets([]);
      setSelWsId("");
      return;
    }
    const loadWs = async () => {
      try {
        const ws = await getWorksheets(selWbId);
        setWorksheets(ws || []);
        if (ws && ws.length > 0) {
          setSelWsId(String(ws[0].id));
        } else {
          setSelWsId("");
        }
      } catch (e) {
        toast.error("Failed to load worksheets.");
      }
    };
    loadWs();
  }, [selWbId]);

  // Fetch columns when selected worksheet changes
  useEffect(() => {
    if (!selWsId) {
      setColumns([]);
      setSelValCols([]);
      setSelGroupCol("");
      return;
    }
    const loadCols = async () => {
      try {
        const cols = await getColumns(selWsId);
        setColumns(cols || []);
        if (cols && cols.length > 0) {
          setSelValCols([cols[0].name]);
          setSelGroupCol(cols[0].name);
        } else {
          setSelValCols([]);
          setSelGroupCol("");
        }
      } catch (e) {
        toast.error("Failed to load columns schema.");
      }
    };
    loadCols();
  }, [selWsId]);

  // Load user assignments when selected user changes
  useEffect(() => {
    if (!selectedUserId) {
      setAssignedWidgets([]);
      return;
    }
    const loadWidgets = async () => {
      try {
        const dbWidgets = await getWidgetsForUser(selectedUserId);
        const localWidgets: WidgetConfig[] = dbWidgets.map((w: any) => ({
          id: w.id,
          title: w.title,
          type: w.widget_type,
          workbookId: w.workbook_id,
          workbookName: w.workbook_name || "Workbook",
          sheetId: w.worksheet_id,
          sheetName: w.worksheet_name || "Sheet",
          valueCol: w.value_col,
          valueCols: w.value_cols || [w.value_col],
          groupByCol: w.group_by_col || "",
          aggregation: w.aggregation,
        }));
        setAssignedWidgets(localWidgets);
      } catch (e) {
        console.error("Failed to load widgets from Supabase:", e);
        setAssignedWidgets([]);
      }
    };
    loadWidgets();
  }, [selectedUserId]);

  // Update preview live data
  useEffect(() => {
    if (!selWsId || selValCols.length === 0) {
      setPreviewData([]);
      setPreviewKpi("");
      return;
    }

    const fetchPreview = async () => {
      setIsPreviewLoading(true);
      try {
        const rows = await getRows(selWsId);
        if (!rows || rows.length === 0) {
          setPreviewData([]);
          setPreviewKpi("0");
          return;
        }

        const lowercaseValCols = selValCols.map(c => c.toLowerCase());
        const lowercaseGroupCol = selGroupCol.toLowerCase();

        // Aggregate
        if (widgetType === "kpi") {
          let kpiVal: number | string = 0;
          const targetCol = lowercaseValCols[0] || selValCols[0];
          if (selAgg === "count") {
            kpiVal = rows.length;
          } else {
            const sum = rows.reduce((acc, row) => {
              const val = Number(row.data?.[targetCol] ?? row.data?.[selValCols[0]]);
              return acc + (isNaN(val) ? 0 : val);
            }, 0);
            if (selAgg === "sum") {
              kpiVal = sum;
            } else if (selAgg === "avg") {
              kpiVal = rows.length > 0 ? (sum / rows.length).toFixed(2) : 0;
            }
          }
          setPreviewKpi(kpiVal);
        } else {
          // Chart grouping
          const groups: Record<string, any[]> = {};
          rows.forEach((row) => {
            const rawGroupVal = row.data?.[lowercaseGroupCol] ?? row.data?.[selGroupCol];
            const groupKey = String(rawGroupVal || "Unknown");
            if (!groups[groupKey]) {
              groups[groupKey] = [];
            }
            groups[groupKey].push(row);
          });

          const formatted = Object.keys(groups).map((key) => {
            const items = groups[key];
            const resultRow: any = { name: key };

            selValCols.forEach((col, idx) => {
              const targetCol = lowercaseValCols[idx] || col;
              let val = 0;
              if (selAgg === "count") {
                val = items.length;
              } else if (selAgg === "sum" || selAgg === "avg") {
                const sum = items.reduce((acc, item) => {
                  const num = Number(item.data?.[targetCol] ?? item.data?.[col]);
                  return acc + (isNaN(num) ? 0 : num);
                }, 0);
                val = selAgg === "sum" ? sum : sum / items.length;
              } else {
                const numVal = Number(items[0]?.data?.[targetCol] ?? items[0]?.data?.[col]);
                val = isNaN(numVal) ? 0 : numVal;
              }
              resultRow[col] = Number(val.toFixed(2));
            });

            return resultRow;
          });

          // Sort descending by first column value
          const primaryCol = selValCols[0];
          formatted.sort((a, b) => (b[primaryCol] || 0) - (a[primaryCol] || 0));
          setPreviewData(formatted.slice(0, 10)); // Top 10
        }
      } catch (err) {
        console.error("Preview loading error:", err);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    const debounce = setTimeout(fetchPreview, 300);
    return () => clearTimeout(debounce);
  }, [selWsId, selValCols, selGroupCol, selAgg, widgetType]);

  const handleSaveWidget = async () => {
    if (!selectedUserId) {
      toast.warning("Select user target node first.");
      return;
    }
    if (!widgetTitle.trim()) {
      toast.warning("Specify widget telemetry description.");
      return;
    }
    if (!selWbId || !selWsId) {
      toast.warning("Complete target workbook/sheet selections.");
      return;
    }
    if (selValCols.length === 0) {
      toast.warning("Select at least one column measure.");
      return;
    }

    const wb = workbooks.find(w => String(w.id) === selWbId);
    const ws = worksheets.find(s => String(s.id) === selWsId);

    const result = await createWidgetAssignment({
      user_id: selectedUserId,
      title: widgetTitle,
      widget_type: widgetType,
      workbook_id: selWbId,
      worksheet_id: selWsId,
      workbook_name: wb?.name || "Workbook",
      worksheet_name: ws?.name || "Sheet",
      value_col: selValCols[0],
      value_cols: selValCols,
      group_by_col: selGroupCol,
      aggregation: selAgg,
      created_by: appUser?.id?.toString() || "0",
    });

    if (result) {
      const newWidget: WidgetConfig = {
        id: result.id,
        title: result.title,
        type: result.widget_type,
        workbookId: result.workbook_id,
        workbookName: result.workbook_name || wb?.name || "Workbook",
        sheetId: result.worksheet_id,
        sheetName: result.worksheet_name || ws?.name || "Sheet",
        valueCol: result.value_col,
        valueCols: result.value_cols || [result.value_col],
        groupByCol: result.group_by_col || "",
        aggregation: result.aggregation,
      };

      setAssignedWidgets([...assignedWidgets, newWidget]);

      await logAudit({
        user_id: appUser?.id?.toString() || "0",
        worksheet_id: selWsId,
        action: "dashboard_create",
        new_value: `Created widget "${widgetTitle}" for user ${selectedUserId}`,
      });

      toast.success("Widget telemetry appended successfully");
    } else {
      toast.error("Failed to save widget assignment.");
    }

    // Clear form
    setWidgetTitle("");
  };

  const handleDeleteWidget = async (widgetId: string) => {
    const target = assignedWidgets.find(w => w.id === widgetId);
    const updated = assignedWidgets.filter(w => w.id !== widgetId);
    setAssignedWidgets(updated);

    if (await deleteWidgetAssignment(widgetId)) {
      // Log audit action
      if (target) {
        await logAudit({
          user_id: appUser?.id?.toString() || "0",
          worksheet_id: target.sheetId,
          action: "dashboard_delete",
          old_value: `Removed widget "${target.title}" for user ${selectedUserId}`,
        });
      }
      toast.success("Widget telemetry unassigned");
    } else {
      toast.error("Failed to delete widget.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard Builder" 
        subtitle="Dynamic chart aggregation and user-specific dashboard routing" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection & Construction Panel */}
        <div className="lg:col-span-1 space-y-6">
          <CyberCard className="space-y-4">
            <h2 className="text-sm font-sans font-bold tracking-widest text-text uppercase border-b border-primary/25 pb-2">
              User Assignment
            </h2>
            
            {/* User Dropdown */}
            <div className="space-y-2">
              <label className="block text-[10px] font-sans tracking-wider text-muted uppercase font-bold">
                Target User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface)] border border-primary/20 text-[var(--text)] font-sans text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-lg transition-all"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.roles?.map((r: any) => typeof r === "object" ? r.name : r).join(", ") || "Viewer"})
                  </option>
                ))}
              </select>
            </div>
          </CyberCard>

          <CyberCard variant="secondary" className="space-y-4">
            <h2 className="text-sm font-sans font-bold tracking-widest text-text uppercase border-b border-secondary/25 pb-2">
              Construct Widget
            </h2>

            {/* Widget Form */}
            <div className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-secondary uppercase">
                  Widget Title
                </label>
                <CyberInput
                  type="text"
                  placeholder="e.g. Recruiters Interview Status"
                  value={widgetTitle}
                  onChange={(e) => setWidgetTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-secondary uppercase">
                  Widget Format Type
                </label>
                <select
                  value={widgetType}
                  onChange={(e) => setWidgetType(e.target.value as WidgetConfig["type"])}
                  className="w-full px-3 py-2 bg-white border border-secondary/20 text-text text-xs focus:outline-none focus:border-secondary rounded-lg transition-all"
                >
                  <option value="kpi">KPI</option>
                  <option value="table">Data Table</option>
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="donut">Donut Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-secondary uppercase">
                  Source Workbook
                </label>
                <select
                  value={selWbId}
                  onChange={(e) => setSelWbId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-secondary/20 text-text text-xs focus:outline-none focus:border-secondary rounded-lg transition-all"
                >
                  <option value="">Select Workbook...</option>
                  {workbooks.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {selWbId && (
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-secondary uppercase">
                    Source Sheet
                  </label>
                  <select
                    value={selWsId}
                    onChange={(e) => setSelWsId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-secondary/20 text-text text-xs focus:outline-none focus:border-secondary rounded-lg transition-all"
                  >
                    <option value="">Select Sheet...</option>
                    {worksheets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selWsId && columns.length > 0 && (
                <>
                  {/* Multiple Columns Selection */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-secondary uppercase">
                      Measure Columns (Y-Axis)
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-2 bg-[var(--surface)]/50 border border-secondary/10 rounded-lg max-h-24 overflow-y-auto">
                      {columns.map((c) => (
                        <label key={c.name} className="flex items-center space-x-2 text-[10px] text-muted">
                          <input
                            type="checkbox"
                            checked={selValCols.includes(c.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelValCols([...selValCols, c.name]);
                              } else {
                                setSelValCols(selValCols.filter((name) => name !== c.name));
                              }
                            }}
                            className="w-3.5 h-3.5 text-secondary bg-black border-secondary/30 rounded focus:ring-secondary focus:ring-1"
                          />
                          <span className="truncate">{c.display_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {widgetType !== "kpi" && (
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-secondary uppercase">
                        Group By Axis Column (X-Axis)
                      </label>
                      <select
                        value={selGroupCol}
                        onChange={(e) => setSelGroupCol(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-secondary/20 text-text text-xs focus:outline-none focus:border-secondary rounded-lg transition-all"
                      >
                        {columns.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.display_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-secondary uppercase">
                      Telemetry Aggregation Type
                    </label>
                    <select
                      value={selAgg}
                      onChange={(e) => setSelAgg(e.target.value as WidgetConfig["aggregation"])}
className="w-full px-3 py-2 bg-[var(--surface)] border border-secondary/20 text-[var(--text)] text-xs focus:outline-none focus:border-secondary rounded-lg transition-all"
                    >
                      <option value="count">Count</option>
                      {widgetType === "kpi" || columns.find(c => c.name === selValCols[0])?.data_type === "number" ? (
                        <>
                          <option value="sum">Sum (numeric)</option>
                          <option value="avg">Average (numeric)</option>
                        </>
                      ) : null}
                      {widgetType !== "kpi" && <option value="none">Raw Column Value (First)</option>}
                    </select>
                  </div>
                </>
              )}

              <CyberButton
                onClick={handleSaveWidget}
                variant="secondary"
                className="w-full mt-4"
              >
                Assemble & Assign Widget
              </CyberButton>
            </div>
          </CyberCard>
        </div>

        {/* Live Preview & Assignments List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Preview Panel */}
          <CyberCard className="space-y-4">
            <h2 className="text-sm font-sans font-bold tracking-widest text-text uppercase border-b border-primary/25 pb-2">
              Preview
            </h2>
            
            <div className="w-full min-h-[350px] border border-dashed border-accent/10 rounded-xl bg-black/40 flex items-center justify-center relative p-6">
              {isPreviewLoading ? (
                <span className="font-sans text-muted text-xs animate-pulse">Loading preview...</span>
              ) : selWsId ? (
                widgetType === "kpi" ? (
                  <div className="text-center">
                    <div className="text-4xl font-sans font-black tracking-widest text-success mb-2">
                      {previewKpi}
                    </div>
                    <div className="text-[10px] font-sans tracking-widest text-slate-400 uppercase">
                      {widgetTitle || "KPI Value"}
                    </div>
                  </div>
                ) : previewData.length === 0 ? (
                  <span className="font-sans text-xs text-muted">No records match filters</span>
                ) : widgetType === "bar" ? (
                  <div className="w-full h-full" style={{ minHeight: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <ReChartsBarChart data={previewData}>
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} />
                      <YAxis stroke="var(--text-muted)" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card-background)", borderColor: "var(--info)", color: "#fff", fontSize: 10 }} />
                      {selValCols.map((col, idx) => (
                        <Bar key={col} dataKey={col} fill={WIDGET_COLORS[idx % WIDGET_COLORS.length]} />
                      ))}
                    </ReChartsBarChart>
                  </ResponsiveContainer>
                  </div>
                ) : widgetType === "line" ? (
                  <div className="w-full h-full" style={{ minHeight: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <ReChartsLineChart data={previewData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-background)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} />
                      <YAxis stroke="var(--text-muted)" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card-background)", borderColor: "var(--info)", color: "#fff", fontSize: 10 }} />
                      {selValCols.map((col, idx) => (
                        <Line key={col} type="monotone" dataKey={col} stroke={WIDGET_COLORS[idx % WIDGET_COLORS.length]} strokeWidth={2.5} />
                      ))}
                    </ReChartsLineChart>
                  </ResponsiveContainer>
                  </div>
                ) : widgetType === "area" ? (
                  <div className="w-full h-full" style={{ minHeight: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <ReChartsAreaChart data={previewData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-background)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} />
                      <YAxis stroke="var(--text-muted)" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card-background)", borderColor: "var(--info)", color: "#fff", fontSize: 10 }} />
                      {selValCols.map((col, idx) => (
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
                  </div>
                ) : widgetType === "pie" || widgetType === "donut" ? (
                  <div className="w-full h-full" style={{ minHeight: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <ReChartsPieChart>
                      <Pie
                        data={previewData}
                        cx="50%"
                        cy="50%"
                        innerRadius={widgetType === "donut" ? 50 : 0}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey={selValCols[0] || "value"}
                      >
                        {previewData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={WIDGET_COLORS[index % WIDGET_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "var(--card-background)", borderColor: "var(--info)", color: "#fff", fontSize: 10 }} />
                    </ReChartsPieChart>
                  </ResponsiveContainer>
                  </div>
                ) : (
                  // Table format
                  <div className="w-full h-full overflow-y-auto font-mono text-[11px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-accent/20 bg-black/60 text-primary">
                          <th className="p-2">Group</th>
                          {selValCols.map((col) => (
                            <th key={col} className="p-2 text-right uppercase">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr key={idx} className="border-b border-accent/5 hover:bg-accent/5">
                            <td className="p-2 text-slate-300">{row.name}</td>
                            {selValCols.map((col) => (
                              <td key={col} className="p-2 text-right text-success font-bold">{row[col]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <span className="font-sans text-xs text-muted">Awaiting configuration...</span>
              )}
            </div>
          </CyberCard>

          {/* Assigned Widgets List */}
          <CyberCard variant="secondary" className="space-y-4">
            <h2 className="text-sm font-sans font-bold tracking-widest text-secondary uppercase border-b border-secondary/25 pb-2">
              Assigned Widgets
            </h2>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {assignedWidgets.map((w) => (
                <div 
                  key={w.id} 
                  className="p-3 border border-accent/15 bg-theme-card/50 hover:bg-accent/5 rounded-lg flex items-center justify-between gap-4 font-sans text-xs transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-black text-primary text-[11px] uppercase">{w.title}</div>
                    <div className="text-[10px] text-slate-500 uppercase">
                      Type: <span className="text-secondary">{w.type}</span> | Source: <span className="text-success">{w.workbookName} &gt; {w.sheetName}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWidget(w.id)}
                    className="px-2 py-0.5 border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 text-[9px] rounded font-bold transition-all"
                  >
                    Unassign
                  </button>
                </div>
              ))}

              {assignedWidgets.length === 0 && (
                <div className="text-center text-xs text-muted font-sans py-12">
                  No widgets assigned to this user.
                </div>
              )}
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  );
};

export default DashboardBuilder;