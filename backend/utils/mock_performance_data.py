# backend/utils/mock_performance_data.py
"""
Mock data generator for Student Performance & Score Tracking System
Provides realistic sample data for demonstration purposes
"""
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from models.performance_model import (
    PerformanceRecordOut, NotificationOut, AIPrediction, AIImprovementSuggestion,
    PerformanceLevel, NotificationType
)

# Mock data pools
SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "History", "Geography"]
EXAM_TYPES = ["Mid-term Exam", "Final Exam", "Quiz", "Assignment", "Project", "Lab Work"]
CLUB_ACTIVITIES = ["Meeting Attendance", "Event Participation", "Leadership Role", "Workshop Contribution"]
ENGAGEMENT_METRICS = ["Forum Posts", "Study Group Participation", "Resource Sharing", "Peer Mentoring"]

# Student names for mock data
STUDENT_NAMES = [
    "Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Wilson", "Edward Davis",
    "Fiona Garcia", "George Miller", "Hannah Taylor", "Ian Anderson", "Julia Thomas",
    "Kevin Jackson", "Laura White", "Michael Harris", "Nancy Martin", "Oliver Clark",
    "Paula Rodriguez", "Quincy Lewis", "Rachel Walker", "Steven Hall", "Tina Allen",
    "Ulysses Young", "Victoria King", "William Wright", "Xena Lopez", "Yusuf Hill",
    "Zoe Scott", "Aaron Green", "Bella Adams", "Caleb Baker", "Delilah Carter"
]

NOTIFICATION_TEMPLATES = [
    {
        "type": "low_performance",
        "title": "Low Performance Alert",
        "message": "Your performance in {category} is below the expected threshold. Consider reviewing the material and seeking additional help."
    },
    {
        "type": "improvement",
        "title": "Performance Improvement",
        "message": "Great job! Your recent performance in {category} shows significant improvement. Keep up the good work!"
    },
    {
        "type": "engagement",
        "title": "Engagement Reminder",
        "message": "We noticed reduced activity in {category}. Regular participation helps improve your overall performance."
    }
]

AI_SUGGESTIONS_POOL = [
    "Focus on understanding core concepts before moving to advanced topics",
    "Practice regularly with sample problems to build confidence",
    "Join study groups to discuss difficult concepts with peers",
    "Utilize office hours to clarify doubts with instructors",
    "Review past assignments to identify common mistakes",
    "Create mind maps to connect different topics",
    "Take short breaks during study sessions to maintain focus",
    "Use online resources and tutorials for additional explanations",
    "Set specific daily study goals and track your progress",
    "Participate actively in class discussions and ask questions"
]

def get_student_seed(student_id: str) -> int:
    """Generate a consistent seed for a student to ensure same mock data per student"""
    return hash(student_id) % 10000

def get_student_name(student_id: str) -> str:
    """Get a consistent student name for a student ID"""
    seed = get_student_seed(student_id)
    return STUDENT_NAMES[seed % len(STUDENT_NAMES)]

def generate_mock_performance_records(student_id: str, count: int = 15) -> List[Dict[str, Any]]:
    """Generate mock performance records for a student"""
    random.seed(get_student_seed(student_id))

    records = []
    base_date = datetime.utcnow() - timedelta(days=90)

    for i in range(count):
        # Mix of academic and non-academic records
        is_academic = random.choice([True, True, False])  # 2:1 ratio academic:non-academic

        if is_academic:
            category = random.choice(["subject", "exam", "activity"])
            if category == "subject":
                subcategory = random.choice(SUBJECTS)
                # Students have varying performance levels
                base_score = 65 + (get_student_seed(student_id) % 25)  # 65-90 range
                score = max(40, min(100, base_score + random.randint(-15, 15)))
            elif category == "exam":
                subcategory = random.choice(EXAM_TYPES)
                base_score = 70 + (get_student_seed(student_id) % 20)  # 70-90 range
                score = max(45, min(100, base_score + random.randint(-10, 10)))
            else:  # activity
                subcategory = "Class Participation"
                score = random.randint(60, 95)
        else:
            category = random.choice(["club_participation", "attendance", "engagement"])
            if category == "club_participation":
                subcategory = random.choice(CLUB_ACTIVITIES)
                score = random.randint(70, 100)
            elif category == "attendance":
                subcategory = "Class Attendance"
                score = random.randint(75, 100)
            else:  # engagement
                subcategory = random.choice(ENGAGEMENT_METRICS)
                score = random.randint(50, 95)

        # Calculate performance level
        if score >= 85:
            level = PerformanceLevel.EXCELLENT
        elif score >= 70:
            level = PerformanceLevel.AVERAGE
        else:
            level = PerformanceLevel.LOW

        record_date = base_date + timedelta(days=random.randint(0, 90))
        semester = "Fall 2024" if record_date.month < 7 else "Spring 2024"

        record = {
            "id": f"mock_{student_id}_{i}",
            "student_id": student_id,
            "type": "academic" if is_academic else "non_academic",
            "category": category,
            "subcategory": subcategory,
            "score": score,
            "max_score": 100,
            "semester": semester,
            "year": "2024",
            "description": f"Performance record for {subcategory}",
            "calculated_level": level,
            "created_at": record_date,
            "updated_at": record_date
        }
        records.append(record)

    # Sort by date descending (most recent first)
    records.sort(key=lambda x: x["created_at"], reverse=True)
    return records

