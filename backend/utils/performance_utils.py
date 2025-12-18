# backend/utils/performance_utils.py
from typing import List, Dict, Any
from datetime import datetime, timedelta
from config.db import db
from models.performance_model import PerformanceThreshold, PerformanceLevel, PerformanceRecordOut
import numpy as np
from sklearn.linear_model import LinearRegression
import logging

logger = logging.getLogger(__name__)

PERFORMANCE_COLLECTION = "performance_records"
ANALYTICS_COLLECTION = "performance_analytics"
THRESHOLDS_COLLECTION = "performance_thresholds"

async def get_performance_thresholds() -> PerformanceThreshold:
    """Get current performance thresholds from database."""
    thresholds = await db[THRESHOLDS_COLLECTION].find_one({})
    if not thresholds:
        # Create default thresholds
        default = PerformanceThreshold()
        await db[THRESHOLDS_COLLECTION].insert_one(default.dict())
        return default
    return PerformanceThreshold(**thresholds)

def calculate_performance_level(score: float, thresholds: PerformanceThreshold) -> PerformanceLevel:
    """Calculate performance level based on score and thresholds."""
    if score >= thresholds.excellent_threshold:
        return PerformanceLevel.EXCELLENT
    elif score >= thresholds.average_threshold:
        return PerformanceLevel.AVERAGE
    else:
        return PerformanceLevel.LOW

async def get_student_records(student_id: str, days: int = 365) -> List[Dict[str, Any]]:
    """Get performance records for a student within specified days."""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    cursor = db[PERFORMANCE_COLLECTION].find({
        "student_id": student_id,
        "created_at": {"$gte": cutoff_date}
    }).sort("created_at", 1)

    records = []
    async for record in cursor:
        records.append(record)
    return records

async def calculate_student_analytics(student_id: str) -> Dict[str, Any]:
    """Calculate comprehensive analytics for a student."""
    records = await get_student_records(student_id)

    if not records:
        return {
            "student_id": student_id,
            "overall_average": 0,
            "academic_average": 0,
            "non_academic_average": 0,
            "performance_level": PerformanceLevel.LOW,
            "total_records": 0,
            "academic_records": 0,
            "non_academic_records": 0,
            "trend": "insufficient_data",
            "last_updated": datetime.utcnow()
        }

    # Separate academic and non-academic records
    academic_records = [r for r in records if r["type"] == "academic"]
    non_academic_records = [r for r in records if r["type"] == "non_academic"]

    # Calculate averages
    academic_scores = [r["score"] for r in academic_records]
    non_academic_scores = [r["score"] for r in non_academic_records]
    all_scores = [r["score"] for r in records]

    academic_avg = np.mean(academic_scores) if academic_scores else 0
    non_academic_avg = np.mean(non_academic_scores) if non_academic_scores else 0
    overall_avg = np.mean(all_scores)

    # Calculate performance level
    thresholds = await get_performance_thresholds()
    level = calculate_performance_level(overall_avg, thresholds)

    # Calculate trend using linear regression
    trend = calculate_performance_trend(records)

    # Group by categories
    category_averages = {}
    semester_averages = {}

    for record in records:
        category = record.get("category", "unknown")
        semester = record.get("semester", "unknown")

        if category not in category_averages:
            category_averages[category] = []
        category_averages[category].append(record["score"])

        if semester not in semester_averages:
            semester_averages[semester] = []
        semester_averages[semester].append(record["score"])

    # Calculate averages for categories and semesters
    category_averages = {k: np.mean(v) for k, v in category_averages.items()}
    semester_averages = {k: np.mean(v) for k, v in semester_averages.items()}

    return {
        "student_id": student_id,
        "overall_average": round(overall_avg, 2),
        "academic_average": round(academic_avg, 2),
        "non_academic_average": round(non_academic_avg, 2),
        "performance_level": level,
        "total_records": len(records),
        "academic_records": len(academic_records),
        "non_academic_records": len(non_academic_records),
        "category_averages": {k: round(v, 2) for k, v in category_averages.items()},
        "semester_averages": {k: round(v, 2) for k, v in semester_averages.items()},
        "trend": trend,
        "last_updated": datetime.utcnow()
    }

