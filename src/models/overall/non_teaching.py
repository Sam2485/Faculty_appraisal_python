from sqlalchemy import Column, String, ForeignKey, Double, Date, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from src.setup.database import Base

class NonTeachingAppraisal(Base):
    __tablename__ = "non_teaching_appraisal"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("faculty.id"), nullable=False)
    academic_year = Column(String(20), nullable=False)

    # I. General Information Section
    joining_date = Column(Date)
    designation = Column(String)
    department_section = Column(String)
    experience_dypiu = Column(Double)
    total_experience = Column(Double)
    current_qualifications = Column(String)
    new_qualifications = Column(String)
    reporting_head = Column(String)
    other_info = Column(String)
    staff_signature_date = Column(Date)

    # II. PART A: Self-Appraisal (Triple-audit columns)
    # Staff Claimed
    responsibilities_staff = Column(Double, default=0.0)
    contributions_staff = Column(Double, default=0.0)
    achievements_staff = Column(Double, default=0.0)
    # Section Head Verified
    responsibilities_sh = Column(Double, default=0.0)
    contributions_sh = Column(Double, default=0.0)
    achievements_sh = Column(Double, default=0.0)
    # Registrar Verified
    responsibilities_registrar = Column(Double, default=0.0)
    contributions_registrar = Column(Double, default=0.0)
    achievements_registrar = Column(Double, default=0.0)

    # III. PART B: Assessment
    # Professional Competence (pc)
    pc_knowledge_rules = Column(Integer, default=0)
    pc_organize_work = Column(Integer, default=0)
    pc_additional_assignments = Column(Integer, default=0)
    pc_creativity_innovation = Column(Integer, default=0)
    pc_learn_new_duties = Column(Integer, default=0)
    # Quality of Work (qw)
    qw_maintain_records = Column(Integer, default=0)
    qw_accuracy_speed = Column(Integer, default=0)
    qw_neatness_tidiness = Column(Integer, default=0)
    qw_completion_time = Column(Integer, default=0)
    qw_diligence_responsibility = Column(Integer, default=0)
    # Personal Characteristics (ph)
    ph_reliability = Column(Integer, default=0)
    ph_attitude_respect = Column(Integer, default=0)
    ph_discipline = Column(Integer, default=0)
    ph_team_work = Column(Integer, default=0)
    ph_integrity_behavior = Column(Integer, default=0)
    ph_interpersonal_relations = Column(Integer, default=0)
    # Regularity (rg)
    rg_attendance_punctuality = Column(Integer, default=0)
    rg_leave_discipline = Column(Integer, default=0)
    rg_communication = Column(Integer, default=0)
    rg_adherence_hours = Column(Integer, default=0)
    rg_responsibility_absence = Column(Integer, default=0)

    # Status and Workflow
    status = Column(String(50), default="DRAFT") # DRAFT, SUBMITTED, SECTION_HEAD_REVIEWED, REGISTRAR_REVIEWED, FINALIZED
    
    # Final Recommendations & Grades
    sh_recommendation = Column(String)
    sh_grade = Column(String(10))
    sh_signature_date = Column(Date)
    
    registrar_recommendation = Column(String)
    registrar_grade = Column(String(10))
    registrar_signature_date = Column(Date)
    
    vc_final_grade = Column(String(10))
    vc_remarks = Column(String)
    vc_signature_date = Column(Date)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    staff = relationship("Faculty")
