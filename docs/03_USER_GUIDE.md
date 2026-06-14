# User Guide

## Getting Started

### Login
1. Navigate to the application URL
2. Enter your username and password on the login screen (Login.tsx)
3. Click "INITIALIZE ACCESS" to authenticate
4. On successful login, you'll be redirected to `/dashboard`

**Note**: If you check "REMEMBER SIGN-IN PROTOCOL", your username will be saved in localStorage for future sessions.

### Dashboard Access
- **Route**: `/dashboard`
- **Purpose**: System overview with metrics and recent activity
- **Visible Elements**:
  - Total Workbooks count
  - Active Worksheets count
  - Registered Operators count
  - Recent Ingestions count
  - Line chart showing upload trends

**Buttons/Actions**:
- No actions available; read-only overview
- "Export PDF" button triggers browser print dialog

## Workspace Navigation

### Accessing Your Workspace
- **Route**: `/workspace`
- **Purpose**: View all workbooks assigned to you

**Process**:
1. Navigate to `/workspace` from the sidebar or by clicking the workspace icon
2. The page loads assigned workbooks via `getAssignedWorkbooks()` (workspaceService.ts:114-136)
3. Each workbook shows as a clickable card

**Visible Stats**:
- Assigned Workbooks count
- Assigned Sheets count (sum of all sheet row counts)
- My Notes count
- Recent Actions count

### Accessing an Assigned Workbook
- **Route**: `/workspace/workbook/{id}`
- **Purpose**: View worksheets within an assigned workbook

**Process**:
1. Click any workbook card on `/workspace`
2. URL changes to `/workspace/workbook/{workbookId}`
3. Page displays worksheets with row/column counts
4. Click any worksheet to navigate to `/worksheets/{sheetId}`

**Note**: If you see "No workbooks assigned yet", contact your SuperAdmin to request access.

## Worksheet Data View

### Accessing a Worksheet
- **Route**: `/worksheets/{id}`
- **Purpose**: View and edit worksheet records

**On Load**:
1. Page fetches columns from `columns` table
2. Page fetches rows from dynamic `records_<sheetId>` table (rowService.ts:208-273)
3. Realtime subscription established (lines 188-217 in Worksheet.tsx)

### Available Views

#### Card View
- **Default**: Shows records as cards with first 3 columns visible
- **Toggle**: Click "Cards" button in view mode controls
- **Each Card Shows**: Column values, "+N more fields" indicator, "Open Record →" link

#### Table View
- **Toggle**: Click "Table" button in view mode controls
- **Features**: Inline editing, sorting, filtering

### Search and Filters

#### Global Search
- **Location**: Search input in header deck
- **Behavior**: Filters rows where any cell value contains the search term
- **Code**: Worksheet.tsx lines 1158-1166

#### Smart Views
- **Options**: All, My Records, Pending, Completed, High Priority, Recently Updated
- **Location**: Filter bar below header
- **Behavior**:
  - My Records: Filters where `data.recruiter` or `data.owner` equals current user
  - Pending: `status` column does not contain "complete" or "done"
  - Completed: `status` column contains "complete" or "done"
  - High Priority: `priority` column contains "high" or "urgent"
  - Recently Updated: Records updated in last 24 hours

#### Column Filters
- **Toggle**: "Show Filters" / "Hide Filters" button
- **Behavior**: Each column gets a filter input; filters match substring

#### Sorting
- **Click**: Column header to sort
- **Behavior**: First click = ascending, second = descending, third = unsorted
- **Indicator**: ▲ for ascending, ▼ for descending

## Creating Records

### Opening Add Row Modal
1. Click "+ Add Row Entry" button (visible if you have add permission)
2. Modal shows all columns as form fields

### Field Types
- **Text**: Standard text input
- **Number**: Number input
- **Date**: Date picker
- **DateTime**: DateTime picker
- **Boolean**: Select with True/False options
- **Single Select**: Dropdown with defined options
- **Multi Select**: Checkbox group
- **Email**: Email input type
- **Phone**: Tel input type
- **URL**: URL input type
- **Long Text**: Textarea

### Required Fields
- Marked with red asterisk (*) in form
- Submission blocked if required field is empty

## Editing Records

### Inline Cell Editing
1. Click any cell in the table (if you have edit permission)
2. Cell becomes editable input
3. Press Enter or click outside to commit
4. Escape cancels without saving

### Detail Panel Editing
1. Click any row card or the "Open Record →" link
2. Side panel (CyberDrawer) opens with all field editors
3. Edit values and click "Update" to save
4. Quick Actions buttons for Status, Priority, Tag fields

## Deleting Records

### Single Delete
1. Click "Delete" button on a row (visible if you have delete permission)
2. Confirmation modal appears
3. Click "Delete" to confirm
4. Undo option appears for 8 seconds (lines 55-56, 1068-1089)

### Bulk Delete
1. Select multiple rows using checkboxes
2. "BULK DELETE" button appears in selection bar
3. Click button and confirm
4. All selected rows deleted

## Adding Notes to Records

### Opening Notes
1. Open record detail panel (CyberDrawer)
2. Scroll to "Public Notes (Shared)" and "My Private Notes" sections

### Public Notes
- Visible to all users with worksheet access
- Add via textarea and "Add Public Note" button
- Edit your own notes or delete as Admin/SuperAdmin

### Private Notes
- Visible only to the note author
- Add via textarea and "Add Private Note" button
- Edit/delete your own private notes only

## Exports

### Excel Export
- **Button**: "XLSX" in header deck
- **Output**: .xlsx file with all visible columns and current page data

### CSV Export
- **Button**: "CSV" in header deck
- **Output**: .csv file with all visible columns and current page data

### PDF Export
- **Button**: "PDF" in header deck
- **Output**: Browser print dialog (prints current view)

## Profile

### Accessing Profile
- **Route**: `/profile`
- **Purpose**: View your account information
- **Note**: Currently no edit functionality visible in Profile.tsx

## Logout

### Logging Out
- Click "Logout" in sidebar (lines 128 in App.tsx)
- Clears localStorage "appUser" and redirects to `/login`