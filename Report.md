# Total Score Report Backend And Frontend Contract

## Goal

The Admin UI Total Score Report must show correct max marks separately for every score level:

- Faculty/Self Score
- HOD Score
- Center Head Score, where applicable
- Director Score
- Dean Score
- VC Score
- Average Score
- Best Score

Each score group in CSV and Excel should show:

```text
Part A, A Max, Part B, B Max, Total, Max, %
```

The backend must expose section data for the full chain, not VC only. The frontend must calculate each group's max from that group's own section data and applicability rules.

## Endpoint Used By Admin UI

```http
GET /api/v1/dashboard/subordinates?academic_year=<year>&schools=<school>
```

Backend file:

```text
src/api/v1/dashboard.py
```

Backend function:

```py
get_subordinates()
```

Frontend export file:

```text
admin_ui/src/pages/export/ExportReportPage.jsx
```

## Required Backend Response Fields

Every faculty row returned by `/dashboard/subordinates` should include:

```json
{
  "faculty_section_scores": {},
  "faculty_section_applicability": {},
  "hod_section_scores": {},
  "hod_section_applicability": {},
  "center_head_section_scores": {},
  "center_head_section_applicability": {},
  "director_section_scores": {},
  "director_section_applicability": {},
  "dean_section_scores": {},
  "dean_section_applicability": {},
  "vc_section_scores": {},
  "vc_section_applicability": {}
}
```

Existing score fields should remain unchanged:

