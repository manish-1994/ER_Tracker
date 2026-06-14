# Data Cleanup Studio

This document describes the design and editing capabilities of the Excel-like Data Cleanup grid.

## Core Capabilities

### 1. View & Inline Editing
- Admins can view row datasets in a high-density, scrollable grid matching the Cyberpunk HUD design.
- Double-clicking a grid cell starts an active inline edit. Cell values are updated immediately in the database (or locally cached values if using the local fallback) on blurring input fields or pressing Enter.

### 2. Search & Filtering
- **Global Row Search**: Allows searching for substrings in any cell value.
- **Column-Specific Filters**: Adds a text filtering row below the header names, allowing search restrictions on specific columns.

### 3. Sorting
- Click headers to toggle sort orders: Ascending, Descending, or None. Supports both string sorting and numerical sorting logic.

### 4. Row Deletions & Undo Deletion
- Single row deletion buttons on each row.
- **Bulk Delete**: Multi-select rows using checkboxes to delete all selected rows in a single click.
- **Undo deletion**: Provides an 8-second visual prompt allowing admins to restore deleted rows.

### 5. Column Mutations
- **Renaming**: Update column headers inline. Renames update the metadata configurations immediately without breaking existing chart accessors.
- **Hiding**: Hide columns dynamically.
- **Reordering**: Move columns left or right, updating their display index sequence.
