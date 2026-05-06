# Database Table Rationalization Manifest

This document outlines the current status of the Supabase database schema. It identifies tables that are actively used by the FastAPI backend, tables that are redundant (due to naming conflicts or refactoring), and obsolete tables.

**IMPORTANT:** Before proceeding with any deletions, cross-verify this list with the Frontend team to ensure no client-side features rely on "Redundant" or "Obsolete" tables.

---

## 1. Active Production Tables (DO NOT DELETE)
These tables are strictly mapped to the SQLAlchemy models in `src/models/` and are required for the system to function.

| Category | Table Name | Backend Model |
| :--- | :--- | :--- |
| **Auth/Core** | `faculty` | `Part_B/faculty.py` |
| **Auth/Core** | `school` | `overall/school.py` |
| **Part A** | `annual_confidential_report` | `Part_A/acr.py` |
| **Part A** | `course_file` | `Part_A/course_file.py` |
| **Part A** | `departmental_activities` | `Part_A/departmental_activities.py` |
| **Part A** | `industry_connect_activity` | `Part_A/industry_connect.py` |
| **Part A** | `project` | `Part_A/project.py` |
| **Part A** | `qualification_enhancement` | `Part_A/qualification_enhancement.py` |
| **Part A** | `contribution_to_society` | `Part_A/social_contributions.py` |
| **Part A** | `student_feedback` | `Part_A/student_feedback.py` |
| **Part A** | `innovative_teaching_methods` | `Part_A/teaching_methods.py` |
| **Part A** | `teaching_process` | `Part_A/teaching_process.py` |
| **Part A** | `university_activities` | `Part_A/university_activities.py` |
| **Part B** | `book_publications` | `Part_B/book_publication.py` |
| **Part B** | `academic_events` | `Part_B/conference_paper.py` |
| **Part B** | `ict_teaching_content` | `Part_B/ict_pedagogy.py` |
| **Part B** | `industrial_training` | `Part_B/industrial_training.py` |
| **Part B** | `ipr` | `Part_B/ipr.py` |
| **Part B** | `journal_publications` | `Part_B/journal_publication.py` |
| **Part B** | `popular_writings` | `Part_B/popular_writings.py` |
| **Part B** | `products_developed` | `Part_B/product_development.py` |
| **Part B** | `research_awards` | `Part_B/research_award.py` |
| **Part B** | `research_guidance` | `Part_B/research_guidance.py` |
| **Part B** | `research_projects` | `Part_B/research_project.py` |
| **Part B** | `research_proposals` | `Part_B/research_proposal.py` |
| **Part B** | `self_development` | `Part_B/self_development_fdp.py` |
| **Overall** | `appraisal_summary_tracking` | `overall/appraisal_summary.py` |
| **Overall** | `enclosure_text_block` | `overall/finalization.py` |
| **Overall** | `enclosure_declaration` | `overall/finalization.py` |
| **Overall** | `appraisal_remarks` | `overall/remarks.py` |
| **Overall** | `hod_remarks` | `overall/remarks.py` |
| **Overall** | `director_remarks` | `overall/remarks.py` |
| **Overall** | `dean_remarks` | `overall/remarks.py` |
| **Overall** | `final_approval` | `overall/remarks.py` |

---

## 2. Redundant / Replaceable Tables (Pending Verification)
The backend has alternative tables (listed in Section 1) that are more up-to-date. However, the **Frontend Team** should verify if they are using any of these for specific UI components.

| Table Name | Why it is Redundant | Recommended Action |
| :--- | :--- | :--- |
| `faculty_profiles` | Duplicate of `faculty`. | Migrate Frontend to `faculty`. |
| `declarations` | Replaced by `enclosure_declaration`. | Verify if Frontend uses for submission status. |
| `course_files` | Plural version of `course_file`. | Delete after data migration. |
| `social_contributions` | Replaced by `contribution_to_society`. | Delete. |
| `industry_connect` | Replaced by `industry_connect_activity`. | Delete. |
| `conferences` | Replaced by `academic_events`. | Delete. |
| `awards` | Replaced by `research_awards`. | Delete. |
| `patents` | Replaced by `ipr`. | Delete. |
| `published_papers` | Replaced by `journal_publications`. | Delete. |
| `projects_guided` | Replaced by `research_guidance`. | Delete. |
| `department_activities` | Replaced by `departmental_activities`. | Delete. |
| `innovative_teaching` | Replaced by `innovative_teaching_methods`. | Delete. |
| `ict_pedagogy` | Replaced by `ict_teaching_content`. | Delete. |
| `acr_scores` | Replaced by `annual_confidential_report`. | Delete. |

---

## 3. Obsolete Tables (Likely Safe to Delete)
These tables have no mapping in the Backend and no current use-case identified.

| Table Name | Reason |
| :--- | :--- |
| `appraisal_documents` | File paths are stored directly in data rows. |
| `appraisal_reviews` | Replaced by hierarchical remarks system. |
| `appraisal_snapshots` | No snapshotting logic currently active. |

---

## Next Steps for Collaboration
1. **Frontend Team:** Please review Section 2 and Section 3.
2. **Action Required:** If any table in Section 2 is "Must Stay", please document the specific UI component/route that relies on it.
3. **Data Migration:** Ensure any data in "Redundant" tables is migrated to the "Active" tables before deletion.
