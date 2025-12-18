# backend/tests/test_performance.py
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from bson import ObjectId
import json

from main import app
from config.db import db
from models.performance_model import PerformanceRecordIn, PerformanceLevel
from utils.performance_utils import calculate_performance_level, get_performance_thresholds

client = TestClient(app)

# Test data
test_student_id = "507f1f77bcf86cd799439011"
test_admin_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjQ3ZjFmNzdiY2Y4NmNkNzk5NDM5MDExIiwicm9sZSI6ImFkbWluIn0.test"
test_student_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjc3ZjFmNzdiY2Y4NmNkNzk5NDM5MDExIiwicm9sZSI6InN0dWRlbnQifQ.test"

class TestPerformanceModels:
    """Test performance model validation"""

    def test_performance_record_in_valid(self):
        record = PerformanceRecordIn(
            student_id=test_student_id,
            type="academic",
            category="subject",
            subcategory="Mathematics",
            score=85.5,
            semester="Fall 2024"
        )
        assert record.student_id == test_student_id
        assert record.score == 85.5

    def test_performance_record_score_validation(self):
        # Test score within range
        record = PerformanceRecordIn(
            student_id=test_student_id,
            type="academic",
            category="exam",
            score=95
        )
        assert record.score == 95

        # Test score below minimum
        with pytest.raises(ValueError):
            PerformanceRecordIn(
                student_id=test_student_id,
                type="academic",
                category="exam",
                score=-5
            )

        # Test score above maximum
        with pytest.raises(ValueError):
            PerformanceRecordIn(
                student_id=test_student_id,
                type="academic",
                category="exam",
                score=150
            )

class TestPerformanceUtils:
    """Test performance utility functions"""

    @pytest.mark.asyncio
    async def test_calculate_performance_level(self):
        thresholds = await get_performance_thresholds()

        # Test excellent level
        level = calculate_performance_level(90, thresholds)
        assert level == PerformanceLevel.EXCELLENT

        # Test average level
        level = calculate_performance_level(70, thresholds)
        assert level == PerformanceLevel.AVERAGE

        # Test low level
        level = calculate_performance_level(30, thresholds)
        assert level == PerformanceLevel.LOW

    @pytest.mark.asyncio
    async def test_get_performance_thresholds(self):
        thresholds = await get_performance_thresholds()
        assert hasattr(thresholds, 'low_score_threshold')
        assert hasattr(thresholds, 'excellent_threshold')
        assert hasattr(thresholds, 'average_threshold')
        assert 0 <= thresholds.low_score_threshold <= 100
        assert 0 <= thresholds.excellent_threshold <= 100
        assert 0 <= thresholds.average_threshold <= 100

