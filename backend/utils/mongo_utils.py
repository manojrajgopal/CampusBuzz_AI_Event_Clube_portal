# backend/utils/mongo_utils.py
from bson import ObjectId

def sanitize_doc(doc):
    """
    Recursively converts ObjectId to str in a dict/list.
    """
    if isinstance(doc, list):
        return [sanitize_doc(item) for item in doc]
    elif isinstance(doc, dict):
        new_doc = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                new_doc[k] = str(v)
            else:
                new_doc[k] = sanitize_doc(v)
        return new_doc
    else:
        return doc
