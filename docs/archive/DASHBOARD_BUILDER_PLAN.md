# Dashboard Builder Design Plan

This document details the configuration model, aggregation calculations, and storage architecture that powers the custom workbook dashboard builder.

---

## 1. Widget Configuration Specification

Dashboard widgets are modeled as structured JSON configuration elements:

```typescript
interface WidgetConfig {
  id: string; // Unique widget session identifier
  title: string; // Custom description banner
  type: "kpi" | "table" | "bar" | "pie" | "line" | "donut" | "area"; // Recharts rendering format
  workbookId: string; // Source workbook identifier
  workbookName: string; // Cached workbook name
  sheetId: string; // Source sheet identifier
  sheetName: string; // Cached sheet name
  valueCol: string; // Primary value column
  valueCols?: string[]; // Multiple columns selected for side-by-side comparison
  groupByCol: string; // Column used to aggregate keys (x-axis)
  aggregation: "count" | "sum" | "avg" | "none"; // Operation type
}
```

---

## 2. Multi-Column Telemetry Aggregation

The builder form supports checkboxes for selecting multiple measure columns (e.g. comparing Interviews and Submissions side-by-side grouped by Recruiter name). 

When a chart renders:
1.  The reduction engine processes each selected column independently.
2.  Visualizations render a series (multiple lines, multiple bars, or multiple areas) on the same chart, automatically mapping distinct colors from the HSL neon palette.
3.  The dynamic Table Widget displays columns side-by-side in a responsive monospaced grid.

---

## 3. User Assignments and Privacy

Widgets are assigned by administrators to specific user nodes:
*   The mapping is indexed in local storage: `User ID -> WidgetConfig[]`.
*   When a user logs in, they only see their assigned dashboards on the main landing page.
*   This ensures data privacy and targeted metrics for different user clearance tiers.