def generate_mock_notifications(student_id: str, performance_records: List[Dict]) -> List[Dict[str, Any]]:
    """Generate mock notifications based on performance records"""
    random.seed(get_student_seed(student_id) + 1)

    notifications = []

    # Generate 1-3 notifications per student
    num_notifications = random.randint(1, 3)

    for i in range(num_notifications):
        # Pick a random performance record
        record = random.choice(performance_records)

        # Choose notification type based on performance
        if record["calculated_level"] == PerformanceLevel.LOW:
            template = NOTIFICATION_TEMPLATES[0]  # low_performance
        elif record["score"] > 80:
            template = NOTIFICATION_TEMPLATES[1]  # improvement
        else:
            template = NOTIFICATION_TEMPLATES[2]  # engagement

        notification = {
            "id": f"mock_notif_{student_id}_{i}",
            "student_id": student_id,
            "type": template["type"],
            "title": template["title"],
            "message": template["message"].format(category=record.get("subcategory", record["category"])),
            "priority": "high" if record["calculated_level"] == PerformanceLevel.LOW else "medium",
            "read": random.choice([True, False, False]),  # 1/3 chance of being unread
            "created_at": record["created_at"] + timedelta(hours=random.randint(1, 24)),
            "metadata": {
                "category": record["category"],
                "score": record["score"],
                "record_id": record["id"]
            }
        }
        notifications.append(notification)

    # Sort by date descending
    notifications.sort(key=lambda x: x["created_at"], reverse=True)
    return notifications

def generate_mock_ai_prediction(student_id: str, performance_records: List[Dict]) -> Dict[str, Any]:
    """Generate mock AI prediction for a student"""
    random.seed(get_student_seed(student_id) + 2)

    if not performance_records:
        return {
            "student_id": student_id,
            "predicted_score": 75,
            "confidence": 60,
            "trend": "stable",
            "suggestions": ["Complete more assessments to get accurate predictions"],
            "generated_at": datetime.utcnow()
        }

    # Calculate average performance
    scores = [r["score"] for r in performance_records]
    avg_score = sum(scores) / len(scores)

    # Generate prediction based on current performance
    trend_variation = random.randint(-10, 10)
    predicted_score = max(40, min(100, avg_score + trend_variation))

    # Determine trend
    if trend_variation > 5:
        trend = "improving"
    elif trend_variation < -5:
        trend = "declining"
    else:
        trend = "stable"

    # Confidence based on data amount
    confidence = min(95, 60 + len(performance_records) * 2)

    # Generate relevant suggestions
    suggestions = random.sample(AI_SUGGESTIONS_POOL, min(3, len(AI_SUGGESTIONS_POOL)))

    return {
        "student_id": student_id,
        "predicted_score": round(predicted_score, 1),
        "confidence": confidence,
        "trend": trend,
        "suggestions": suggestions,
        "generated_at": datetime.utcnow()
    }