class TestPerformanceAPI:
    """Test performance API endpoints"""

    def test_add_performance_record_unauthorized(self):
        """Test adding performance record without authentication"""
        record_data = {
            "student_id": test_student_id,
            "type": "academic",
            "category": "subject",
            "subcategory": "Mathematics",
            "score": 85
        }

        response = client.post("/api/performance/add", json=record_data)
        assert response.status_code == 401

    def test_get_student_performance_unauthorized(self):
        """Test getting student performance without authentication"""
        response = client.get(f"/api/performance/student/{test_student_id}")
        assert response.status_code == 401

    def test_get_analytics_unauthorized(self):
        """Test getting analytics without authentication"""
        response = client.get("/api/performance/analytics")
        assert response.status_code == 401

    def test_get_notifications_unauthorized(self):
        """Test getting notifications without authentication"""
        response = client.get("/api/performance/notifications")
        assert response.status_code == 401

    def test_invalid_performance_record_data(self):
        """Test adding performance record with invalid data"""
        headers = {"Authorization": f"Bearer {test_admin_token}"}

        # Invalid score
        invalid_record = {
            "student_id": test_student_id,
            "type": "academic",
            "category": "subject",
            "score": 150  # Invalid score > 100
        }

        response = client.post("/api/performance/add", json=invalid_record, headers=headers)
        assert response.status_code == 422  # Validation error

    def test_performance_record_with_admin_token(self):
        """Test adding performance record with admin token"""
        headers = {"Authorization": f"Bearer {test_admin_token}"}

        record_data = {
            "student_id": test_student_id,
            "type": "academic",
            "category": "subject",
            "subcategory": "Mathematics",
            "score": 85,
            "semester": "Fall 2024"
        }

        response = client.post("/api/performance/add", json=record_data, headers=headers)
        assert response.status_code in [200, 201]  # Success

        if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert data["score"] == 85
            assert data["calculated_level"] in ["excellent", "average", "low"]

    def test_get_student_performance_with_student_token(self):
        """Test student accessing their own performance"""
        headers = {"Authorization": f"Bearer {test_student_token}"}

        response = client.get(f"/api/performance/student/{test_student_id}", headers=headers)
        assert response.status_code in [200, 404]  # Success or no data

        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)

    def test_get_analytics_with_admin_token(self):
        """Test admin accessing performance analytics"""
        headers = {"Authorization": f"Bearer {test_admin_token}"}

        response = client.get("/api/performance/analytics", headers=headers)
        assert response.status_code in [200, 404]  # Success or no data

        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)

    def test_get_notifications_with_student_token(self):
        """Test student accessing their notifications"""
        headers = {"Authorization": f"Bearer {test_student_token}"}

        response = client.get("/api/performance/notifications", headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)

    def test_ai_prediction_endpoint(self):
        """Test AI prediction endpoint"""
        headers = {"Authorization": f"Bearer {test_student_token}"}

        response = client.get(f"/api/performance/ai/prediction/{test_student_id}", headers=headers)
        assert response.status_code in [200, 404]  # Success or no prediction available

        if response.status_code == 200:
            data = response.json()
            assert "predicted_score" in data
            assert "confidence" in data
            assert "trend" in data

    def test_ai_suggestions_endpoint(self):
        """Test AI suggestions endpoint"""
        headers = {"Authorization": f"Bearer {test_student_token}"}

        response = client.get(f"/api/performance/ai/suggestions/{test_student_id}", headers=headers)
        assert response.status_code in [200, 404]  # Success or no suggestions available

        if response.status_code == 200:
            data = response.json()
            assert "suggestions" in data
            assert "priority_areas" in data

class TestAccessControl:
    """Test role-based access control"""

    def test_student_cannot_access_other_student_data(self):
        """Test that students cannot access other students' data"""
        headers = {"Authorization": f"Bearer {test_student_token}"}
        other_student_id = "507f1f77bcf86cd799439012"

        response = client.get(f"/api/performance/student/{other_student_id}", headers=headers)
        assert response.status_code == 403  # Forbidden

    def test_student_cannot_access_analytics(self):
        """Test that students cannot access analytics endpoint"""
        headers = {"Authorization": f"Bearer {test_student_token}"}

        response = client.get("/api/performance/analytics", headers=headers)
        assert response.status_code == 403  # Forbidden

    def test_admin_can_add_any_student_record(self):
        """Test that admin can add records for any student"""
        headers = {"Authorization": f"Bearer {test_admin_token}"}
        other_student_id = "507f1f77bcf86cd799439012"

        record_data = {
            "student_id": other_student_id,
            "type": "academic",
            "category": "exam",
            "score": 78,
            "semester": "Spring 2024"
        }

        response = client.post("/api/performance/add", json=record_data, headers=headers)
        assert response.status_code in [200, 201]  # Success

class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_empty_performance_data(self):
        """Test handling of empty performance data"""
        headers = {"Authorization": f"Bearer {test_student_token}"}

        response = client.get(f"/api/performance/student/{test_student_id}", headers=headers)
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)

    def test_invalid_student_id(self):
        """Test with invalid student ID"""
        headers = {"Authorization": f"Bearer {test_admin_token}"}
        invalid_id = "invalid_id"

        response = client.get(f"/api/performance/student/{invalid_id}", headers=headers)
        assert response.status_code == 200  # Should return empty list, not error

    def test_score_boundary_values(self):
        """Test score boundary values"""
        headers = {"Authorization": f"Bearer {test_admin_token}"}

        # Test minimum valid score
        record_data = {
            "student_id": test_student_id,
            "type": "academic",
            "category": "test",
            "score": 0
        }
        response = client.post("/api/performance/add", json=record_data, headers=headers)
        assert response.status_code in [200, 201]

        # Test maximum valid score
        record_data["score"] = 100
        response = client.post("/api/performance/add", json=record_data, headers=headers)
        assert response.status_code in [200, 201]

if __name__ == "__main__":
    pytest.main([__file__])