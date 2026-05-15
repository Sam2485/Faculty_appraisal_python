# Super Admin — Backend API Reference

## Role overview

`super_admin` sits at weight **6** in the role hierarchy — above `admin (5)`.  
It has **full read + write access** to every endpoint that `admin` can reach, plus it can call the faculty-scores dashboard endpoint that regular admin cannot.

```
Faculty(0) < HOD(1) < Director(2) < Dean(3) < Registrar(3.5) < VC(4) < Admin(5) < Super Admin(6)
```

---

## Backend changes already made

### 1. `src/api/v1/admin.py` — `_check_admin`

**Before:**
```python
def _check_admin(current_user):
    if "admin" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin role required")
```

**After:**
```python
def _check_admin(current_user):
    if not any(r in current_user.roles for r in ("admin", "super_admin")):
        raise HTTPException(status_code=403, detail="Admin role required")
```

**Impact:** All 30+ `/api/v1/admin/*` endpoints now accept `super_admin` tokens.

---

### 2. `src/api/v1/dashboard.py` — `/dashboard/subordinates`

Added `super_admin` / `admin` handling at the top of the authority filter block.  
`super_admin` sees **all faculty across all schools** (optionally filtered by `schools` query param).

```python
if any(r in current_user.roles for r in ("super_admin", "admin")):
    if schools:
        school_list = [s.strip() for s in schools.split(",")]
        query = query.where(FacultyProfile.school.in_(school_list))
```

---

## Endpoints available to super_admin

### All `/api/v1/admin/*` endpoints

| Method | Path | What it does |
|---|---|---|
| GET | `/api/v1/admin/stats` | Submission counts by school and role |
| GET | `/api/v1/admin/users` | List all users (filterable by school, role, search) |
| POST | `/api/v1/admin/users` | Create any user including admin/super_admin |
| PUT | `/api/v1/admin/users/{email}` | Update user profile or reset password |
| DELETE | `/api/v1/admin/users/{email}` | Delete a user |
| GET | `/api/v1/admin/config` | Read system config |
| PUT | `/api/v1/admin/config` | Update system config |
| GET | `/api/v1/admin/export/submissions` | Export submission data as CSV |
| GET | `/api/v1/admin/export/faculty` | Export faculty list as CSV |

---

### `/api/v1/dashboard/subordinates` — Faculty scores with remarks

**Method:** `GET`  
**Auth:** Bearer token (super_admin or admin)

**Query parameters:**

| Param | Required | Description |
|---|---|---|
| `academic_year` | Yes | e.g. `2024-25` |
| `schools` | No | Comma-separated school codes to filter, e.g. `SoCSEA,SoCM` |

**Response fields per faculty record:**

| Field | Type | Description |
|---|---|---|
| `email` | string | Faculty email |
| `name` | string | Full name |
| `school` | string | School code (SoCSEA, SoCM, SoMCS, SoD, SoAA, SoBB, SoCE, SoEMR, CISR) |
| `department` | string | Department (where applicable) |
| `appraisal_role` | string | faculty / hod / director / dean / vc |
| `designation` | string | Job title |
| `status` | string | pending / Pending Director Review / Pending Dean Review / Pending VC Review / Reviewed |
| `submitted_at` | ISO datetime / null | When faculty submitted the form |
| `part_a_total` | float | Faculty self-score — Part A |
| `part_b_total` | float | Faculty self-score — Part B |
| `grand_total` | float | Faculty self-score — grand total |
| `hod_total` | float | HOD score total (0 if not reviewed) |
| `hod_part_a` | float | HOD Part A score |
| `hod_part_b` | float | HOD Part B score |
| `hod_remarks` | string | HOD's written remarks |
| `director_total` | float | Director score total |
| `director_part_a` | float | Director Part A score |
| `director_part_b` | float | Director Part B score |
| `director_remarks` | string | Director's written remarks |
| `dean_total` | float | Dean score total |
| `dean_part_a` | float | Dean Part A score |
| `dean_part_b` | float | Dean Part B score |
| `dean_remarks` | string | Dean's written remarks |
| `vc_total` | float | VC score total |
| `vc_part_a` | float | VC Part A score |
| `vc_part_b` | float | VC Part B score |
| `vc_remarks` | string | VC's written remarks |

---

### `/api/v1/dashboard/faculty/{email}` — Full snapshot + section-level scores

**Method:** `GET`  
**Auth:** Bearer token — `has_authority_over()` grants super_admin access automatically  
**Query parameters:** `academic_year` (required)

Returns the faculty's complete submitted form payload plus per-reviewer breakdown:

```json
{
  "id": "uuid",
  "faculty_email": "faculty@dypiu.edu",
  "academic_year": "2024-25",
  "payload": { "...full form data..." },
  "reviews": [
    {
      "reviewer_role": "hod",
      "reviewer_email": "hod@dypiu.edu",
      "part_a_score": 42.5,
      "part_b_score": 28.0,
      "total_score": 70.5,
      "section_scores": { "lectures": 10, "courseFile": 8, "..." },
      "remarks": "Good performance in teaching.",
      "status": "Reviewed",
      "reviewed_at": "2025-03-15T10:30:00"
    },
    { "reviewer_role": "director", "..." },
    { "reviewer_role": "dean",     "..." },
    { "reviewer_role": "vc",       "..." }
  ]
}
```

Use this endpoint when you need **section-level scores** per reviewer.  
Use `/dashboard/subordinates` for the bulk list view with totals and remarks.

---

## What super_admin cannot do (by design)

`super_admin` is a **read-only observer** for the appraisal review flow.  
The role-check guards in `src/api/v1/remarks.py` only allow the actual role-holder to submit a review:

```python
# HOD review guard
if "hod" not in current_user.roles and "admin" not in current_user.roles:
    raise HTTPException(status_code=403)
```

`super_admin` cannot submit HOD / Director / Dean / VC reviews — those must come from the actual reviewer account. This is intentional to preserve audit trail integrity.

---

## Creating a super_admin account

Use the admin panel or directly via API:

```bash
POST /api/v1/admin/users
{
  "email": "superadmin@dypiu.edu",
  "password": "...",
  "full_name": "Super Admin",
  "appraisal_role": "super_admin"
}
```

`school` and `department` are not required for super_admin.

---

## Frontend — Faculty Marks page (`/marks`)

Available only when logged in as `super_admin`.  
Located at `admin_ui/src/pages/marks/FacultyMarksPage.jsx`.

**Columns shown:**
- Name / Email
- School (code badge)
- Role
- Submission Status
- HOD Score (Part A + Part B + Total + Remarks)
- Director Score (Part A + Part B + Total + Remarks)
- Dean Score (Part A + Part B + Total + Remarks)
- VC Score (Part A + Part B + Total + Remarks)
- Grand Total

**Filters:** Academic year, school, free-text search.

**Remarks:** Expandable row — click any faculty row to see written remarks from each authority inline.
