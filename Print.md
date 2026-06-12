# Total Score Report Design Plan

## Objective

Make the Admin UI Total Score Report correct for CSV and Excel.

The report must show, against each faculty:

```text
Part A, Part A Max, Part B, Part B Max, Total, Total Max, %
```

for every score level:

- Faculty/Self
- HOD
- Center Head, where applicable
- Director
- Dean
- VC
- Average
- Best

## Best Architecture

The best method is:

```text
Backend calculates effective max marks.
Admin UI only displays the values.
Frontend stores/sends enough section data and applicability data.
Database keeps current JSON fields unless performance later requires columns.
```

Do not make Admin UI call one detail API per faculty for the final production flow. That is acceptable only as a temporary workaround because it becomes slow for large faculty lists.

## Backend Changes

### File

```text
src/api/v1/dashboard.py
```

### Endpoint

```http
GET /api/v1/dashboard/subordinates?academic_year=<year>&schools=<school>
```

### Required Change

Each faculty row returned by `get_subordinates()` should include max marks for every score level.

Add these fields:

```json
{
  "faculty_part_a_max": 165,
  "faculty_part_b_max": 375,
  "faculty_total_max": 540,

  "hod_part_a_max": 190,
  "hod_part_b_max": 375,
  "hod_total_max": 565,

  "center_head_part_a_max": 190,
  "center_head_part_b_max": 375,
  "center_head_total_max": 565,

  "director_part_a_max": 190,
  "director_part_b_max": 375,
  "director_total_max": 565,

  "dean_part_a_max": 190,
  "dean_part_b_max": 375,
  "dean_total_max": 565,

  "vc_part_a_max": 190,
  "vc_part_b_max": 375,
  "vc_total_max": 565
}
```

Keep existing score fields unchanged:

```json
{
  "part_a_total": 0,
  "part_b_total": 0,
  "grand_total": 0,
  "hod_part_a": 0,
  "hod_part_b": 0,
  "hod_total": 0,
  "director_part_a": 0,
  "director_part_b": 0,
  "director_total": 0,
  "dean_part_a": 0,
  "dean_part_b": 0,
  "dean_total": 0,
  "vc_part_a": 0,
  "vc_part_b": 0,
  "vc_total": 0
}
```

### Data Needed To Calculate Max

Faculty/Self max should come from submitted snapshot:

```text
AppraisalSnapshot.payload
```

Reviewer max should come from review JSON:

```text
AppraisalReview.section_scores
```

The backend should also read section applicability:

```js
sectionApplicability: {
  acr: "notApplicable",
  research: "applicable"
}
```

### Backend Helper Needed

Create a helper in `src/api/v1/dashboard.py`, or better in a shared scoring utility file:

```text
src/setup/score_utils.py
```

Recommended helper API:

```py
def compute_effective_max(section_scores: dict | None, section_applicability: dict | None, mode: str) -> dict:
    ...
    return {
        "part_a_max": 190,
        "part_b_max": 375,
        "total_max": 565,
    }
```

Use `mode` to handle self vs reviewer rules:

```text
mode="self"
mode="reviewer"
```

Reason:

- Faculty/Self may exclude ACR.
- Reviewers may include ACR.
- Section applicability can reduce max for both.

### Section Max Constants

Backend should define the official max marks.

Example:

```py
PART_A_SECTION_MAX = {
    "lectures": 50,
    "courseFile": 20,
    "innovativeTeaching": 10,
    "projects": 10,
    "quals": 5,
    "feedback": 10,
    "deptActs": 20,
    "uniActs": 30,
    "society": 10,
    "industry": 5,
    "acr": 25,
}

PART_B_SECTION_MAX = {
    "journals": 120,
    "books": 50,
    "ict": 20,
    "research": 30,
    "projects2": 15,
    "externalProjects": 30,
    "patents": 40,
    "awards": 10,
    "confs": 30,
    "proposals": 10,
    "products": 10,
    "fdps": 10,
}
```

Important: align these values with the official appraisal form. If `training` also contributes to FDP/training marks, define that rule clearly.

### Alias Mapping Needed

The frontend/admin uses mixed names. Backend should normalize aliases before calculating max.

```py
SECTION_ALIASES = {
    "projectsGuidance": "projects",
    "qualificationEnhancement": "quals",
    "studentFeedback": "feedback",
    "departmentalActivities": "deptActs",
    "universityActivities": "uniActs",
    "societyContribution": "society",
    "industryConnect": "industry",
    "researchGuidance": "research",
    "internalProjects": "projects2",
    "conferences": "confs",
    "fdpTraining": "fdps",
}
```

