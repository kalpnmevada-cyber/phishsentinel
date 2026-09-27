import re
from urllib.parse import urlparse
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

CONTROL_CHAR_REGEX = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")

class AnalyzeRequest(BaseModel):
    message: Optional[str] = Field(None, max_length=5000, description="SMS or chat message text")
    url: Optional[str] = Field(None, max_length=2048, description="Optional standalone URL to analyze")
    language: Optional[str] = Field("en", description="Explanation language: 'en', 'hi', or 'gu'")

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if "\x00" in v:
                raise ValueError("Null bytes are not allowed in message")
            if CONTROL_CHAR_REGEX.search(v):
                raise ValueError("Unsafe control characters detected in message")
            v = v.strip()
        return v

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                return None
            if "\x00" in v:
                raise ValueError("Null bytes are not allowed in URL")
            if CONTROL_CHAR_REGEX.search(v):
                raise ValueError("Unsafe control characters detected in URL")
            # Ensure URL can be parsed
            try:
                parsed = urlparse(v if "://" in v else f"http://{v}")
                if not parsed.netloc and not parsed.path:
                    raise ValueError("Malformed URL provided")
            except Exception as e:
                raise ValueError(f"Invalid URL structure: {str(e)}")
        return v

    @model_validator(mode="after")
    def check_at_least_one_input(self):
        msg = self.message
        url = self.url
        if (not msg or not msg.strip()) and (not url or not url.strip()):
            raise ValueError("Either 'message' or 'url' must be provided and non-empty.")
        return self

class IndicatorItem(BaseModel):
    id: str
    signal_source: str  # "rule_engine", "url_analyzer", "ml_classifier", "llm_layer"
    category: str
    severity: str       # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    title: str
    description: str
    score_delta: int

class SignalDetail(BaseModel):
    signal_name: str
    fired: bool
    score_impact: int
    confidence: float
    summary: str
    technical_details: Dict[str, Any] = Field(default_factory=dict)

class MultilingualExplanation(BaseModel):
    en: Dict[str, Any]
    hi: Dict[str, Any]
    gu: Dict[str, Any]

class AnalysisResponse(BaseModel):
    id: int
    message: str
    extracted_urls: List[str]
    brand_claimed: str
    category: str
    risk_score: int
    risk_level: str  # "LOW", "SUSPICIOUS", "HIGH RISK"
    summary: str
    plain_reasons: List[str]
    recommended_action: str
    ml_probability: float
    ml_model_version: str
    indicators: List[IndicatorItem]
    signals: Dict[str, SignalDetail]
    multilingual: Optional[MultilingualExplanation] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class ReportCreateRequest(BaseModel):
    analysis_id: int
    consent_given: bool = Field(..., description="Must explicitly be True acknowledging DPDPA notice")

    @field_validator("consent_given")
    @classmethod
    def must_be_true(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Explicit consent is required to store and generate an official report under DPDPA.")
        return v

class ReportResponse(BaseModel):
    id: int
    analysis_id: int
    report_code: str
    message: str
    url: Optional[str] = None
    category: str
    risk_level: str
    risk_score: int
    brand_claimed: Optional[str] = None
    status: str
    submitted_at: Optional[datetime] = None
    submission_adapter: Optional[str] = None
    ack_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class SubmitReportRequest(BaseModel):
    report_id: int

class SubmitReportResponse(BaseModel):
    report_id: int
    report_code: str
    status: str
    submission_adapter: str
    ack_id: str
    submitted_at: datetime
    message: str

class ConsentRequest(BaseModel):
    event_type: str = Field(..., max_length=100)
    details: Dict[str, Any] = Field(default_factory=dict)

class ConsentResponse(BaseModel):
    id: int
    event_type: str
    consented_at: datetime
    status: str = "RECORDED"

class StatsResponse(BaseModel):
    total_analyses: int
    high_risk_count: int
    suspicious_count: int
    low_risk_count: int
    reports_submitted: int
    suspicious_urls_found: int
    risk_distribution: Dict[str, int]
    category_distribution: Dict[str, int]
    top_brands: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]
