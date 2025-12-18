# backend/utils/ai_utils.py
import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from config.db import db
from models.performance_model import AIPrediction, AIImprovementSuggestion
import openai
import google.generativeai as genai
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import numpy as np

logger = logging.getLogger(__name__)

AI_PREDICTIONS_COLLECTION = "ai_predictions"
AI_SUGGESTIONS_COLLECTION = "ai_suggestions"

class AIService:
    def __init__(self):
        # Initialize OpenAI
        openai.api_key = os.getenv("OPENAI_API_KEY")

        # Initialize Google AI
        google_api_key = os.getenv("GOOGLE_AI_API_KEY")
        if google_api_key:
            genai.configure(api_key=google_api_key)
            self.google_model = genai.GenerativeModel('gemini-pro')
        else:
            self.google_model = None

    async def predict_performance_trend(self, student_id: str) -> AIPrediction:
        """Predict future performance trend using historical data."""
        try:
            # Get historical performance data
            records_cursor = db["performance_records"].find({"student_id": student_id}).sort("created_at", 1)
            records = []
            async for record in records_cursor:
                records.append(record)

            if len(records) < 3:
                return AIPrediction(
                    student_id=student_id,
                    predicted_score=0,
                    confidence=0,
                    trend="insufficient_data",
                    suggestions=[],
                    generated_at=datetime.utcnow()
                )

            # Prepare data for ML prediction
            dates = [(r["created_at"] - records[0]["created_at"]).days for r in records]
            scores = [r["score"] for r in records]

            # Simple linear regression for trend prediction
            X = np.array(dates).reshape(-1, 1)
            y = np.array(scores)

            model = LinearRegression()
            model.fit(X, y)

            # Predict next score (30 days from last record)
            next_date = dates[-1] + 30
            predicted_score = model.predict([[next_date]])[0]

            # Calculate confidence based on R-squared
            r_squared = model.score(X, y)
            confidence = min(r_squared * 100, 95)  # Cap at 95%

            # Determine trend
            slope = model.coef_[0]
            if slope > 0.5:
                trend = "improving"
            elif slope < -0.5:
                trend = "declining"
            else:
                trend = "stable"

            # Generate AI-powered suggestions
            suggestions = await self._generate_improvement_suggestions(records, trend, predicted_score)

            prediction = AIPrediction(
                student_id=student_id,
                predicted_score=round(max(0, min(100, predicted_score)), 1),
                confidence=round(confidence, 1),
                trend=trend,
                suggestions=suggestions,
                generated_at=datetime.utcnow()
            )

            # Save to database
            await db[AI_PREDICTIONS_COLLECTION].insert_one(prediction.dict())

            return prediction

        except Exception as e:
            logger.error(f"Error predicting performance for student {student_id}: {e}")
            return AIPrediction(
                student_id=student_id,
                predicted_score=0,
                confidence=0,
                trend="error",
                suggestions=["Unable to generate prediction due to insufficient data"],
                generated_at=datetime.utcnow()
            )

    async def generate_improvement_suggestions(self, student_id: str) -> AIImprovementSuggestion:
        """Generate AI-powered improvement suggestions."""
        try:
            # Get recent performance data and analytics
            analytics = await db["performance_analytics"].find_one({"student_id": student_id})
            records_cursor = db["performance_records"].find({"student_id": student_id}).sort("created_at", -1).limit(10)
            recent_records = []
            async for record in records_cursor:
                recent_records.append(record)

            if not recent_records:
                return AIImprovementSuggestion(
                    student_id=student_id,
                    suggestions=["Complete more performance assessments to receive personalized suggestions"],
                    priority_areas=[],
                    generated_at=datetime.utcnow()
                )

            # Analyze weak areas
            weak_areas = []
            suggestions = []

            if analytics:
                # Identify categories with low performance
                for category, avg in analytics.get("category_averages", {}).items():
                    if avg < 60:  # Below average threshold
                        weak_areas.append(category)

            # Generate suggestions using AI
            ai_suggestions = await self._generate_ai_suggestions(recent_records, weak_areas, analytics)

            suggestions.extend(ai_suggestions)

            # Add general suggestions based on data
            if analytics and analytics.get("trend") == "declining":
                suggestions.append("Focus on consistent study habits and seek help when needed")
            elif analytics and analytics.get("trend") == "stable":
                suggestions.append("Try new learning methods to break through performance plateaus")

            improvement_suggestion = AIImprovementSuggestion(
                student_id=student_id,
                suggestions=list(set(suggestions)),  # Remove duplicates
                priority_areas=weak_areas,
                generated_at=datetime.utcnow()
            )

            # Save to database
            await db[AI_SUGGESTIONS_COLLECTION].insert_one(improvement_suggestion.dict())

            return improvement_suggestion

        except Exception as e:
            logger.error(f"Error generating suggestions for student {student_id}: {e}")
            return AIImprovementSuggestion(
                student_id=student_id,
                suggestions=["Unable to generate suggestions at this time"],
                priority_areas=[],
                generated_at=datetime.utcnow()
            )

    async def _generate_ai_suggestions(self, records: List[Dict], weak_areas: List[str], analytics: Optional[Dict]) -> List[str]:
        """Generate suggestions using AI models."""
        try:
            # Prepare context for AI
            context = {
                "weak_areas": weak_areas,
                "overall_average": analytics.get("overall_average", 0) if analytics else 0,
                "trend": analytics.get("trend", "unknown") if analytics else "unknown",
                "recent_scores": [r["score"] for r in records[-5:]],  # Last 5 records
                "categories": list(set(r.get("category", "general") for r in records))
            }

            prompt = f"""
            Based on this student's performance data, generate 3-5 specific, actionable improvement suggestions:

            Context:
            - Weak areas: {', '.join(weak_areas) if weak_areas else 'None identified'}
            - Overall average: {context['overall_average']}%
            - Performance trend: {context['trend']}
            - Recent scores: {context['recent_scores']}
            - Active categories: {', '.join(context['categories'])}

            Provide suggestions that are:
            1. Specific and actionable
            2. Realistic and achievable
            3. Focused on the identified weak areas
            4. Encouraging and positive

            Return only the suggestions as a JSON array of strings.
            """

            if self.google_model:
                # Use Google AI
                response = self.google_model.generate_content(prompt)
                suggestions_text = response.text.strip()
            elif openai.api_key:
                # Use OpenAI
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=300,
                    temperature=0.7
                )
                suggestions_text = response.choices[0].message.content.strip()
            else:
                return ["Consider regular study sessions", "Seek feedback from instructors", "Practice consistently"]

            # Parse JSON response
            try:
                suggestions = json.loads(suggestions_text)
                return suggestions if isinstance(suggestions, list) else [suggestions_text]
            except json.JSONDecodeError:
                # Fallback: split by newlines
                return [line.strip() for line in suggestions_text.split('\n') if line.strip()]

        except Exception as e:
            logger.error(f"Error generating AI suggestions: {e}")
            return ["Focus on consistent practice", "Review weak subjects regularly", "Seek additional help when needed"]

    async def _generate_improvement_suggestions(self, records: List[Dict], trend: str, predicted_score: float) -> List[str]:
        """Generate suggestions based on trend and prediction."""
        suggestions = []

        if trend == "declining":
            suggestions.extend([
                "Increase study time and focus on weak subjects",
                "Consider tutoring or additional help",
                "Review and practice regularly"
            ])
        elif trend == "stable":
            suggestions.extend([
                "Try new learning techniques to improve performance",
                "Set specific goals for improvement",
                "Focus on understanding concepts deeply"
            ])
        elif trend == "improving":
            suggestions.extend([
                "Maintain current study habits",
                "Continue building on strengths",
                "Challenge yourself with advanced topics"
            ])

        # Add prediction-based suggestions
        if predicted_score < 60:
            suggestions.append("Based on current trend, focus on immediate improvement to avoid falling below passing grade")
        elif predicted_score > 85:
            suggestions.append("Keep up the excellent work - you're on track for high achievement")

        return suggestions[:5]  # Limit to 5 suggestions