def generate_mock_ai_suggestions(student_id: str, performance_records: List[Dict]) -> Dict[str, Any]:
    """Generate mock AI improvement suggestions"""
    random.seed(get_student_seed(student_id) + 3)

    if not performance_records:
        return {
            "student_id": student_id,
            "suggestions": ["Start tracking your performance to receive personalized suggestions"],
            "priority_areas": [],
            "generated_at": datetime.utcnow()
        }

    # Analyze weak areas
    weak_areas = []
    category_scores = {}

    for record in performance_records:
        category = record.get("subcategory", record["category"])
        if category not in category_scores:
            category_scores[category] = []
        category_scores[category].append(record["score"])

    # Find categories with average below 75
    for category, scores in category_scores.items():
        avg_score = sum(scores) / len(scores)
        if avg_score < 75:
            weak_areas.append(category)

    # Generate 4-6 personalized suggestions
    num_suggestions = random.randint(4, 6)
    suggestions = random.sample(AI_SUGGESTIONS_POOL, min(num_suggestions, len(AI_SUGGESTIONS_POOL)))

    return {
        "student_id": student_id,
        "suggestions": suggestions,
        "priority_areas": weak_areas[:3],  # Top 3 weak areas
        "generated_at": datetime.utcnow()
    }

def generate_mock_analytics(student_id: str, performance_records: List[Dict]) -> Dict[str, Any]:
    """Generate mock analytics data"""
    if not performance_records:
        return {
            "student_id": student_id,
            "overall_average": 0,
            "academic_average": 0,
            "non_academic_average": 0,
            "performance_level": PerformanceLevel.LOW,
            "total_records": 0,
            "academic_records": 0,
            "non_academic_records": 0,
            "category_averages": {},
            "semester_averages": {},
            "trend": "insufficient_data",
            "last_updated": datetime.utcnow()
        }

    # Calculate averages
    academic_records = [r for r in performance_records if r["type"] == "academic"]
    non_academic_records = [r for r in performance_records if r["type"] == "non_academic"]

    academic_scores = [r["score"] for r in academic_records] if academic_records else []
    non_academic_scores = [r["score"] for r in non_academic_records] if non_academic_records else []
    all_scores = [r["score"] for r in performance_records]

    academic_avg = sum(academic_scores) / len(academic_scores) if academic_scores else 0
    non_academic_avg = sum(non_academic_scores) / len(non_academic_scores) if non_academic_scores else 0
    overall_avg = sum(all_scores) / len(all_scores)

    # Determine level
    if overall_avg >= 85:
        level = PerformanceLevel.EXCELLENT
    elif overall_avg >= 70:
        level = PerformanceLevel.AVERAGE
    else:
        level = PerformanceLevel.LOW

    # Simple trend calculation
    recent_scores = all_scores[:5]  # Last 5 records
    if len(recent_scores) >= 2:
        trend = "improving" if recent_scores[0] > recent_scores[-1] + 5 else "stable"
    else:
        trend = "stable"

    # Calculate category averages
    category_scores = {}
    semester_scores = {}

    for record in performance_records:
        # Category averages
        category = record.get("subcategory", record["category"])
        if category not in category_scores:
            category_scores[category] = []
        category_scores[category].append(record["score"])

        # Semester averages
        semester = record.get("semester", "Unknown")
        if semester not in semester_scores:
            semester_scores[semester] = []
        semester_scores[semester].append(record["score"])

    category_averages = {k: round(sum(v)/len(v), 1) for k, v in category_scores.items()}
    semester_averages = {k: round(sum(v)/len(v), 1) for k, v in semester_scores.items()}

    return {
        "student_id": student_id,
        "overall_average": round(overall_avg, 1),
        "academic_average": round(academic_avg, 1),
        "non_academic_average": round(non_academic_avg, 1),
        "performance_level": level,
        "total_records": len(performance_records),
        "academic_records": len(academic_records),
        "non_academic_records": len(non_academic_records),
        "category_averages": category_averages,
        "semester_averages": semester_averages,
        "trend": trend,
        "last_updated": datetime.utcnow()
    }

# Convenience functions for API routes
def get_mock_performance_data(student_id: str):
    """Get all mock performance data for a student"""
    records = generate_mock_performance_records(student_id)
    notifications = generate_mock_notifications(student_id, records)
    ai_prediction = generate_mock_ai_prediction(student_id, records)
    ai_suggestions = generate_mock_ai_suggestions(student_id, records)
    analytics = generate_mock_analytics(student_id, records)

    return {
        "records": records,
        "notifications": notifications,
        "ai_prediction": ai_prediction,
        "ai_suggestions": ai_suggestions,
        "analytics": analytics
    }