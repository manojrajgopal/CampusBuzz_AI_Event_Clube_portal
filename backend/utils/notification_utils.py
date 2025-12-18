# backend/utils/notification_utils.py
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from config.db import db
from models.performance_model import NotificationType, NotificationIn, NotificationOut
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

logger = logging.getLogger(__name__)

NOTIFICATIONS_COLLECTION = "notifications"

class NotificationService:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)

    async def create_notification(
        self,
        student_id: str,
        type: NotificationType,
        title: str,
        message: str,
        priority: str = "medium",
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a new notification."""
        notification = {
            "student_id": student_id,
            "type": type,
            "title": title,
            "message": message,
            "priority": priority,
            "metadata": metadata or {},
            "read": False,
            "created_at": datetime.utcnow()
        }

        result = await db[NOTIFICATIONS_COLLECTION].insert_one(notification)
        notification_id = str(result.inserted_id)

        # Send email if configured and high priority
        if priority == "high" and self._email_enabled():
            await self._send_email_notification(notification)

        logger.info(f"Created notification {notification_id} for student {student_id}")
        return notification_id

    async def get_student_notifications(
        self,
        student_id: str,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[NotificationOut]:
        """Get notifications for a student."""
        query = {"student_id": student_id}
        if unread_only:
            query["read"] = False

        cursor = db[NOTIFICATIONS_COLLECTION].find(query).sort("created_at", -1).limit(limit)
        notifications = []

        async for notif in cursor:
            notif["id"] = str(notif["_id"])
            notif.pop("_id")
            notifications.append(NotificationOut(**notif))

        return notifications

    async def mark_as_read(self, notification_id: str, student_id: str) -> bool:
        """Mark a notification as read."""
        result = await db[NOTIFICATIONS_COLLECTION].update_one(
            {"_id": ObjectId(notification_id), "student_id": student_id},
            {"$set": {"read": True}}
        )
        return result.modified_count > 0

    async def mark_all_as_read(self, student_id: str) -> int:
        """Mark all notifications as read for a student."""
        result = await db[NOTIFICATIONS_COLLECTION].update_many(
            {"student_id": student_id, "read": False},
            {"$set": {"read": True}}
        )
        return result.modified_count

    async def delete_old_notifications(self, days: int = 90):
        """Delete notifications older than specified days."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        result = await db[NOTIFICATIONS_COLLECTION].delete_many({
            "created_at": {"$lt": cutoff_date},
            "read": True
        })
        logger.info(f"Deleted {result.deleted_count} old notifications")
        return result.deleted_count

    def _email_enabled(self) -> bool:
        """Check if email notifications are enabled."""
        return bool(os.getenv("SMTP_SERVER") and os.getenv("SMTP_PORT"))

    async def _send_email_notification(self, notification: Dict[str, Any]):
        """Send email notification asynchronously."""
        try:
            # Get student email
            student = await db["users"].find_one({"_id": ObjectId(notification["student_id"])})
            if not student or not student.get("email"):
                logger.warning(f"No email found for student {notification['student_id']}")
                return

            # Run email sending in thread pool
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                self.executor,
                self._send_email_sync,
                student["email"],
                notification["title"],
                notification["message"]
            )

        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")

    def _send_email_sync(self, to_email: str, subject: str, message: str):
        """Send email synchronously."""
        try:
            smtp_server = os.getenv("SMTP_SERVER")
            smtp_port = int(os.getenv("SMTP_PORT", 587))
            smtp_username = os.getenv("SMTP_USERNAME")
            smtp_password = os.getenv("SMTP_PASSWORD")
            from_email = os.getenv("FROM_EMAIL", smtp_username)

            msg = MIMEMultipart()
            msg['From'] = from_email
            msg['To'] = to_email
            msg['Subject'] = f"CampusBuzz - {subject}"

            body = f"""
            Dear Student,

            {message}

            Please log in to your CampusBuzz dashboard to view more details.

            Best regards,
            CampusBuzz Team
            """

            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(smtp_username, smtp_password)
            text = msg.as_string()
            server.sendmail(from_email, to_email, text)
            server.quit()

            logger.info(f"Email sent to {to_email}")

        except Exception as e:
            logger.error(f"Failed to send email: {e}")

# Global notification service instance
notification_service = NotificationService()

# Convenience functions
async def create_performance_notification(
    student_id: str,
    notification_type: str,
    score: float,
    category: str
):
    """Create a performance-related notification."""
    if notification_type == "low_performance":
        title = "Low Performance Alert"
        message = f"Your performance in {category} is low ({score}%). Please review and improve."
        priority = "high"
    elif notification_type == "improvement":
        title = "Performance Improvement"
        message = f"Great job! Your performance in {category} has improved to {score}%."
        priority = "medium"
    else:
        return

    await notification_service.create_notification(
        student_id=student_id,
        type=NotificationType(notification_type),
        title=title,
        message=message,
        priority=priority,
        metadata={"category": category, "score": score}
    )

async def check_and_notify_low_performance():
    """Scheduled task to check for low performance and send notifications."""
    from utils.performance_utils import detect_low_performance

    # Get all students
    students_cursor = db["users"].find({"role": "student"})
    student_ids = []

    async for student in students_cursor:
        student_ids.append(str(student["_id"]))

    for student_id in student_ids:
        try:
            alerts = await detect_low_performance(student_id)
            for alert in alerts:
                if alert["type"] == "low_score":
                    await create_performance_notification(
                        student_id=student_id,
                        notification_type="low_performance",
                        score=0,  # Will be updated with actual score
                        category="multiple subjects"
                    )
                elif alert["type"] == "inactivity":
                    await notification_service.create_notification(
                        student_id=student_id,
                        type=NotificationType.LOW_PERFORMANCE,
                        title="Engagement Alert",
                        message=alert["message"],
                        priority="high"
                    )
                elif alert["type"] == "overall_low_performance":
                    await notification_service.create_notification(
                        student_id=student_id,
                        type=NotificationType.LOW_PERFORMANCE,
                        title="Overall Performance Alert",
                        message=alert["message"],
                        priority="high"
                    )
        except Exception as e:
            logger.error(f"Error checking notifications for student {student_id}: {e}")

async def cleanup_old_notifications():
    """Scheduled task to clean up old notifications."""
    await notification_service.delete_old_notifications(days=90)