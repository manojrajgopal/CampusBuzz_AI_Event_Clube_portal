# backend/utils/id_util.py
from bson import ObjectId

def normalize_id(id_value):
    """
    Ensures MongoDB _id is correctly handled whether stored as ObjectId or string.
    - If id_value is a valid ObjectId -> return ObjectId(id_value)
    - Else -> return plain string
    """
    try:
        return ObjectId(id_value)
    except Exception:
        return str(id_value)
