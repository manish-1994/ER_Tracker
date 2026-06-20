# SCHEMA_UNIFICATION_PLAN.md

## Section 1 – Files Affected

### Services (Primary Changes Required)
| File | Lines to Change | Nature of Change |
|------|-----------------|------------------|
| `frontend/src/services/workbookService.ts` | 55, 77, 78, 81, 163, 200 | `sheets` → `worksheets` |
| `frontend/src/services/worksheetService.ts` | 32, 42, 53, 65, 88, 98, 113, 122, 137, 147, 148, 275, 276, 281, 295, 296, 304, 305 | `sheets` → `worksheets`, `columns` → `column_metadata` |
| `frontend/src/services/rowService.ts` | 100, 101, 102, 126, 206, 276 | `sheets` → `worksheets`, `columns` → `column_metadata` |
| `frontend/src/services/storageService.ts` | 57, 163, 246, 415, 438, 443, 461 | `sheets` → `worksheets` |

### Components (No Changes Required)
- `CyberTable`, `CyberInput`, etc. use props/data from services - no direct table references

## Section 2 – Table Mappings

### Worksheets (sheets → worksheets)
| Frontend Column | Schema Column | Notes |
|-----------------|---------------|-------|
| `id` | `id` | UUID |
| `workbook_id` | `workbook_id` | UUID |
| `name` | `title` | Column rename |
| `records_table_name` | NOT in schema | Add column to worksworksheets or worksheets |
| `records_table_name` | NOT in schema | Missing column |

### Columns (columns → column_metadata)
| Frontend Column | Schema Column | Notes |
|-----------------|---------------|-------|
| `id` | `id` | UUID |
| `sheet_id` | `worksheet_id` | Column rename |
| `name` | `name` | Same |
| `display_name` | `display_name` | Same |
| `inferred_type` | `data_type` | Column rename |
| `display_order` | `order` | Column rename |
| `is_hidden` | NOT in schema | Add column |

## Section 3 – Service Mappings

### workbookService.ts
```ts
// Current (lines 55, 77, 78, 81, 150, 163, 200)
.from("sheets") → .from("worksheets")

// SELECT with records_table_name may need adjustment
.select("id, records_table_name") → SELECT exists in schema
```

### worksheetService.ts
```ts
// Current (multiple locations)
.from("sheets") → .from("worksheets")
.from("columns") → .from("column_metadata")

// Column mappings
workbook_id → workbook_id (same)
name → title
inferred_type → data_type  
display_order → order
sheet_id → worksheet_id
is_hidden → ADD TO SCHEMA
```

### rowService.ts
```ts
// Current
.from("sheets") → .from("worksheets")
.from("columns") → .from("column_metadata")

// Column mappings
sheet_id → worksheet_id
```

## Section 4 – Risk Assessment

### High Risk
- `records_table_name` column missing from `worksheets` schema
- `is_hidden` column missing from `column_metadata` schema
- Breaking change: all worksheet queries will fail if tables don't exist

### Medium Risk
- `display_order` → `order` rename affects worksheet display
- `is_hidden` functionality will break without schema update

### Low Risk
- Simple table name replacement for existing columns
- Frontend already has localStorage fallback for missing tables

## Section 5 – Implementation Order

### Phase 1: Schema Updates (Database First)
1. Add `records_table_name` column to `worksheets` (if not exists)
2. Add `is_hidden` column to `column_metadata` (if not exists)
3. Add RLS policies for `worksheets` and `column_metadata` if missing

### Phase 2: Service Code Updates
1. Update `workbookService.ts` - replace `sheets` with `worksheets`
2. Update `worksheetService.ts` - replace `sheets`/`columns` with `worksheets`/`column_metadata`
3. Update `rowService.ts` - replace `sheets`/`columns` with `worksheets`/`column_metadata`
4. Update `storageService.ts` - replace `sheets` with `worksheets`

### Phase 3: Verification
1. Apply Supabase schema changes
2. Run application tests
3. Verify worksheet data loads correctly
4. Verify column metadata maps correctly

---

*Audit performed without database connection. Verify actual Supabase schema before implementation.*