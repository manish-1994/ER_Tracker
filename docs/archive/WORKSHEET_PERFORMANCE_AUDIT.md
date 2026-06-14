# WORKSHEET PERFORMANCE AUDIT (Phase 3A)

**Date:** 2026-06-10

## 1. Current Architecture

```
Worksheet Page (frontend/src/pages/Worksheet.tsx)
   ↓
React Query (fetchRows) → Supabase `getRows` service
   ↓
Data stored in React state (`rows`, `localRows`)
   ↓
`CyberTable` component renders rows/columns
   ↓
Inline editing, header editing, add‑row, audit‑history modals
```

- Columns are generated dynamically with `React.useMemo`.
- Row data is cached locally to avoid refetch on each edit.
- RBAC checks are performed on mount.

## 2. Identified Bottlenecks

| Area | Symptom | Root Cause |
|------|---------|------------|
| Full‑table rerenders | Every state change (header edit, cell edit) triggers the whole `CyberTable` to re‑render. | `columns` memo depends on `rows` and `editingCell`, creating new column objects on each render. |
| Large array operations | Slow UI when > 5 k rows. | `localRows` updates use `Array.map` which iterates the entire list. |
| Missing pagination | All rows loaded at once. | Query fetches the entire worksheet without `limit/offset`. |
| Missing virtualization | Browser freezes on large worksheets. | `CyberTable` renders all rows into the DOM; no virtual scrolling. |
| N+1 queries | Potential extra queries when loading audit logs per row. | Not currently present but could appear in future features. |
| Re‑render causes | Editing a cell updates `localRows`, causing the entire table to re‑render. | State update not scoped; whole array reference changes. |
| Missing memoization | Header editing recreates column objects. | `React.useMemo` dependencies include `editingCell` and `headerMap`. |
| React Query stale data | After a row edit, `refetch` re‑fetches all rows. | No cache merge on mutation. |

## 3. Performance Score (out of 10)

- Render Efficiency: **4 / 10** (full table renders, no virtualization)
- Data Fetching: **5 / 10** (single query, no pagination)
- State Management: **5 / 10** (local cache helps but causes whole‑array updates)
- **Overall:** **4.7 / 10**

## 4. Recommended Improvements (ordered by impact)

1. **Virtualized Table** – Replace `CyberTable` with a virtual scrolling library (e.g., `react‑virtualized` or `tanstack‑virtual`).
   *Impact:* Reduces DOM nodes from thousands to ~30 visible rows → ~80 % UI speed gain on large worksheets.
2. **Server‑side Pagination / Infinite Scroll** – Modify `getRows` to accept `limit`/`offset` and load pages on demand.
   *Impact:* Cuts data transfer & memory usage; faster initial load.
3. **Refine Column Memoization** – Split static column definitions from dynamic header map. Depend only on `headerMap` and permission flags.
   *Impact:* Prevents column recreation on every cell edit.
4. **Scoped Row Updates** – Use immutable update helpers (e.g., Immer) to modify only the edited row while keeping the array reference unchanged for unchanged rows.
   *Impact:* Reduces React diff work; improves edit latency.
5. **React Query Cache Updates** – After `createRow`, `updateRow`, or `deleteRow`, update the query cache directly (`queryClient.setQueryData`) instead of calling `refetch`.
   *Impact:* Eliminates full‑table refetch; instant UI feedback.
6. **Debounce / Throttle UI Actions** – Debounce filter and sort inputs to avoid rapid re‑queries.
   *Impact:* Lowers unnecessary network calls.
7. **Lazy‑load Audit Logs** – Load audit logs only when the audit modal opens and paginate them.
   *Impact:* Prevents large payloads on worksheet load.

## 5. Estimated Impact

| Improvement | Expected Load Time Reduction | Development Effort |
|-------------|-----------------------------|--------------------|
| Virtualized Table | 70‑80 % faster render for > 5k rows | Medium (replace table component) |
| Pagination | Initial load drops from ~2 s → < 500 ms | Low (backend query change) |
| Memoization & Scoped Updates | Minor UI jitter removed | Low |
| Query Cache Updates | Remove full‑refetch spikes | Low‑Medium |
| Debounce Filters/Sort | Prevent overload during rapid input | Low |
| Lazy‑load Audit Logs | Defensive for future scaling | Low |

## 6. Priority Order

1. **Virtualized Table** – highest ROI for large worksheets.
2. **Pagination** – quick win to limit data size.
3. **Memoization & Scoped Updates** – easy fixes, immediate smoothness.
4. **React Query Cache Updates** – improves responsiveness after mutations.
5. **Debounce Filters/Sort** – prevents overload during rapid input.
6. **Lazy‑load & paginate audit logs** – defensive for future scaling.

---

*Generated on 2026‑06‑10.*