def calculate_performance_trend(records: List[Dict[str, Any]]) -> str:
    """Calculate performance trend using linear regression."""
    if len(records) < 3:
        return "insufficient_data"

    try:
        # Sort records by date
        sorted_records = sorted(records, key=lambda x: x["created_at"])

        # Prepare data for regression
        dates = [(r["created_at"] - sorted_records[0]["created_at"]).days for r in sorted_records]
        scores = [r["score"] for r in sorted_records]

        # Reshape for sklearn
        X = np.array(dates).reshape(-1, 1)
        y = np.array(scores)

        # Fit linear regression
        model = LinearRegression()
        model.fit(X, y)

        # Calculate slope
        slope = model.coef_[0]

        # Determine trend
        if slope > 1:  # Improving significantly
            return "improving"
        elif slope < -1:  # Declining significantly
            return "declining"
        else:
            return "stable"

    except Exception as e:
        logger.error(f"Error calculating trend: {e}")
        return "unknown"

async def detect_low_performance(student_id: str) -> List[Dict[str, Any]]:
    """Detect low performance indicators for a student."""
    thresholds = await get_performance_thresholds()
    records = await get_student_records(student_id, days=30)  # Last 30 days

    alerts = []

    # Check for low scores
    low_score_records = [
        r for r in records
        if r["score"] < thresholds.low_score_threshold
    ]

    if low_score_records:
        alerts.append({
            "type": "low_score",
            "message": f"Found {len(low_score_records)} low performance records in the last 30 days",
            "records": low_score_records
        })

    # Check for inactivity (no records in last 14 days)
    recent_records = await get_student_records(student_id, days=14)
    if not recent_records:
        alerts.append({
            "type": "inactivity",
            "message": f"No performance records in the last {thresholds.low_engagement_threshold_days} days",
            "severity": "high"
        })

    # Check overall performance level
    analytics = await calculate_student_analytics(student_id)
    if analytics["performance_level"] == PerformanceLevel.LOW:
        alerts.append({
            "type": "overall_low_performance",
            "message": f"Overall performance level is LOW (average: {analytics['overall_average']}%)",
            "severity": "high"
        })

    return alerts

async def generate_performance_insights(student_id: str) -> Dict[str, Any]:
    """Generate AI-powered insights for student performance."""
    analytics = await calculate_student_analytics(student_id)
    records = await get_student_records(student_id)

    insights = {
        "strengths": [],
        "weaknesses": [],
        "recommendations": [],
        "predicted_trend": analytics["trend"]
    }

    # Analyze strengths
    for category, avg in analytics["category_averages"].items():
        thresholds = await get_performance_thresholds()
        if avg >= thresholds.excellent_threshold:
            insights["strengths"].append(f"Excellent performance in {category}")
        elif avg < thresholds.average_threshold:
            insights["weaknesses"].append(f"Needs improvement in {category}")

    # Generate recommendations based on trend and performance
    if analytics["trend"] == "declining":
        insights["recommendations"].append("Performance is declining. Consider seeking additional help or tutoring.")
    elif analytics["trend"] == "improving":
        insights["recommendations"].append("Great improvement! Keep up the good work.")
    else:
        insights["recommendations"].append("Performance is stable. Focus on weak areas to improve further.")

    if analytics["academic_records"] < analytics["non_academic_records"]:
        insights["recommendations"].append("Consider focusing more on academic performance.")

    return insights

async def update_student_analytics_async(student_id: str):
    """Async wrapper to update student analytics in database."""
    analytics = await calculate_student_analytics(student_id)

    await db[ANALYTICS_COLLECTION].update_one(
        {"student_id": student_id},
        {"$set": analytics},
        upsert=True
    )

    logger.info(f"Updated analytics for student {student_id}")