### Expected Backend Logic

Inside `get_subordinates()`:

1. Fetch faculty/declaration rows.
2. Fetch `AppraisalReview` rows.
3. Fetch `AppraisalSnapshot` rows.
4. For each faculty:
   - Extract self form and self applicability from snapshot.
   - Compute self max.
   - For each reviewer review, compute reviewer max.
   - Add score fields and max fields to the response.

Pseudo-code:

```py
self_max = compute_effective_max(self_form, self_applicability, mode="self")
sub["faculty_part_a_max"] = self_max["part_a_max"]
sub["faculty_part_b_max"] = self_max["part_b_max"]
sub["faculty_total_max"] = self_max["total_max"]

for rev in reviews_by_email[faculty.email]:
    role = rev.reviewer_role
    section_scores = rev.section_scores or {}
    applicability = extract_review_applicability(section_scores)
    maxes = compute_effective_max(section_scores, applicability, mode="reviewer")

    sub[f"{role}_part_a_max"] = maxes["part_a_max"]
    sub[f"{role}_part_b_max"] = maxes["part_b_max"]
    sub[f"{role}_total_max"] = maxes["total_max"]
```

### Backend Response Example

```json
{
  "name": "Faculty Name",
  "designation": "Assistant Professor",
  "school": "SoCSEA",

  "part_a_total": 118,
  "faculty_part_a_max": 165,
  "part_b_total": 162,
  "faculty_part_b_max": 375,
  "grand_total": 280,
  "faculty_total_max": 540,

  "director_part_a": 115,
  "director_part_a_max": 190,
  "director_part_b": 158,
  "director_part_b_max": 375,
  "director_total": 273,
  "director_total_max": 565,

  "dean_part_a": 116,
  "dean_part_a_max": 190,
  "dean_part_b": 160,
  "dean_part_b_max": 375,
  "dean_total": 276,
  "dean_total_max": 565,

  "vc_part_a": 118,
  "vc_part_a_max": 190,
  "vc_part_b": 162,
  "vc_part_b_max": 375,
  "vc_total": 280,
  "vc_total_max": 565
}
```

## Admin UI Changes

### File

```text
admin_ui/src/pages/export/ExportReportPage.jsx
```

### Current Problem

The Admin UI currently calculates max marks in the frontend using section JSON.

Final design should change this:

```js
computeEffectiveMax(...)
```

to use backend max fields directly.

### Required Export Columns

For each score group, show:

```text
Part A, A Max, Part B, B Max, Total, Max, %
```

VC can also show:

```text
Grade
```

### Admin UI Calculation

Use backend max fields:

```js
const selfMax = {
  partA: r.faculty_part_a_max || 200,
  partB: r.faculty_part_b_max || 375,
  total: r.faculty_total_max || 575,
}

const directorMax = {
  partA: r.director_part_a_max || 200,
  partB: r.director_part_b_max || 375,
  total: r.director_total_max || 575,
}
```

Then calculate percentage:

```js
percent = total > 0 && totalMax > 0
  ? (total / totalMax) * 100
  : null
```

### Average Score Rule

Average score should average both scores and max marks from the reviewers included.

Example:

```js
const reviewers = [
  director,
  dean,
  vc,
].filter(x => x.total > 0)

avgA = average(reviewers.map(x => x.partA))
avgAMax = average(reviewers.map(x => x.partAMax))
avgB = average(reviewers.map(x => x.partB))
avgBMax = average(reviewers.map(x => x.partBMax))
avgT = average(reviewers.map(x => x.total))
avgTMax = average(reviewers.map(x => x.totalMax))
avgPct = avgT / avgTMax * 100
```

For SoEMR, include HOD in the average if HOD score exists.

### Best Score Rule

Best score should use the max marks from the reviewer whose total score was selected as best.

Example:

```js
best = reviewers.sort((a, b) => b.total - a.total)[0]

bestA = best.partA
bestAMax = best.partAMax
bestB = best.partB
bestBMax = best.partBMax
bestT = best.total
bestTMax = best.totalMax
bestPct = bestT / bestTMax * 100
```

### Temporary Admin UI Workaround

If backend max fields are not ready, Admin UI can temporarily fetch section JSON per faculty:

