# Workbook Platform Gap Analysis

## Missing Capabilities

### 1. Rename Workbook
- **Status**: Not implemented
- **Impact**: Users cannot update workbook names after creation
- **Gap**: No `updateWorkbook()` function in `workbookService.ts`; no rename UI in `Workbooks.tsx`

### 2. Rename Worksheet
- **Status**: Not implemented
- **Impact**: Users cannot update worksheet titles after creation
- **Gap**: No `updateWorksheet()` function in `worksheetService.ts`; no rename UI

### 3. Hide Columns
- **Status**: Not implemented
- **Impact**: Users cannot control column visibility in the grid
- **Gap**: No `is_hidden` column in `column_metadata`; no UI toggle

### 4. Reorder Columns
- **Status**: Partially implemented (order stored)
- **Impact**: Column order is parsed from file but not user-reorderable
- **Gap**: No `reorderColumns()` function; no drag-drop UI

### 5. Search Rows
- **Status**: Not implemented
- **Impact**: Users cannot find specific data in large worksheets
- **Gap**: No search input/filter logic; `getRows()` fetches all rows

### 6. Filter Rows
- **Status**: Not implemented
- **Impact**: Users cannot filter data by conditions
- **Gap**: No filter state management; no WHERE clause generation

### 7. Pagination
- **Status**: Not implemented
- **Impact**: Large datasets load all rows - performance issue
- **Gap**: No limit/offset in `getRows()`; no pagination controls

### 8. Workbook Metadata
- **Status**: Stub only
- **Impact**: No detailed view of workbook properties
- **Gap**: `WorkbookDetail.tsx` is empty; no metadata fetch logic

## Database Structure Gaps

### Missing Columns

| Table | Missing Column | Purpose |
|-------|---------------|---------|
| `column_metadata` | `is_hidden` (boolean) | Track column visibility state |
| `column_metadata` | `is_required` (boolean) | Validation hints |
| `worksheets` | `is_deleted` (boolean) | Soft delete support |
| `workbooks` | `description` (text) | User notes |
| `workbooks` | `tags` (text[]) | Categorization |

### Missing Indexes

- No index for searching `worksheet_rows` by data content
- No full-text search index on row data

### Required Service Functions

| Service | Missing Function | Purpose |
|---------|-----------------|---------|
| `workbookService.ts` | `updateWorkbook(id, name)` | Rename workbook |
| `workbookService.ts` | `deleteWorkbook(id)` | Soft/hard delete |
| `workbookService.ts` | `getWorkbook(id)` | Fetch single workbook |
| `worksheetService.ts` | `updateWorksheet(id, title)` | Rename worksheet |
| `worksheetService.ts` | `deleteWorksheet(id)` | Delete worksheet |
| `worksheetService.ts` | `reorderColumns(wsId, order[])` | Reorder columns |
| `worksheetService.ts` | `hideColumn(wsId, colName, hidden)` | Toggle visibility |
| `worksheetService.ts` | `getWorksheet(id)` | Single worksheet fetch |

### Required UI Components

| Page | Missing Component | Purpose |
|------|-------------------|---------|
| `Workbooks.tsx` | Rename button/action | Workbook rename modal |
| `Workbooks.tsx` | Metadata view column | Description/tags display |
| `Worksheet.tsx` | Search bar | Row search input |
| `Worksheet.tsx` | Filter panel | Row filter builder |
| `Worksheet.tsx` | Pagination controls | Page navigation |

## Priority Recommendations

### High Priority (Immediate)
1. **Search Rows** - Essential for usability
2. **Rename Workbook** - Basic management feature
3. **Rename Worksheet** - Basic management feature

### Medium Priority (Next)
4. **Hide Columns** - Grid customization
5. **Workbook Metadata** - Detail view

### Low Priority (Future)
6. **Filter Rows** - Advanced data manipulation
7. **Reorder Columns** - Column ordering
8. **Pagination** - Large dataset support