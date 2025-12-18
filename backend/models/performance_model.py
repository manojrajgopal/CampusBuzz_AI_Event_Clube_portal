# backend/models/performance_model.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class PerformanceType(str, Enum):
    ACADEMIC = "academic"
    NON_ACADEMIC = "non_academic"

class PerformanceLevel(str, Enum):
    EXCELLENT = "excellent"
    AVERAGE = "average"
    LOW = "low"

class AcademicCategory(str, Enum):
    SUBJECT = "subject"
    EXAM = "exam"
    SEMESTER = "semester"
    ACTIVITY = "activity"

class NonAcademicCategory(str, Enum):
    CLUB_PARTICIPATION = "club_participation"
    ATTENDANCE = "attendance"
    ENGAGEMENT = "engagement"

class PerformanceRecordIn(BaseModel):
    student_id: str = Field(..., description="Student user ID")
    type: PerformanceType
    category: str  # Will be validated based on type
    subcategory: Optional[str] = None  # e.g., subject name, club name
    score: float = Field(..., ge=0, le=100, description="Score out of 100")
    max_score: float = Field(default=100, ge=0)
    semester: Optional[str] = None
    year: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None  # Additional data

class PerformanceRecordOut(PerformanceRecordIn):
    id: str
    calculated_level: PerformanceLevel
    created_at: datetime
    updated_at: datetime

class PerformanceAnalytics(BaseModel):
    student_id: str
    student_name: Optional[str] = None  # Added for display purposes
    overall_average: float
    academic_average: float
    non_academic_average: float
    performance_level: PerformanceLevel
    semester_averages: Dict[str, float]
    category_averages: Dict[str, float]
    trend: str  # "improving", "declining", "stable"
    last_updated: datetime

class NotificationType(str, Enum):
    LOW_PERFORMANCE = "low_performance"
    IMPROVEMENT = "improvement"
    ALERT = "alert"

class NotificationIn(BaseModel):
    student_id: str
    type: NotificationType
    title: str
    message: str
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")
    metadata: Optional[Dict[str, Any]] = None

class NotificationOut(NotificationIn):
    id: str
    read: bool = False
    created_at: datetime

class PerformanceThreshold(BaseModel):
    low_score_threshold: float = Field(default=40.0, ge=0, le=100)
    low_engagement_threshold_days: int = Field(default=14, ge=1)
    excellent_threshold: float = Field(default=85.0, ge=0, le=100)
    average_threshold: float = Field(default=60.0, ge=0, le=100)

class AIPrediction(BaseModel):
    student_id: str
    predicted_score: float
    confidence: float
    trend: str
    suggestions: List[str]
    generated_at: datetime

class AIImprovementSuggestion(BaseModel):
    student_id: str
    suggestions: List[str]
    priority_areas: List[str]
    generated_at: datetime