```http
GET /api/v1/dashboard/faculty/{email}?academic_year=<year>
```

Then calculate max in frontend.

This is not recommended for final production because it makes one extra request per faculty.

## Main Frontend Changes

This is the faculty/reviewer frontend, not `admin_ui`.

### Faculty Submit

When faculty submits appraisal:

```http
POST /api/v1/appraisal/submit
```

Ensure payload includes:

```js
{
  form: { ...fullAppraisalForm },
  sectionApplicability: {
    acr: "notApplicable",
    research: "applicable"
  },
  totals: {
    partATotal,
    partBTotal,
    grandTotal,
    effectivePartAMax,
    effectivePartBMax,
    effectiveGrandMax
  }
}
```

### Reviewer Submit

When reviewer submits:

```http
POST /api/v1/appraisal-remarks/{role}/{email}
```

Ensure payload includes:

```js
{
  part_a_score: 116,
  part_b_score: 160,
  total_score: 276,
  section_scores: {
    lectures: [
      {
        score: "45",
        hod: "44",
        director: "45",
        dean: "43"
      }
    ],
    sectionApplicability: {
      acr: "applicable"
    }
  }
}
```

### Important Reviewer Rule

When a later reviewer submits, do not erase previous reviewer fields in the same row.

Good:

```js
{
  score: "45",
  hod: "44",
  director: "45",
  dean: "43"
}
```

Bad:

```js
{
  dean: "43"
}
```

unless backend already merges it with stored previous data.

## Database Changes

### Required Now

No required database migration.

Current JSON columns are enough:

```text
appraisal_snapshots.payload
appraisal_reviews.section_scores
```

### Optional Later

If reports become slow, add stored max columns.

Possible migration:

```sql
alter table declarations
add column faculty_part_a_max numeric default 200,
add column faculty_part_b_max numeric default 375,
add column faculty_total_max numeric default 575;

alter table appraisal_reviews
add column part_a_max numeric default 200,
add column part_b_max numeric default 375,
add column total_max numeric default 575;
```

This is optional. Do not add it unless performance or audit requirements demand it.

## Implementation Order

1. Backend: create scoring helper.
2. Backend: update `/dashboard/subordinates` to return max fields.
3. Admin UI: update report CSV builder to use backend max fields.
4. Admin UI: update report Excel builder to use backend max fields.
5. Main frontend: confirm submit payload includes `sectionApplicability`.
6. Main frontend: confirm reviewer submit preserves/merges previous reviewer fields.
7. Test with one faculty where ACR is not applicable for self.
8. Test with one reviewer where ACR is applicable.
9. Export CSV and Excel and compare percentages manually.

## Manual Test Example

If faculty self excludes ACR:

```text
Self Part A Max = 165
Self Part B Max = 375
Self Total Max = 540
```

If reviewer includes ACR:

```text
Reviewer Part A Max = 190
Reviewer Part B Max = 375
Reviewer Total Max = 565
```

Expected report:

```text
Faculty Score uses 540 denominator.
Director/Dean/VC Score uses 565 denominator.
Average uses average reviewer denominator.
Best uses selected best reviewer denominator.
```

## Suggested Commit Messages

Backend:

```text
feat(report): return effective max marks for score exports
```

Admin UI:

```text
feat(export): use backend max marks in total score report
```

Main frontend:

```text
fix(appraisal): preserve section applicability and reviewer marks
```

## Copy-Paste Prompts For Each Side

### Backend Prompt

Use this prompt for the backend developer or backend coding agent:

```text
Implement effective max marks for the Admin UI Total Score Report.

Backend file: src/api/v1/dashboard.py
Endpoint: GET /api/v1/dashboard/subordinates

For each faculty row, return max fields for every score level:
faculty_part_a_max, faculty_part_b_max, faculty_total_max,
hod_part_a_max, hod_part_b_max, hod_total_max,
center_head_part_a_max, center_head_part_b_max, center_head_total_max,
director_part_a_max, director_part_b_max, director_total_max,
dean_part_a_max, dean_part_b_max, dean_total_max,
vc_part_a_max, vc_part_b_max, vc_total_max.

Calculate faculty/self max from AppraisalSnapshot.payload form data and sectionApplicability.
Calculate reviewer max from AppraisalReview.section_scores and its sectionApplicability.

Create a shared helper if useful, preferably src/setup/score_utils.py, with:
compute_effective_max(section_scores, section_applicability, mode)

Use mode="self" for faculty/self and mode="reviewer" for HOD/Director/Dean/VC. Self may exclude ACR; reviewers may include ACR. Reduce max when sectionApplicability[sectionKey] == "notApplicable".

Do not change existing score fields. Only add max fields.
Add focused tests or at least verify /dashboard/subordinates returns the new max fields.
```

