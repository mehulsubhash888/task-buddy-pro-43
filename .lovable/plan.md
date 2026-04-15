

## Plan: Manager/Employee Role System with Office Rooms

### Overview
Add a role selection screen before login. **Managers** get all existing features plus the ability to create "offices" (like classrooms) with unique codes, view employee online/offline status, and assign tasks to employees. **Employees** enter an office code to join a manager's office and receive assigned tasks.

This requires database tables (Lovable Cloud) for offices, memberships, and task assignments since multiple users need to share data in real-time.

### Database Schema (4 new tables via migrations)

1. **`offices`** — Manager-created rooms
   - `id` (uuid, PK), `name` (text), `code` (text, unique, 6-char random), `manager_username` (text), `created_at` (timestamptz)

2. **`office_members`** — Employees who joined an office
   - `id` (uuid, PK), `office_id` (uuid, FK → offices), `username` (text), `is_online` (boolean, default false), `last_seen` (timestamptz), `joined_at` (timestamptz)

3. **`assigned_tasks`** — Tasks assigned by manager to employees
   - `id` (uuid, PK), `office_id` (uuid, FK → offices), `assigned_to` (text), `assigned_by` (text), `description` (text), `resources` (text), `assigned_date` (text), `target_date` (text), `completed_date` (text, nullable), `status` (text, default 'pending')

> Note: Since auth is local (localStorage-based, no Supabase Auth), RLS will be kept open for these tables. Security relies on the app logic and usernames.

### New Components

1. **`RoleSelectScreen`** — Shown before AuthScreen. Two cards: "Manager" and "Employee". 
   - Manager → proceeds to existing login/signup flow
   - Employee → shows an input for office code, then a simplified login/signup

2. **`ManagerDashboard`** (new page/section) — Added to Index for managers:
   - "Create Office" button → generates random 6-char code, saves to DB
   - List of manager's offices with member counts
   - Click office → shows employee list (online/offline status with green/grey dot), and an "Assign Task" dialog

3. **`EmployeeView`** — For employees after joining:
   - Shows tasks assigned to them by the manager
   - Can mark tasks complete
   - Heartbeat: updates `is_online`/`last_seen` every 30s via Supabase upsert

4. **`AssignTaskDialog`** — Manager picks an employee from the office member list, fills in task details + deadline

### Flow

```text
App Start
  └─ RoleSelectScreen
       ├─ "I'm a Manager" → AuthScreen (login/signup) → Index (existing + office management)
       └─ "I'm an Employee" → Office Code Input → AuthScreen → EmployeeView (assigned tasks)
```

### State Management Changes

- Store role (`manager`|`employee`) and `officeId` in localStorage alongside the session
- `src/pages/Index.tsx` checks role:
  - Manager: existing task UI + new "My Offices" section
  - Employee: assigned tasks view with ability to complete them
- Enable Supabase Realtime on `office_members` and `assigned_tasks` for live updates

### Files to Create/Edit

| File | Action |
|------|--------|
| **Migration SQL** | Create `offices`, `office_members`, `assigned_tasks` tables |
| `src/components/RoleSelectScreen.tsx` | New — role selection UI |
| `src/components/ManagerOffice.tsx` | New — office creation, member list, task assignment |
| `src/components/EmployeeView.tsx` | New — assigned tasks list for employees |
| `src/components/AssignTaskDialog.tsx` | New — form for manager to assign task to employee |
| `src/lib/local-auth.ts` | Add role + officeId to session storage |
| `src/pages/Index.tsx` | Route to correct view based on role |
| `src/components/AuthScreen.tsx` | Minor — accept role prop to adjust flow |

### Technical Details

- Office codes: 6-character alphanumeric, generated client-side, checked for uniqueness via DB
- Online/offline: Employee sends heartbeat (upsert `last_seen` + `is_online=true` every 30s). Manager queries members; if `last_seen` > 60s ago, show as offline
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE office_members, assigned_tasks;`

