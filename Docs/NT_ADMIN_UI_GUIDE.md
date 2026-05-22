# Non-Teaching Staff — Admin UI Guide

> This document covers every part of the admin dashboard that touches Non-Teaching (NT) staff: workflow templates, adding NT accounts, editing them in the faculty list, and how all the pieces connect end-to-end.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Database Tables](#2-database-tables)
3. [Backend API Endpoints](#3-backend-api-endpoints)
4. [Step 0 — Set Up Designations](#4-step-0--set-up-designations)
5. [Step 1 — Create Workflow Templates](#5-step-1--create-workflow-templates)
6. [Step 2 — Assign Templates (Optional)](#6-step-2--assign-templates-optional)
7. [Step 3 — Add an NT Staff Account](#7-step-3--add-an-nt-staff-account)
8. [Step 4 — Edit an NT Staff Account](#8-step-4--edit-an-nt-staff-account)
9. [Template Resolution Priority](#9-template-resolution-priority)
10. [Supported Approval Chains](#10-supported-approval-chains)
11. [Reviewer Designation Matching](#11-reviewer-designation-matching)
12. [Frontend Files Reference](#12-frontend-files-reference)
13. [Known Limitations](#13-known-limitations)

---

## 1. System Overview

Non-teaching staff submit appraisal forms that travel through a configurable approval chain before reaching the VC. The chain is defined by a **Workflow Template** — an ordered list of **Designations** (role titles like "Reporting Officer", "Registrar", "VC").

When a staff member submits their form, the backend:
1. Resolves which template applies to them (see [Template Resolution Priority](#9-template-resolution-priority)).
2. Creates a `NTWorkflowInstance` with one `NTWorkflowInstanceStep` per template step.
3. Sets the first step to `PENDING`; all others to `WAITING`.
4. Routes the form to the reviewer whose `designation` (on their `FacultyProfile`) matches the current `PENDING` step's designation name.

The chain advances each time a reviewer approves. When all steps are `APPROVED`, the instance becomes `COMPLETED`.

---

## 2. Database Tables

| Table | Purpose |
|---|---|
| `nt_designations` | Catalogue of role titles that can appear as steps (e.g. "Reporting Officer", "Registrar", "VC") |
| `nt_workflow_templates` | Named approval chains (e.g. "Standard NT Flow"). One can be marked `is_default`. |
| `nt_workflow_template_steps` | Ordered steps within a template. Each step references one designation. |
| `nt_workflow_assignments` | Maps a template to a staff email, role, or department. Controls which template applies to which staff. |
| `nt_workflow_instances` | Live approval record tied to one appraisal. Created when staff first submits. |
| `nt_workflow_instance_steps` | One row per step per instance. Tracks `status`, `reviewer_email`, `score`, `reviewed_at`. |
| `non_teaching_appraisals` | The appraisal record itself (scores, payload, status string). |
| `faculty_profiles` | Stores `reporting_officer_email`, `registrar_email`, `designation` — used for routing and reviewer matching. |

---

## 3. Backend API Endpoints

All endpoints require a valid JWT token in the `Authorization: Bearer <token>` header.

### Designations
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/nt-designations` | List all designations |
| POST | `/api/v1/admin/nt-designations` | Create a designation (`{ name, description? }`) |
| PUT | `/api/v1/admin/nt-designations/{id}` | Update a designation |
| DELETE | `/api/v1/admin/nt-designations/{id}` | Delete a designation (fails if used in an active template step) |

### Workflow Templates
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/nt-workflow-templates` | List templates with steps |
| POST | `/api/v1/admin/nt-workflow-templates` | Create template (`{ name, description?, is_default? }`) |
| PUT | `/api/v1/admin/nt-workflow-templates/{id}` | Rename/update a template |
| DELETE | `/api/v1/admin/nt-workflow-templates/{id}` | Delete (fails if it is the default) |
| PUT | `/api/v1/admin/nt-workflow-templates/{id}/set-default` | Mark as default |
| POST | `/api/v1/admin/nt-workflow-templates/{id}/steps` | Add a step (`{ designation_id, step_no, is_required }`) |
| PUT | `/api/v1/admin/nt-workflow-templates/{id}/steps/{step_no}` | Update a step |
| DELETE | `/api/v1/admin/nt-workflow-templates/{id}/steps/{step_no}` | Remove a step |
| PUT | `/api/v1/admin/nt-workflow-templates/{id}/reorder` | Reorder steps (`{ steps: [{step_no, designation_id}] }`) |

### Assignments
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/nt-workflow-assignments` | List all assignments |
| POST | `/api/v1/admin/nt-workflow-assignments` | Create assignment (`{ template_id, staff_email? OR appraisal_role? OR department? }`) |
| DELETE | `/api/v1/admin/nt-workflow-assignments/{id}` | Remove an assignment |

### Staff / Reviewers
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/reporting-officers` | List users with role `reporting_officer` |
| GET | `/api/v1/admin/registrars` | List users with role `registrar` |

### NT Appraisal Workflow (used by staff/reviewer portals)
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/non-teaching/workflow-template?role={role}` | Template steps for a role (used by admin preview) |
| GET | `/api/v1/non-teaching/workflow/{email}?academic_year={year}` | Live workflow instance for a staff member |

---

## 4. Step 0 — Set Up Designations

**Page:** Settings → Workflow Templates → Designations tab (or the Designations page if separately routed)

Before creating any templates you need a designation catalogue. Each designation is a role **title string** that must exactly match the `designation` field on a reviewer's `FacultyProfile` record.

**Standard designations to create:**

| Name | Who uses it |
|---|---|
| `Reporting Officer` | Users with `appraisal_role = reporting_officer` |
| `Registrar` | Users with `appraisal_role = registrar` |
| `VC` | Users with `appraisal_role = vc` |
| `Department Head` | Optional — for dept-head-first chains |

> **Critical:** The designation name in the template step must **exactly** match the `designation` field saved on the reviewer's profile. Case-sensitive. If a reviewer's profile says `"Reporting Officer"` but the template step says `"RO"`, they will not see the appraisal.

**How to set a reviewer's designation:**
1. Go to Faculty List.
2. Click the edit (pencil) icon on the reviewer's row.
3. In the Edit drawer, set the **Designation** field to exactly the same string as the designation in the template step.
4. Save.

---

## 5. Step 1 — Create Workflow Templates

**Page:** Navigation → Workflow Templates

A template is a named, ordered list of approval steps. Each step is one designation.

### Create a new template
1. Click **New Template**.
2. Enter a name (e.g. "Standard NT Flow") and optional description.
3. Save. The template card appears.

### Add steps to the template
1. Click **Edit Steps** on the template card.
2. In the modal, click **Add Step** and pick a designation from the dropdown.
3. Repeat for each step in order.
4. Use the ↑ / ↓ arrows to reorder. The order in the modal is the order approvals travel.
5. Click **Save** when done.

### Example templates to create

**Standard NT Flow** (Staff → RO → Registrar → VC)
- Step 1: Reporting Officer
- Step 2: Registrar
- Step 3: VC

**Direct to Registrar** (Staff → Registrar → VC)
- Step 1: Registrar
- Step 2: VC

**Direct to VC** (Staff → VC only)
- Step 1: VC

**Dept Head First** (Staff → Department Head → Registrar → VC)
- Step 1: Department Head
- Step 2: Registrar
- Step 3: VC

### Set a default template
One template should be marked as default. It is used for all NT staff who have no individual, department, or role assignment.

1. On the template card, click **Set as Default**.
2. Only one template can be default at a time. Setting a new default clears the old one.

---

## 6. Step 2 — Assign Templates (Optional)

**Page:** Workflow Templates → Assign button on a template card

Assignments let you override which template applies. They are optional — if no assignment matches a staff member, the default template is used.

### Assignment modes

| Mode | Field | When to use |
|---|---|---|
| **By Role** | `appraisal_role` | All staff with a certain role use this template (e.g. all `non_teaching_staff`) |
| **By Department** | `department` | All staff in a department use this template |
| **Individual** | `staff_email` | One specific person uses this template |

### Resolution priority (highest to lowest)
1. Individual assignment (by `staff_email`)
2. Department assignment (by `department`)
3. Role assignment (by `appraisal_role`)
4. Default template

> If multiple assignments exist for the same mode (e.g. two department assignments), the backend returns only the first match. Keep assignments unambiguous.

---

## 7. Step 3 — Add an NT Staff Account

**Page:** Add Faculty (+ icon or button in Faculty Management)

### Step-by-step walkthrough

#### Classification step (Step 0)
1. Select **Non-Teaching Staff**.
2. Pick the role:
   - **Staff** — will submit an appraisal form and go through the approval chain.
   - **Reporting Officer** — reviewer role; no workflow chain setup needed.
   - **Registrar** — reviewer role; no workflow chain setup needed.
3. Click **Next**.

#### Role & Approval Chain step (Step 1)
This step is only shown for the **Staff** role. For Reporting Officer and Registrar, a note explains they are reviewer accounts and no chain setup is required.

**Configure Approval Chain section:**

Three toggle rows let you build the chain dynamically:

| Toggle | Default | What it does |
|---|---|---|
| **Skip all reviewers — Direct to VC** | OFF | When ON, staff's form goes straight to VC. All other toggles are hidden. |
| **Include a first-level reviewer** | OFF | When ON, adds RO or Dept Head before the Registrar / VC. |
| **Include Registrar after first reviewer** | ON (when toggle 2 is ON) | When ON, Registrar is in the chain after the first reviewer. When OFF, first reviewer escalates directly to VC. |

When "Include a first-level reviewer" is ON, choose the reviewer type:
- **Reporting Officer** — uses the `reporting_officer_email` field
- **Department Head** — also uses the `reporting_officer_email` field (stored as the same column; the template step designation determines who actually sees it)

**Chain Preview section:**
Shows the resulting chain as colored pills (e.g. `[Staff] → [Reporting Officer] → [Registrar] → [VC]`). Updates live as you toggle.

**Assign Reviewers section:**
Dropdowns appear for each role in the chain (except VC which is always auto-assigned):
- **Reporting Officer / Department Head** picker — lists all users with `appraisal_role = reporting_officer`
- **Registrar** picker — lists all users with `appraisal_role = registrar`

**Validation:**
- If "Include first-level reviewer" is ON, a reviewer must be picked.
- If Registrar is in the chain (or the base chain has no first reviewer), a registrar must be picked.
- Direct-to-VC requires no picks.

**Template auto-selection:**
The system automatically finds the matching template based on the toggle state. The match logic looks at the designation names in each template's steps:
- Has "Reporting Officer" step → maps to RO chains
- Has "Head" / "Dept" in step name → maps to Dept Head chains
- Has "Registrar" step → Registrar required
- Has neither RO nor Registrar → Direct-to-VC chain

If no exact match is found, the default template is used as fallback.

#### Account step (Step 2)
Full name, email, temporary password.

#### Profile step (Step 3)
Designation, phone, qualification, experience (all optional).

#### Finish
The system:
1. Creates the user account via `POST /api/v1/admin/users`.
2. If a template was matched, creates a `NTWorkflowAssignment` linking the template to the staff email.
3. Sets `reporting_officer_email` and `registrar_email` on the faculty profile.
4. Shows a receipt with a print button.

---

## 8. Step 4 — Edit an NT Staff Account

**Page:** Faculty List → pencil icon on an NT staff row

The Edit Drawer lets you update NT routing without re-creating the account.

### Fields specific to NT staff

| Field | What it does |
|---|---|
| **Reporting Officer** | Sets `reporting_officer_email` on the profile. The backend uses this to route the appraisal to the correct RO in the workflow. |
| **Registrar** | Sets `registrar_email`. Same purpose for the Registrar step. |

Both dropdowns show all active users with the respective role. Select "None / Not Required" to clear the assignment.

> **Important:** Changing the RO or Registrar here only affects **future** submissions. An appraisal currently in progress already has a `NTWorkflowInstance` with frozen reviewer assignments. To re-route an in-progress appraisal, the backend developer needs to update the instance directly.

### NT info visible in the list row

Each NT staff row shows up to three lines under their name/email:
1. **Template name** (cyan) — the effective template name after resolution.
2. **RO: [name]** (orange) — the assigned Reporting Officer's name. Only shown if set.
3. **Reg: [name]** (teal) — the assigned Registrar's name. Only shown if set.
4. **"No workflow assigned"** (gray) — shown if no template name and no RO/Registrar are set.

---

## 9. Template Resolution Priority

The backend function `_resolve_template()` in `src/api/v1/non_teaching.py` applies this logic:

```
1. Individual assignment (NTWorkflowAssignment.staff_email == staff_email)
2. Department assignment (NTWorkflowAssignment.department == profile.department)
3. Role assignment (NTWorkflowAssignment.appraisal_role == profile.appraisal_role)
4. Default template (NTWorkflowTemplate.is_default == True)
```

The frontend `resolveTemplateName()` in `FacultyListPage.jsx` mirrors this for display purposes only (it does not affect backend routing).

---

## 10. Supported Approval Chains

| Chain | Toggle Config | Requires |
|---|---|---|
| Staff → Registrar → VC | All toggles OFF | Registrar picker |
| Staff → RO → Registrar → VC | First reviewer ON, type = RO, Registrar ON | RO picker + Registrar picker |
| Staff → RO → VC | First reviewer ON, type = RO, Registrar OFF | RO picker |
| Staff → Dept Head → Registrar → VC | First reviewer ON, type = Dept Head, Registrar ON | Dept Head picker + Registrar picker |
| Staff → Dept Head → VC | First reviewer ON, type = Dept Head, Registrar OFF | Dept Head picker |
| Staff → VC | Direct-to-VC ON | Nothing (auto) |

---

## 11. Reviewer Designation Matching

The backend's `GET /non-teaching/subordinates` returns only appraisals where the current `PENDING` workflow step's `designation` matches the reviewer's `FacultyProfile.designation` field exactly.

**Setup checklist for each reviewer type:**

### Reporting Officer setup
1. Create user with `appraisal_role = reporting_officer`.
2. In Edit drawer, set **Designation** = `Reporting Officer` (must match the template step name exactly).
3. When adding NT staff, select this user in the "Reporting Officer" picker. This sets `reporting_officer_email` on the staff profile.

### Registrar setup
1. Create user with `appraisal_role = registrar`.
2. In Edit drawer, set **Designation** = `Registrar`.
3. When adding NT staff, select this user in the "Registrar" picker. This sets `registrar_email` on the staff profile.

### VC setup
1. Create user with `appraisal_role = vc`.
2. In Edit drawer, set **Designation** = `VC`.
3. No picker needed — VC sees all NT appraisals at the final step.

---

## 12. Frontend Files Reference

| File | Role |
|---|---|
| `src/pages/faculty/AddFacultyPage.jsx` | Multi-step wizard for creating NT accounts. Contains the dynamic toggle-based workflow builder. |
| `src/pages/faculty/FacultyListPage.jsx` | User directory. Shows NT template name + RO/Registrar assignments per row. Edit drawer for reassignment. |
| `src/pages/workflow/WorkflowTemplatesPage.jsx` | Full CRUD for templates, designations, steps, and assignments. |
| `src/components/workflow/WorkflowTimeline.jsx` | Pure visual component — renders an approval chain as a vertical timeline with status badges. |
| `src/hooks/useWorkflow.js` | Fetches the approval template for an NT role via `GET /non-teaching/workflow-template`. Falls back to hardcoded steps if the API is unavailable. |
| `src/api/client.js` | All API calls. NT-related: `workflow.*`, `designations.*`, `workflowTemplates.*`, `users.reportingOfficers()`, `users.registrars()`. |
| `src/api/normalizers.js` | Shapes raw API responses. `normalizeUsers` now includes `reporting_officer_email` and `registrar_email`. |

### Key functions

**`resolveTemplateForToggles(templates, ntDirectVC, ntHasFirstReviewer, ntFirstReviewerType, ntRegRequired)`**
Located at the top of `AddFacultyPage.jsx`. Takes toggle state and returns the matching template object from the fetched list by inspecting step designation names.

**`resolveTemplateName(f, assignments, templates)`**
Located in `FacultyListPage.jsx`. Mirrors the backend priority logic (individual → department → role → default) for display only.

**`buildChainNodes(ntDirectVC, ntHasFirstReviewer, ntFirstReviewerType, ntRegRequired)`**
Returns the ordered array of node labels (e.g. `['Staff', 'Reporting Officer', 'Registrar', 'VC']`) for the chain preview.

**`buildChainLabel(ntDirectVC, ntHasFirstReviewer, ntFirstReviewerType, ntRegRequired)`**
Returns a short text label (e.g. `'RO → Registrar → VC'`) for summary rows.

---

## 13. Known Limitations

| Issue | Impact | Workaround |
|---|---|---|
| Template auto-match uses designation name substring matching (e.g. `includes('registrar')`). If a designation is named "Senior Registrar", it will also match. | Wrong template auto-selected | Name designations simply: exactly `"Registrar"`, `"Reporting Officer"`, `"VC"`, `"Department Head"` |
| Changing RO/Registrar on an existing account does not affect in-progress appraisals. | Reviewer routing frozen for active appraisals | Backend developer must update `NTWorkflowInstanceStep.reviewer_email` directly in DB |
| `reports_to_registrar` boolean (legacy field) is stored but not exposed in the Edit drawer UI. | No impact — field is superseded by `registrar_email` | Ignore. Backend still reads it in a few legacy paths. |
| `useWorkflow.js` fallback templates are hardcoded. If the backend workflow endpoint is down, the preview may show wrong steps. | Visual only — actual routing is backend-driven | Ensure migrations 016–018 are run so the endpoint is available |
| No bulk assignment — workflow templates must be assigned one staff / role / department at a time. | Tedious for large teams | Use role-based or department-based assignments to cover groups |
| WorkflowTimeline skeleton always shows 3 rows. Templates with 1 or 4+ steps look odd during loading. | Visual only | Acceptable until a dynamic skeleton count is added |
| No "impact preview" when assigning a template by role/department (does not show how many staff will be affected). | Admin must know affected count manually | Filter by role in Faculty List to see the count before assigning |

---

## Quick-Start Checklist

```
□ 1. Create designations: "Reporting Officer", "Registrar", "VC" (and "Department Head" if needed)
□ 2. Create templates matching each chain you need (see Step 1)
□ 3. Set one template as default
□ 4. Create reviewer accounts (RO, Registrar, VC) and set their Designation field in Edit drawer
□ 5. Add NT staff accounts — the toggle builder auto-selects the template and saves RO/Registrar
□ 6. Verify: open Faculty List, filter by Non-Teaching, check the template + RO + Reg shown under each staff name
□ 7. Ask staff to log in and submit their appraisal form
□ 8. The first reviewer (RO or Registrar) should see the appraisal in their reviewer dashboard
```