Brief description:

```text
Backend owns official max-mark calculation and returns ready-to-use max fields for the report.
```

### Admin UI Prompt

Use this prompt for the admin UI developer or admin UI coding agent:

```text
Update the Admin UI Total Score Report export to use backend-provided max fields.

File: admin_ui/src/pages/export/ExportReportPage.jsx

CSV and Excel exports should show these columns for every score group:
Part A, A Max, Part B, B Max, Total, Max, %

VC can additionally show Grade.

Use backend fields:
faculty_part_a_max, faculty_part_b_max, faculty_total_max,
hod_part_a_max, hod_part_b_max, hod_total_max,
center_head_part_a_max, center_head_part_b_max, center_head_total_max,
director_part_a_max, director_part_b_max, director_total_max,
dean_part_a_max, dean_part_b_max, dean_total_max,
vc_part_a_max, vc_part_b_max, vc_total_max.

Do not calculate final max marks from vc_section_scores only.

Average Score:
Average reviewer scores and average their matching max fields. For SoEMR include HOD if score exists. For other schools use Director, Dean, VC.

Best Score:
Use the max fields from the reviewer whose total score is selected as best.

Keep fallback max values only for old backend compatibility:
Part A fallback 200, Part B fallback 375, Total fallback 575.

Run npm.cmd run build after changes.
```

Brief description:

```text
Admin UI displays backend max fields and calculates percentages, average, best, and grade from matching denominators.
```

### Main Frontend Prompt

Use this prompt for the faculty/reviewer frontend developer:

```text
Verify and fix appraisal submit/reviewer submit payloads so backend can calculate effective max marks.

Faculty submit endpoint:
POST /api/v1/appraisal/submit

Ensure submitted payload includes:
form: full appraisal form rows
sectionApplicability: object like { acr: "notApplicable", research: "applicable" }
totals: partATotal, partBTotal, grandTotal, effectivePartAMax, effectivePartBMax, effectiveGrandMax if already calculated

Reviewer submit endpoint:
POST /api/v1/appraisal-remarks/{role}/{email}

Ensure section_scores includes reviewer marks by role:
hod, center_head, director, dean, vc.

Preserve previous reviewer fields in each row. A later reviewer submit must not erase earlier hod/director/dean values if using shared row objects.

Confirm section keys are consistent or documented:
lectures, courseFile, innovativeTeaching, projects, quals, feedback, deptActs, uniActs, society, industry, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training.
```

Brief description:

```text
Main frontend must send stable section marks and sectionApplicability so backend can compute correct max marks.
```

### Database Prompt

Use this prompt for the database/backend reviewer:

```text
Review whether a database migration is required for Total Score Report max marks.

Current recommendation: no migration now.

Use existing JSON storage:
appraisal_snapshots.payload for faculty/self form and applicability.
appraisal_reviews.section_scores for reviewer section marks and applicability.

Only add columns later if report performance or audit requirements demand it.

Optional future columns:
declarations.faculty_part_a_max
declarations.faculty_part_b_max
declarations.faculty_total_max
appraisal_reviews.part_a_max
appraisal_reviews.part_b_max
appraisal_reviews.total_max
```

Brief description:

```text
No DB migration is required for the first implementation; existing JSON fields are enough.
```

### End-To-End QA Prompt

Use this prompt for QA or final verification:

```text
Test Total Score Report max marks end to end.

1. Create or choose a faculty submission where self excludes ACR using sectionApplicability.
2. Ensure reviewer scoring includes ACR.
3. Confirm /api/v1/dashboard/subordinates returns different self and reviewer max fields.
4. Download Admin UI Total Score Report CSV.
5. Download Admin UI Total Score Report Excel.
6. Verify Faculty Score uses self max.
7. Verify Director/Dean/VC use reviewer max.
8. Verify Average Score uses average reviewer max.
9. Verify Best Score uses max from the selected best reviewer.
10. Manually calculate one percentage and compare with CSV/Excel.
```

Brief description:

```text
QA should prove that self, reviewer, average, and best percentages use their correct denominators.
```
