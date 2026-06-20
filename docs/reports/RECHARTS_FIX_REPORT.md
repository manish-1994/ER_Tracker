# RECHARTS FIX REPORT

## Issue
`The width(-1) and height(-1) of chart should be greater than 0` — caused by `ResponsiveContainer` using `height="100%"` when the parent container had no explicit height, resulting in Recharts being unable to calculate dimensions.

## Root Cause
Recharts' `ResponsiveContainer` with `height="100%"` requires the parent element to have an explicit height. When flex-based layouts don't provide explicit dimensions, the container resolves to 0x0.

## Files Modified

### 1. DashboardBuilder.tsx
- Changed preview chart div from `h-64` to `w-full min-h-[350px]`
- All `ResponsiveContainer` instances changed from `height="100%"` to `height={300}`
- Each chart wrapped in `<div className="w-full h-full" style={{ minHeight: 300 }}>`

### 2. Dashboard.tsx
- Widget chart container changed from `h-48` to `style={{ minHeight: 250 }}`
- All widget `ResponsiveContainer` instances changed from `height="100%"` to `height={220}`
- Added empty data guard for non-KPI widgets
- Fallback chart container changed from `height: 300` to `minHeight: 300` with explicit `height={300}`

### 3. Reports.tsx
- Chart container changed from `h-48` to `w-full` with `style={{ minHeight: 200 }}`
- `ResponsiveContainer` changed from `height="100%"` to `height={200}`
- Empty state now has explicit `height: 200`

## Pattern Used
```
<div className="w-full" style={{ minHeight: 350 }}>
  <ResponsiveContainer width="100%" height={350}>
    ...
  </ResponsiveContainer>
</div>
```

## Verification
- ✅ All `height="100%"` removed from `ResponsiveContainer` in page components
- ✅ All parent containers have explicit `minHeight` values
- ✅ Empty data handled safely (no rendering charts with no data)
- ✅ Build succeeds
