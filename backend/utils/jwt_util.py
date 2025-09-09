# backend/utils/jwt_util.py
import os
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "supersecret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_IN = os.getenv("JWT_EXPIRES_IN", "7d")


def parse_expiry(exp: str):
    if exp.endswith("d"):
        return timedelta(days=int(exp[:-1]))
    elif exp.endswith("h"):
        return timedelta(hours=int(exp[:-1]))
    else:
        return timedelta(days=7)


def create_access_token(data: dict):
    """
    data should already contain:
      {
        "user_id": str(user["_id"]),
        "role": user["role"]
      }
    """
    expire = datetime.utcnow() + parse_expiry(JWT_EXPIRES_IN)
    payload = {**data, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload  # includes user_id and role
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
