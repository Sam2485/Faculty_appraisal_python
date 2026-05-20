from sqlalchemy import Column, String, Numeric, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime
from src.setup.database import Base

class NonTeachingAppraisal(Base):
    __tablename__ = "non_teaching_appraisals"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    staff_email = Column(String, nullable=False)
    academic_year = Column(String, nullable=False)
    payload = Column(JSONB, nullable=False)
    status = Column(String, nullable=False, default='Draft')
    self_total = Column(Numeric, nullable=False, default=0)
    ro_total = Column(Numeric, nullable=False, default=0)
    registrar_total = Column(Numeric, nullable=False, default=0)
    vc_total = Column(Numeric, nullable=False, default=0)
    submitted_at = Column(DateTime(timezone=True))
    ro_reviewed_at = Column(DateTime(timezone=True))
    registrar_reviewed_at = Column(DateTime(timezone=True))
    vc_reviewed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class NonTeachingPartAItem(Base):
    __tablename__ = "non_teaching_part_a_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    staff_email = Column(String, nullable=False)
    academic_year = Column(String, nullable=False)
    item_key = Column(String, nullable=False)
    title = Column(String, nullable=False)
    max_marks = Column(Numeric, nullable=False)
    details = Column(String)
    self_marks = Column(Numeric)
    ro_marks = Column(Numeric)
    registrar_marks = Column(Numeric)
    vc_marks = Column(Numeric)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class NonTeachingPartBRating(Base):
    __tablename__ = "non_teaching_part_b_ratings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    staff_email = Column(String, nullable=False)
    academic_year = Column(String, nullable=False)
    section_key = Column(String, nullable=False)
    section_title = Column(String, nullable=False)
    max_marks = Column(Numeric, nullable=False)
    parameter_no = Column(Integer, nullable=False)
    parameter_label = Column(String, nullable=False)
    ro_rating = Column(Numeric)
    registrar_rating = Column(Numeric)
    vc_rating = Column(Numeric)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class NTDesignation(Base):
    __tablename__ = "nt_designations"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name        = Column(String, nullable=False, unique=True)
    description = Column(String)
    is_system   = Column(Boolean, nullable=False, default=False)
    is_active   = Column(Boolean, nullable=False, default=True)
    created_at  = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at  = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    steps = relationship("NTWorkflowTemplateStep", back_populates="designation_obj")


class NTWorkflowTemplate(Base):
    __tablename__ = "nt_workflow_templates"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name        = Column(String, nullable=False)
    description = Column(String)
    is_active   = Column(Boolean, nullable=False, default=True)
    is_default  = Column(Boolean, nullable=False, default=False)
    created_at  = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at  = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    steps       = relationship("NTWorkflowTemplateStep", back_populates="template",
                               order_by="NTWorkflowTemplateStep.step_no",
                               cascade="all, delete-orphan")
    assignments = relationship("NTWorkflowAssignment", back_populates="template")
    instances   = relationship("NTWorkflowInstance",   back_populates="template")


class NTWorkflowTemplateStep(Base):
    __tablename__ = "nt_workflow_template_steps"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id    = Column(UUID(as_uuid=True), ForeignKey("nt_workflow_templates.id", ondelete="CASCADE"), nullable=False)
    step_no        = Column(Integer, nullable=False)
    designation_id = Column(UUID(as_uuid=True), ForeignKey("nt_designations.id"), nullable=False)
    is_required    = Column(Boolean, nullable=False, default=True)
    created_at     = Column(DateTime(timezone=True), default=datetime.utcnow)

    template        = relationship("NTWorkflowTemplate",  back_populates="steps")
    designation_obj = relationship("NTDesignation",       back_populates="steps")


class NTWorkflowAssignment(Base):
    __tablename__ = "nt_workflow_assignments"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id    = Column(UUID(as_uuid=True), ForeignKey("nt_workflow_templates.id"), nullable=False)
    staff_email    = Column(String, unique=True)
    appraisal_role = Column(String)
    department     = Column(String)
    created_at     = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at     = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    template = relationship("NTWorkflowTemplate", back_populates="assignments")


class NTWorkflowInstance(Base):
    __tablename__ = "nt_workflow_instances"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appraisal_id  = Column(UUID(as_uuid=True), ForeignKey("non_teaching_appraisals.id", ondelete="CASCADE"), nullable=False)
    template_id   = Column(UUID(as_uuid=True), ForeignKey("nt_workflow_templates.id"))
    staff_email   = Column(String, nullable=False)
    academic_year = Column(String, nullable=False)
    current_step  = Column(Integer)
    status        = Column(String, nullable=False, default="PENDING")
    created_at    = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at    = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    template       = relationship("NTWorkflowTemplate", back_populates="instances")
    instance_steps = relationship("NTWorkflowInstanceStep", back_populates="instance",
                                  order_by="NTWorkflowInstanceStep.step_no",
                                  cascade="all, delete-orphan")


class NTWorkflowInstanceStep(Base):
    __tablename__ = "nt_workflow_instance_steps"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instance_id    = Column(UUID(as_uuid=True), ForeignKey("nt_workflow_instances.id", ondelete="CASCADE"), nullable=False)
    step_no        = Column(Integer, nullable=False)
    designation    = Column(String, nullable=False)
    reviewer_email = Column(String)
    status         = Column(String, nullable=False, default="WAITING")
    score          = Column(Numeric)
    remarks        = Column(Text)
    reviewed_at    = Column(DateTime(timezone=True))
    created_at     = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at     = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    instance = relationship("NTWorkflowInstance", back_populates="instance_steps")
