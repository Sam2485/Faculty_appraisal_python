# Missing Implementation

## Non-Teaching Staff — Direct-to-Registrar Initial Status

**File:** `src/api/v1/non_teaching.py`
**Status:** ❌ Not implemented

---

### What is Missing

When a non-teaching staff member submits their appraisal form, the backend always sets the initial status to `'Draft'` regardless of their `reports_to_registrar` flag.

Staff with `reports_to_registrar = True` should start at `"Pending Registrar Review"` so the Registrar can see and act on the form directly. Currently these forms stay stuck at `'Draft'` and the Registrar never sees them in their queue.

---

### Fix Required

In the form submit handler inside `src/api/v1/non_teaching.py`, branch the initial status:

```python
initial_status = (
    "Pending Registrar Review"
    if current_user.reports_to_registrar
    else "Draft"
)
form.status = initial_status
```

---

### Why It Matters

| Flag | Current Behaviour | Expected Behaviour |
|---|---|---|
| `reports_to_registrar = False` | Starts at `Draft` → RO reviews → Registrar → VC | ✅ Correct |
| `reports_to_registrar = True` | Starts at `Draft` → **stuck** (RO gets 403, Registrar never sees it) | ❌ Should start at `Pending Registrar Review` |

The RO 403 guard is already in place — RO cannot review these forms. But without the correct initial status, the Registrar's queue will never surface them.

---

### No Frontend Changes Needed

The frontend already handles both flows correctly:
- `normalizeUsers` passes `reports_to_registrar` through
- `AppraisalCyclePage` buckets `Draft` + `reports_to_registrar = True` staff into the Registrar stage
- Admin toggle in AddFacultyPage and FacultyListPage already sets the flag via `PUT /admin/users/{email}`