# Global AI service instance
ai_service = AIService()

# Convenience functions
async def get_or_create_prediction(student_id: str) -> AIPrediction:
    """Get existing prediction or create new one."""
    # Check for recent prediction (within 7 days)
    recent_prediction = await db[AI_PREDICTIONS_COLLECTION].find_one(
        {"student_id": student_id, "generated_at": {"$gte": datetime.utcnow() - timedelta(days=7)}}
    )

    if recent_prediction:
        recent_prediction["id"] = str(recent_prediction["_id"])
        recent_prediction.pop("_id")
        return AIPrediction(**recent_prediction)

    # Generate new prediction
    return await ai_service.predict_performance_trend(student_id)

async def get_or_create_suggestions(student_id: str) -> AIImprovementSuggestion:
    """Get existing suggestions or create new ones."""
    # Check for recent suggestions (within 7 days)
    recent_suggestions = await db[AI_SUGGESTIONS_COLLECTION].find_one(
        {"student_id": student_id, "generated_at": {"$gte": datetime.utcnow() - timedelta(days=7)}}
    )

    if recent_suggestions:
        recent_suggestions["id"] = str(recent_suggestions["_id"])
        recent_suggestions.pop("_id")
        return AIImprovementSuggestion(**recent_suggestions)

    # Generate new suggestions
    return await ai_service.generate_improvement_suggestions(student_id)