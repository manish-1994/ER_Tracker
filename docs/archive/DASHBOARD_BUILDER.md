# No-Code Dashboard Builder

This document details the no-code widget creator and visualization engine.

## Widget Configurations

Admins can build custom visual dashboards using the builder page by selecting:
- **Workbook Source**: The source file registry.
- **Worksheet Table**: The active sheet node.
- **Grouping/X-Axis Column**: The category field.
- **Value/Y-Axis Columns**: The data field(s). Allows selecting multiple columns for multi-series charts.
- **Aggregation Operation**: Sum, Count, or Average.
- **Chart Layout Type**:
  - **KPI Cards**: Displays total counts.
  - **Tables**: Renders tabbed raw data columns.
  - **Bar Charts**: Renders comparisons.
  - **Pie / Donut Charts**: Renders proportions.
  - **Line / Area Charts**: Renders progression.

## UI Rendering
- Custom layouts are stored dynamically in the user's dashboard registry.
- Supports grid sizing and responsive grid columns.
- Uses Recharts to render styled SVG visual telemetry.
