import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message = Column(Text, nullable=False)
    url = Column(String(2048), nullable=True)
    risk_score = Column(Integer, nullable=False, default=0)
    risk_level = Column(String(50), nullable=False, default="LOW")
    category = Column(String(100), nullable=False, default="General")
    brand_claimed = Column(String(100), nullable=True, default="None")
    summary = Column(Text, nullable=False, default="")
    indicators = Column(JSON, nullable=False, default=list)
    signal_breakdown = Column(JSON, nullable=False, default=dict)
    ml_probability = Column(Float, nullable=False, default=0.0)
    ml_model_version = Column(String(50), nullable=False, default="v2.0-tfidf-linear")
    recommended_action = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    reports = relationship("Report", back_populates="analysis", cascade="all, delete-orphan")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    report_code = Column(String(50), unique=True, index=True, nullable=False)
    message = Column(Text, nullable=False)
    url = Column(String(2048), nullable=True)
    category = Column(String(100), nullable=False)
    risk_level = Column(String(50), nullable=False)
    risk_score = Column(Integer, nullable=False)
    brand_claimed = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False, default="DRAFT")  # DRAFT, SUBMITTED
    submitted_at = Column(DateTime, nullable=True)
    submission_adapter = Column(String(100), nullable=True)
    ack_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    analysis = relationship("Analysis", back_populates="reports")

class Consent(Base):
    __tablename__ = "consents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_type = Column(String(100), nullable=False)
    consented_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    details = Column(JSON, nullable=False, default=dict)
    ip_hash = Column(String(64), nullable=True)

class ModelMetric(Base):
    __tablename__ = "model_metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_version = Column(String(50), unique=True, nullable=False)
    trained_at = Column(DateTime, nullable=False)
    metrics = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