```json
{
  "part_a_total": 0,
  "part_b_total": 0,
  "grand_total": 0,
  "hod_part_a": 0,
  "hod_part_b": 0,
  "hod_total": 0,
  "center_head_part_a": 0,
  "center_head_part_b": 0,
  "center_head_total": 0,
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

## Where Section Marks Are Stored

### Faculty/Self

Faculty/Self marks are stored inside the submitted form object sent to:

```http
POST /api/v1/appraisal/submit
```

Expected path:

```text
form.{sectionKey}[].score
```

The submitted payload usually has this shape:

```js
{
  form: { ...fullAppraisalForm },
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

Backend storage source:

```text
AppraisalSnapshot.payload
```

Usually:

```py
snapshot.payload["form"]
```

or:

```py
snapshot.payload["payload"]["form"]
```

Return this as:

```py
sub["faculty_section_scores"] = submitted_form_or_empty_dict
```

Also return applicability as:

```py
sub["faculty_section_applicability"] = section_applicability_or_empty_dict
```

### Reviewers

Reviewer marks are sent through:

```http
POST /api/v1/appraisal-remarks/{role}/{email}
```

Reviewer section data is stored in:

```text
AppraisalReview.section_scores
```

Paths by role:

```text
HOD: section_scores.{sectionKey}[].hod
Center Head: section_scores.{sectionKey}[].center_head
Director: section_scores.{sectionKey}[].director
Dean: section_scores.{sectionKey}[].dean
VC: section_scores.{sectionKey}[].vc
```

Note: Center Head may be HOD-style in UI, but backend should preserve role as `center_head` when reviewer_role is `center_head`.

Return reviewer data as:

```py
sub[f"{role}_section_scores"] = rev.section_scores or {}
sub[f"{role}_section_applicability"] = extracted_applicability_or_empty_dict
```

## Exact Object Shape

Frontend uses section objects like this:

```js
{
  lectures: [
    {
      semester: "1",
      course_code: "ABC101",
      planned_classes: "40",
      conducted_classes: "38",
      score: "45",
      hod: "44",
      director: "45",
      dean: "43",
      vc: "45"
    }
  ]
}
```

Reviewer submit usually sends the original row plus the current reviewer field:

```js
{
  lectures: [
    {
      semester: "1",
      course_code: "ABC101",
      planned_classes: "40",
      conducted_classes: "38",
      score: "45",
      dean: "43"
    }
  ],
  innovativeTeaching: {
    dean: "8"
  }
}
```

Backend should preserve this object shape when returning section data.

## Section Applicability

Frontend stores not-applicable sections separately, not usually as `notApplicable: true` inside each row.

Shape:

```js
sectionApplicability: {
  projects: "applicable",
  research: "notApplicable",
  society: "applicable"
}
```

Backend should expose this object for each score level where available.

Frontend max-mark logic should reduce max marks when:

```js
sectionApplicability[sectionKey] === "notApplicable"
```

## Section Key Mapping

Frontend mainly uses these internal short keys:

```text
lectures
courseFile
innovRows
innovativeTeaching
projects
quals
feedback
deptActs
uniActs
society
industry
acr
journals
books
ict
research
projects2
internalProjects
externalProjects
patents
awards
confs
proposals
products
fdps
training
```

Admin/export names need alias mapping:

```text
projectsGuidance -> projects
qualificationEnhancement -> quals
studentFeedback -> feedback
departmentalActivities -> deptActs
universityActivities -> uniActs
societyContribution -> society
industryConnect -> industry
researchGuidance -> research
internalProjects -> projects2/internalProjects
conferences -> confs
fdpTraining -> fdps + training
```

The export max-mark calculation must use aliases so it does not miss sections because of different names.

## Backend Change In `src/api/v1/dashboard.py`

Inside `get_subordinates()`, after fetching `rows`, also fetch appraisal snapshots for the same faculty emails and academic year:

```py
snapshots_by_email: dict[str, AppraisalSnapshot] = {}
if faculty_emails:
    snap_res = await db.execute(
        select(AppraisalSnapshot).where(
            AppraisalSnapshot.faculty_email.in_(faculty_emails),
            AppraisalSnapshot.academic_year == academic_year
        )
    )
    snapshots_by_email = {
        snap.faculty_email: snap
        for snap in snap_res.scalars().all()
    }
```

Add helpers:

```py
def _extract_snapshot_form(snapshot: AppraisalSnapshot | None) -> dict:
    if not snapshot or not isinstance(snapshot.payload, dict):
        return {}

    payload = snapshot.payload
    if isinstance(payload.get("form"), dict):
        return payload["form"]

    nested = payload.get("payload")
    if isinstance(nested, dict) and isinstance(nested.get("form"), dict):
        return nested["form"]

    return {}


def _extract_snapshot_applicability(snapshot: AppraisalSnapshot | None) -> dict:
    if not snapshot or not isinstance(snapshot.payload, dict):
        return {}

    payload = snapshot.payload
    form = payload.get("form") if isinstance(payload.get("form"), dict) else None
    nested = payload.get("payload") if isinstance(payload.get("payload"), dict) else None

    if isinstance(payload.get("sectionApplicability"), dict):
        return payload["sectionApplicability"]
    if form and isinstance(form.get("sectionApplicability"), dict):
        return form["sectionApplicability"]
    if nested and isinstance(nested.get("sectionApplicability"), dict):
        return nested["sectionApplicability"]
    if nested and isinstance(nested.get("form"), dict) and isinstance(nested["form"].get("sectionApplicability"), dict):
        return nested["form"]["sectionApplicability"]

    return {}


def _extract_review_applicability(section_scores: dict | None) -> dict:
    if not isinstance(section_scores, dict):
        return {}
    value = section_scores.get("sectionApplicability")
    return value if isinstance(value, dict) else {}
```

Add default section fields to the `sub` dictionary:

```py
snapshot = snapshots_by_email.get(faculty.email)

sub = {
    ...
    "part_a_total": float(decl.part_a_total) if decl and decl.part_a_total is not None else 0,
    "part_b_total": float(decl.part_b_total) if decl and decl.part_b_total is not None else 0,
    "grand_total": float(decl.grand_total) if decl and decl.grand_total is not None else 0,
    "faculty_section_scores": _extract_snapshot_form(snapshot),
    "faculty_section_applicability": _extract_snapshot_applicability(snapshot),
    "hod_section_scores": {},
    "hod_section_applicability": {},
    "center_head_section_scores": {},
    "center_head_section_applicability": {},
    "director_section_scores": {},
    "director_section_applicability": {},
    "dean_section_scores": {},
    "dean_section_applicability": {},
    "vc_section_scores": {},
    "vc_section_applicability": {},
    ...
}
```

Update the review loop:

```py
for rev in reviews_by_email[faculty.email]:
    role = rev.reviewer_role
    section_scores = rev.section_scores or {}

    sub[f"{role}_total"] = float(rev.total_score) if rev.total_score is not None else 0
    sub[f"{role}_part_a"] = float(rev.part_a_score) if rev.part_a_score is not None else 0
    sub[f"{role}_part_b"] = float(rev.part_b_score) if rev.part_b_score is not None else 0
    sub[f"{role}_remarks"] = rev.remarks or ""
    sub[f"{role}_section_scores"] = section_scores
    sub[f"{role}_section_applicability"] = _extract_review_applicability(section_scores)
```

Important: when each reviewer submits `section_scores`, backend should merge/preserve previous reviewer fields if a shared section object is used. A later reviewer should not erase earlier `hod`, `director`, or `dean` values stored on the same row.

## Frontend Export Change Required

The frontend should not use only:

```js
computeEffectiveMax(r.vc_section_scores)
```

It should calculate per score group:

```js
computeEffectiveMax(r.faculty_section_scores, r.faculty_section_applicability)
computeEffectiveMax(r.hod_section_scores, r.hod_section_applicability)
computeEffectiveMax(r.center_head_section_scores, r.center_head_section_applicability)
computeEffectiveMax(r.director_section_scores, r.director_section_applicability)
computeEffectiveMax(r.dean_section_scores, r.dean_section_applicability)
computeEffectiveMax(r.vc_section_scores, r.vc_section_applicability)
```

Average Score and Best Score should use the selected reviewer’s effective max, not one common max for everything.

Reason:

- Faculty/Self excludes ACR from Part A.
- Reviewers can score ACR.
- Self Part A max may be `165`.
- Reviewer Part A max may be `190`.
- If `sectionApplicability` says a section is `notApplicable`, reduce that section from max.

## Expected Backend Response Example

```json
{
  "email": "faculty@example.com",
  "name": "Faculty Name",
  "school": "SoCSEA",
  "designation": "Assistant Professor",

  "part_a_total": 118,
  "part_b_total": 162,
  "grand_total": 280,
  "faculty_section_scores": {
    "lectures": [{ "score": "45" }],
    "courseFile": [{ "score": "18" }]
  },
  "faculty_section_applicability": {
    "acr": "notApplicable"
  },

  "hod_part_a": 110,
  "hod_part_b": 150,
  "hod_total": 260,
  "hod_section_scores": {
    "lectures": [{ "score": "45", "hod": "44" }]
  },
  "hod_section_applicability": {},

  "director_part_a": 115,
  "director_part_b": 158,
  "director_total": 273,
  "director_section_scores": {
    "lectures": [{ "score": "45", "hod": "44", "director": "45" }]
  },
  "director_section_applicability": {},

  "dean_part_a": 116,
  "dean_part_b": 160,
  "dean_total": 276,
  "dean_section_scores": {
    "lectures": [{ "score": "45", "hod": "44", "director": "45", "dean": "43" }]
  },
  "dean_section_applicability": {},

  "vc_part_a": 118,
  "vc_part_b": 162,
  "vc_total": 280,
  "vc_section_scores": {
    "lectures": [{ "score": "45", "hod": "44", "director": "45", "dean": "43", "vc": "45" }]
  },
  "vc_section_applicability": {}
}
```

## Testing Checklist

1. Restart backend:

```bash
uvicorn main:app --reload --port 8000
```

2. Open:

```http
GET /api/v1/dashboard/subordinates?academic_year=2025-2026
```

3. Confirm each faculty row includes:

```text
faculty_section_scores
faculty_section_applicability
hod_section_scores
hod_section_applicability
center_head_section_scores
center_head_section_applicability
director_section_scores
director_section_applicability
dean_section_scores
dean_section_applicability
vc_section_scores
vc_section_applicability
```

4. Download Total Score Report as CSV and Excel.

5. Confirm each score group uses its own max:

```text
Part A, A Max, Part B, B Max, Total, Max, %
```

6. Confirm self max and reviewer max can differ, especially around ACR and `sectionApplicability`.

## Suggested Commit Messages

Backend:

```text
feat(report): expose section scores and applicability by reviewer
```

Frontend:

```text
feat(export): calculate effective max per score group
```
