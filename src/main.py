from fastapi import FastAPI
from .setup.database import engine, Base
from .models.Part_B import faculty
from .models.Part_B.journal_publication import JournalPublication
from .models.Part_B.book_publication import BookPublication
from .models.Part_B.ict_pedagogy import ICTPedagogy
from .models.Part_B.research_guidance import ResearchGuidance
from .models.Part_B.research_project import ResearchProject
from .models.Part_B.ipr import IPR
from .models.Part_B.research_award import ResearchAward
from .models.Part_B.conference_paper import ConferencePaper
from .models.Part_B.research_proposal import ResearchProposal
from .models.Part_B.product_development import ProductDevelopment
from .models.Part_B.self_development_fdp import SelfDevelopmentFDP
from .models.Part_B.industrial_training import IndustrialTraining

# Import Part A models
from .models.Part_A import (
    acr, course_file, departmental_activities, industry_connect,
    project, qualification_enhancement, social_contributions,
    student_feedback, teaching_methods, teaching_process, university_activities
)

# Import API routers - Part B
from .api.Part_B.v1 import (
    journal_publication, book_publication, ict_pedagogy,
    research_guidance, research_project, ipr,
    research_award, conference_paper, research_proposal,
    product_development, self_development_fdp, industrial_training
)

# Import API routers - Part A
from .api.Part_A.v1 import (
    teaching_process as api_tp,
    course_file as api_cf,
    teaching_methods as api_tm,
    project as api_pj,
    qualification_enhancement as api_qe,
    student_feedback as api_fb,
    departmental_activities as api_da,
    university_activities as api_ua,
    social_contributions as api_sc,
    industry_connect as api_ic,
    acr as api_acr,
    part_a_summary as api_pa_summary
)

# Import Overall API
from .api.overall.v1 import appraisal_summary, remarks, finalization, non_teaching

# Create all tables defined in Base
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Faculty Appraisal API",
    description="API for managing faculty appraisal data.",
    version="1.0.0",
)

# Include Non-Teaching router
app.include_router(non_teaching.router, prefix="/api/v1", tags=["Non-Teaching Appraisal"])

# Include Part B routers
app.include_router(journal_publication.router, prefix="/api/v1", tags=["Journal Publications"])
app.include_router(book_publication.router, prefix="/api/v1", tags=["Book Publications"])
app.include_router(ict_pedagogy.router, prefix="/api/v1", tags=["ICT Pedagogies"])
app.include_router(research_guidance.router, prefix="/api/v1", tags=["Research Guidance"])
app.include_router(research_project.router, prefix="/api/v1", tags=["Research Projects"])
app.include_router(ipr.router, prefix="/api/v1", tags=["IPR Entries"])
app.include_router(research_award.router, prefix="/api/v1", tags=["Research Awards"])
app.include_router(conference_paper.router, prefix="/api/v1", tags=["Conference Papers"])
app.include_router(research_proposal.router, prefix="/api/v1", tags=["Research Proposals"])
app.include_router(product_development.router, prefix="/api/v1", tags=["Product Developments"])
app.include_router(self_development_fdp.router, prefix="/api/v1", tags=["Self-Development FDP"])
app.include_router(industrial_training.router, prefix="/api/v1", tags=["Industrial Trainings"])

# Include Part A routers
app.include_router(api_tp.router, prefix="/api/v1/part-a", tags=["Part A: Teaching Process"])
app.include_router(api_cf.router, prefix="/api/v1/part-a", tags=["Part A: Course File"])
app.include_router(api_tm.router, prefix="/api/v1/part-a", tags=["Part A: Teaching Methods"])
app.include_router(api_pj.router, prefix="/api/v1/part-a", tags=["Part A: Projects"])
app.include_router(api_qe.router, prefix="/api/v1/part-a", tags=["Part A: Qualification Enhancement"])
app.include_router(api_fb.router, prefix="/api/v1/part-a", tags=["Part A: Student Feedback"])
app.include_router(api_da.router, prefix="/api/v1/part-a", tags=["Part A: Departmental Activities"])
app.include_router(api_ua.router, prefix="/api/v1/part-a", tags=["Part A: University Activities"])
app.include_router(api_sc.router, prefix="/api/v1/part-a", tags=["Part A: Social Contributions"])
app.include_router(api_ic.router, prefix="/api/v1/part-a", tags=["Part A: Industry Connect"])
app.include_router(api_acr.router, prefix="/api/v1/part-a", tags=["Part A: ACR"])
app.include_router(api_pa_summary.router, prefix="/api/v1/part-a", tags=["Part A: Summary"])

# Include Overall routers
app.include_router(appraisal_summary.router, prefix="/api", tags=["Appraisal Summary"])
app.include_router(remarks.router, prefix="/api/v1", tags=["Appraisal Remarks"])
app.include_router(finalization.router, prefix="/api/v1", tags=["Finalization (Enclosures & Declaration)"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Faculty Appraisal API"}
