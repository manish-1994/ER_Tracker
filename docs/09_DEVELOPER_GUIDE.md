# Developer Guide

## Project Structure

```
frontend/
├── package.json              # Dependencies: React 18.3, Supabase JS 2.108, bcryptjs 2.4.3
├── src/
│   ├── main.tsx             # App entry point
│   ├── App.tsx              # Routing configuration
│   ├── config/
│   │   └── supabase.ts      # Supabase client initialization
│   ├── context/
│   │   ├── AuthContext.tsx  # Authentication state management
│   │   └── PermissionContext.tsx
│   ├── hooks/
│   │   ├── usePermissions.ts
│   │   └── useAuth.ts
│   ├── layouts/
│   │   ├── MainLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Workbooks.tsx
│   │   ├── Worksheet.tsx
│   │   ├── UserWorkspace.tsx
│   │   ├── WorkspaceWorkbook.tsx
│   │   ├── UserManagement.tsx
│   │   ├── RoleManagement.tsx
│   │   ├── AuditHistory.tsx
│   │   ├── Settings.tsx
│   │   └── StorageManagement.tsx
│   ├── services/
│   │   ├── authHelper.ts
│   │   ├── workbookService.ts
│   │   ├── worksheetService.ts
│   │   ├── rowService.ts
│   │   ├── workspaceService.ts
│   │   ├── roleService.ts
│   │   ├── userService.ts
│   │   ├── auditService.ts
│   │   └── supabase.ts
│   ├── components/
│   │   ├── ProtectedRoute.tsx
│   │   ├── Header.tsx
│   │   ├── Modal.tsx
│   │   ├── UserForm.tsx
│   │   ├── RoleSelect.tsx
│   │   ├── SheetSelector.tsx
│   │   ├── RootRedirect.tsx
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   └── ui/
│   │       ├── CyberButton.tsx
│   │       ├── CyberCard.tsx
│   │       ├── CyberDrawer.tsx
│   │       ├── CyberInput.tsx
│   │       ├── CyberModal.tsx
│   │       ├── CyberProgressModal.tsx
│   │       ├── CyberSelect.tsx
│   │       ├── CyberStatCard.tsx
│   │       ├── CyberTable.tsx
│   │       └── PageHeader.tsx
│   ├── utils/
│   │   └── exportUtils.ts
│   └── docs/
│       └── icons.tsx
├── supabase/
│   └── migrations/
│       ├── 20260613000000_create_workspace_assignments.sql
│       ├── 20260613000001_add_records_table_name_to_sheets.sql
│       └── 20260614000000_create_workspace_notes.sql
└── public/
```

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React | 18.3.0 |
| Language | TypeScript | 5.4.0 |
| Build | Vite | 5.2.0 |
| Backend | Supabase | 2.108.1 |
| State | @tanstack/react-query | 5.0.0 |
| UI | Tailwind CSS | 3.4.0 |
| Icons | Lucide React | (inferred) |

## Setup Instructions

1. Install Node.js 20+
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Configure Supabase:
   - Create `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Run migrations in Supabase SQL editor
5. Start development server:
   ```bash
   npm run dev
   ```

## Environment Variables

```
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

## Key Patterns

### Authentication Pattern
**File**: `context/AuthContext.tsx`
- Uses React Context + localStorage
- Custom bcrypt password comparison (authHelper.ts:122)
- Does NOT use Supabase Auth (no email/password auth)

### Service Pattern
All services follow:
1. Supabase client import from `../config/supabase.ts`
2. Try/catch with error handling
3. localStorage fallback for missing tables

### Form Pattern
- `UserForm.tsx` encapsulates user create/edit
- `Modal.tsx` wraps forms with CyberModal styling
- Validation happens before service calls

### Component Pattern
- shadcn/ui-inspired Cyber* components
- Props for styling variants
- Consistent TypeScript interfaces

## Common Tasks

### Adding a New Permission
1. Add to `roleService.ts:DEFAULT_MATRIX` (lines 117-163)
2. Add route guard in `App.tsx` if needed
3. Add UI check in relevant component

### Adding a New Workbook Feature
1. Update `workbookService.ts`
2. Add page in `pages/`
3. Update `App.tsx` routes

### Creating a Dynamic Table Migration
Follow pattern in `20260613000001_add_records_table_name_to_sheets.sql`:
```sql
CREATE TABLE public.records_[uuid] (
  id BIGINT PRIMARY KEY,
  -- dynamic columns from spreadsheet
);
```

## Testing
Run tests with:
```bash
npm run test  # Not configured - @playwright/test installed but no test scripts
```