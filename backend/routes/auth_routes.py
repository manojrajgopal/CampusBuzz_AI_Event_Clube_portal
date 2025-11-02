# backend/routes/auth_routes.py
from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext
from datetime import datetime
import base64
import cv2
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import io
from PIL import Image

from config.db import db
from bson import ObjectId
from utils.jwt_util import create_access_token
from models.user_model import UserLogin, StudentSignupRequest
from fastapi import Body, Depends
from utils.id_util import normalize_id
from middleware.auth_middleware import require_role, get_current_user
from datetime import timedelta
import os
import traceback

# Encryption for embeddings/images at rest
from cryptography.fernet import Fernet, InvalidToken

# Optional high-quality model imports (lazy)
_FACENET_AVAILABLE = False
try:
    from facenet_pytorch import InceptionResnetV1
    import torch
    _FACENET_AVAILABLE = True
except Exception:
    _FACENET_AVAILABLE = False

# Optional mediapipe for segmentation/liveness
_MP_AVAILABLE = False
try:
    import mediapipe as mp
    _MP_AVAILABLE = True
except Exception:
    _MP_AVAILABLE = False

# Initialize encryption key from env; expect a URL-safe base64 32-byte key for Fernet
FACE_KEY = os.getenv("FACE_ENCRYPTION_KEY")
if not FACE_KEY:
    # generate a key for development if not provided (recommend providing in prod)
    FACE_KEY = Fernet.generate_key().decode()
FERNET = Fernet(FACE_KEY.encode())

# Face recognition model (lazy loaded)
_face_model = None
def get_face_model():
    global _face_model
    if _face_model is None:
        if not _FACENET_AVAILABLE:
            raise RuntimeError("facenet-pytorch not available. Install facenet-pytorch and torch.")
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        _face_model = InceptionResnetV1(pretrained='vggface2').eval().to(device)
    return _face_model

def encrypt_bytes(b: bytes) -> bytes:
    return FERNET.encrypt(b)

def decrypt_bytes(b: bytes) -> bytes:
    try:
        return FERNET.decrypt(b)
    except InvalidToken:
        raise HTTPException(status_code=500, detail="Failed to decrypt stored face data")

def image_from_base64(b64: str):
    # strip data url
    if ',' in b64:
        b64 = b64.split(',', 1)[1]
    return Image.open(io.BytesIO(base64.b64decode(b64)))

def pil_to_np(img: Image.Image):
    if img.mode != 'RGB':
        img = img.convert('RGB')
    return np.array(img)

async def remove_background_np(np_img: np.ndarray) -> np.ndarray:
    """Try to remove background using MediaPipe Selfie Segmentation if available.
    If not available, assume the provided image already has background removed.
    Returns RGBA image with transparent background where removed.
    """
    if not _MP_AVAILABLE:
        # no-op: return original as RGB
        return np_img
    try:
        mp_selfie = mp.solutions.selfie_segmentation
        with mp_selfie.SelfieSegmentation(model_selection=1) as seg:
            rgb = cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)
            results = seg.process(cv2.cvtColor(rgb, cv2.COLOR_BGR2RGB))
            mask = results.segmentation_mask
            if mask is None:
                return np_img
            mask3 = (mask > 0.5).astype('uint8')
            # apply mask: keep foreground
            fg = np_img * mask3[:, :, None]
            return fg
    except Exception:
        return np_img

def get_embedding_from_np(np_img: np.ndarray):
    """Return a float32 list embedding using facenet-pytorch. Raises if model missing."""
    if not _FACENET_AVAILABLE:
        raise RuntimeError("Face embedding model not available. Install facenet-pytorch and torch.")
    try:
        model = get_face_model()
        import torchvision.transforms as transforms
        from PIL import Image as PILImage

        pil = PILImage.fromarray(np_img.astype('uint8'), 'RGB')
        # facenet-pytorch expects cropped face; we'll center-crop for now
        transform = transforms.Compose([
            transforms.Resize((160, 160)),
            transforms.ToTensor(),
            transforms.Normalize([0.5], [0.5])
        ])
        tensor = transform(pil).unsqueeze(0)
        device = next(model.parameters()).device
        tensor = tensor.to(device)
        with torch.no_grad():
            emb = model(tensor).cpu().numpy()[0]
        return emb.astype('float32').tolist()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

def cosine_similarity_list(a, b):
    a = np.array(a, dtype=np.float32)
    b = np.array(b, dtype=np.float32)
    if a.shape != b.shape:
        return 0.0
    num = float(np.dot(a, b))
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    return num / denom if denom != 0 else 0.0

async def liveness_check(images_np: list) -> bool:
    """Basic liveness: expect two frames and detect eye aspect ratio change (blink) using mediapipe landmarks if available.
    Returns True if liveness passes, False otherwise."""
    if not _MP_AVAILABLE:
        # If mediapipe not present, fallback to True (less secure). Recommend installing mediapipe.
        return True
    try:
        mp_face_mesh = mp.solutions.face_mesh
        with mp_face_mesh.FaceMesh(static_image_mode=True) as fm:
            # compute eye openness for both images
            openness = []
            for img in images_np:
                rgb = cv2.cvtColor(img.astype('uint8'), cv2.COLOR_RGB2BGR)
                res = fm.process(cv2.cvtColor(rgb, cv2.COLOR_BGR2RGB))
                if not res.multi_face_landmarks:
                    openness.append(0.0)
                    continue
                lm = res.multi_face_landmarks[0].landmark
                # use vertical distance between eyelid landmarks (approx)
                # left eye indices (33, 159), right eye (362, 386) approximate
                def eye_open(idx_top, idx_bottom):
                    top = lm[idx_top]
                    bottom = lm[idx_bottom]
                    return abs(top.y - bottom.y)
                left = eye_open(159, 145) if len(lm) > 160 else 0.0
                right = eye_open(386, 374) if len(lm) > 387 else 0.0
                openness.append((left + right) / 2)
            # require a drop in openness between frames indicating a blink
            if len(openness) >= 2 and openness[0] > 0 and openness[1] < (openness[0] * 0.6):
                return True
            return False
    except Exception:
        return False

def store_face_record(email: str, embedding: list, thumbnail_bytes: bytes, metadata: dict):
    # encrypt embedding and thumbnail
    emb_bytes = np.array(embedding, dtype=np.float32).tobytes()
    doc = {
        "email": email,
        "embedding_enc": encrypt_bytes(emb_bytes),
        "thumbnail_enc": encrypt_bytes(thumbnail_bytes),
        "metadata": metadata,
        "created_at": datetime.utcnow(),
        "failed_attempts": 0,
        "locked_until": None
    }
    return db.face_auth.replace_one({"email": email}, doc, upsert=True)

def load_face_record(email: str):
    rec = db.face_auth.find_one({"email": email})
    return rec

def log_audit(email: str, success: bool, reason: str, code: str = ""):
    db.face_auth_audit.insert_one({
        "email": email,
        "success": bool(success),
        "reason": reason,
        "code": code,
        "timestamp": datetime.utcnow()
    })

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize face detector (will be loaded on first use)
face_cascade = None

def get_face_cascade():
    """Lazy load face cascade to avoid issues during import"""
    global face_cascade
    if face_cascade is None:
        try:
            # Try to load the cascade file
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cascade_path)
            
            # Verify it loaded correctly
            if face_cascade.empty():
                raise Exception("Failed to load face cascade")
                
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to initialize face detector: {str(e)}"
            )
    return face_cascade

def base64_to_image(base64_string):
    """Convert base64 string to numpy array"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 string
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        return np.array(image)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image data: {str(e)}"
        )

def extract_face_features_simple(image_array):
    """
    Extract basic face features using OpenCV Haar Cascades
    This creates a simple fingerprint of the face for comparison
    """
    try:
        cascade = get_face_cascade()
        
        # Convert to grayscale
        if len(image_array.shape) == 3:
            gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = image_array
        
        # Detect faces
        faces = cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )
        
        if len(faces) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No face detected in the image. Please ensure your face is clearly visible."
            )
        
        # Use the largest face detected
        largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
        x, y, w, h = largest_face
        
        # Extract face region
        face_roi = gray[y:y+h, x:x+w]
        
        # Resize to standard size for consistent feature extraction
        face_standard = cv2.resize(face_roi, (100, 100))
        
        # Apply histogram equalization to normalize lighting
        face_equalized = cv2.equalizeHist(face_standard)
        
        # Create a simple feature vector by flattening and normalizing
        features = face_equalized.flatten().astype(np.float32) / 255.0
        
        # Add some basic statistical features
        mean_val = np.mean(face_equalized)
        std_val = np.std(face_equalized)
        
        # Combine pixel features with statistical features
        enhanced_features = np.append(features, [mean_val, std_val])
        
        return enhanced_features.tolist()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face processing error: {str(e)}"
        )

# ------------------ Face Auth Endpoints (new) ------------------


@router.post("/face/signup")
async def face_signup(payload: dict = Body(...)):
    """Register a student's face embedding and masked thumbnail.
    Expected payload: {"email": str, "image_base64": str, "consent": bool}
    """
    email = payload.get("email")
    image_b64 = payload.get("image_base64")
    consent = payload.get("consent")
    if not email or not image_b64 or consent is not True:
        raise HTTPException(status_code=400, detail="email, image_base64 and explicit consent are required")

    # Ensure user exists and is a student
    user = await db.users.find_one({"email": email, "role": "student"})
    if not user:
        raise HTTPException(status_code=404, detail="Student email not found. Register via normal signup first.")

    try:
        pil_img = image_from_base64(image_b64)
        np_img = pil_to_np(pil_img)
        # Remove background if possible
        np_img_fg = await remove_background_np(np_img)

        # Optionally crop to face area: here we use full image (frontend should send face-centered image)
        embedding = get_embedding_from_np(np_img_fg)

        # create thumbnail (small JPEG)
        thumb = Image.fromarray(np_img_fg.astype('uint8'))
        thumb.thumbnail((128, 128))
        buf = io.BytesIO()
        thumb.save(buf, format='JPEG', quality=70)
        thumb_bytes = buf.getvalue()

        metadata = {"method": "facenet-pytorch" if _FACENET_AVAILABLE else "unknown"}
        store_face_record(email, embedding, thumb_bytes, metadata)

        log_audit(email, True, "signup_success")
        return {"status": "ok", "message": "Face enrolled successfully"}
    except HTTPException:
        log_audit(email, False, "signup_processing_error")
        raise
    except Exception as e:
        log_audit(email, False, f"signup_failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Face signup failed")


@router.post("/face/challenge")
async def face_challenge(email: str = Body(...)):
    """Return a simple challenge. Frontend should capture two images: neutral then blink/close eyes.
    This lightweight challenge is optional; frontend may directly submit two frames to /face/login.
    """
    if not email:
        raise HTTPException(status_code=400, detail="email required")
    # For now return static guidance; could be extended to dynamic nonces
    return {"challenge": "Please capture two frames: neutral then blink/close eyes quickly"}


@router.post("face/login")
async def face_login(payload: dict = Body(...)):
    """Login using face. Payload: {"email":str, "images": [base64_img1, base64_img2]}"""
    email = payload.get("email")
    images = payload.get("images")
    if not email or not images or len(images) < 1:
        raise HTTPException(status_code=400, detail="email and at least one image required")

    # Ensure account exists
    user = await db.users.find_one({"email": email})
    if not user:
        log_audit(email, False, "email_not_found", "NO_EMAIL")
        raise HTTPException(status_code=404, detail="Email not found")

    # Fetch stored face record
    rec = await db.face_auth.find_one({"email": email})
    if not rec:
        log_audit(email, False, "no_face_enrolled", "NO_FACE")
        raise HTTPException(status_code=404, detail="No face enrolled for this email")

    # Rate limit / lockout
    if rec.get("locked_until") and rec["locked_until"] > datetime.utcnow():
        log_audit(email, False, "account_locked", "LOCKED")
        raise HTTPException(status_code=429, detail="Face login temporarily locked due to failed attempts")

    # Process incoming images
    try:
        images_np = []
        for b64 in images:
            pil = image_from_base64(b64)
            images_np.append(pil_to_np(pil))

        # liveness using first two frames if available
        live = await liveness_check(images_np[:2]) if len(images_np) >= 2 else False
        if not live:
            # allow single-frame if mediapipe unavailable, but log
            if _MP_AVAILABLE:
                # fail
                # increment failed attempts
                await db.face_auth.update_one({"email": email}, {"$inc": {"failed_attempts": 1}})
                log_audit(email, False, "liveness_failed", "LIVENESS")
                raise HTTPException(status_code=401, detail="Liveness check failed")

        # remove background on primary frame
        np_fg = await remove_background_np(images_np[-1])
        emb = get_embedding_from_np(np_fg)

        # decrypt stored embedding
        emb_enc = rec.get("embedding_enc")
        stored_bytes = decrypt_bytes(emb_enc)
        stored_emb = np.frombuffer(stored_bytes, dtype=np.float32).tolist()

        sim = float(cosine_similarity_list(emb, stored_emb))
        THRESHOLD = float(os.getenv("FACE_SIM_THRESHOLD", 0.70))
        if sim >= THRESHOLD:
            # success: reset failed_attempts
            await db.face_auth.update_one({"email": email}, {"$set": {"failed_attempts": 0}})
            log_audit(email, True, f"sim:{sim}")
            # issue JWT like student login
            token = create_access_token({"user_id": str(user["_id"]), "role": user.get("role", "student"), "email": user["email"]})
            return {"access_token": token, "token_type": "bearer", "similarity": sim}
        else:
            # increment failed attempts
            await db.face_auth.update_one({"email": email}, {"$inc": {"failed_attempts": 1}})
            # lock after 5 attempts
            if rec.get("failed_attempts", 0) + 1 >= 5:
                lock_until = datetime.utcnow() + timedelta(minutes=30)
                await db.face_auth.update_one({"email": email}, {"$set": {"locked_until": lock_until}})
            log_audit(email, False, f"sim:{sim}", "SIM_FAIL")
            raise HTTPException(status_code=401, detail="Face did not match")

    except HTTPException:
        raise
    except Exception as e:
        log_audit(email if email else "", False, f"error:{str(e)}")
        raise HTTPException(status_code=500, detail="Face login failed")


@router.post("/face/revoke")
async def face_revoke(email: str = Body(...), user=Depends(require_role(["admin"]))):
    """Admin-only: revoke face data for an email."""
    await db.face_auth.delete_one({"email": email})
    log_audit(email, True, "revoked_by_admin")
    return {"status": "ok"}


@router.post("/face/re-enroll")
async def face_reenroll(payload: dict = Body(...), user=Depends(get_current_user)):
    """Authenticated user can replace their face data. Payload same as signup."""
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="email required")
    # allow admin to re-enroll any account; else ensure the authenticated user's email matches
    if user.get("role") != "admin" and user.get("email") != email:
        raise HTTPException(status_code=403, detail="Not allowed to re-enroll this user")
    # delegate to signup (overwrite existing embedding)
    return await face_signup(payload)


def compare_face_features(features1, features2, threshold=0.85):
    """
    Compare two face feature vectors using cosine similarity
    Higher threshold = more strict matching
    """
    try:
        # Convert to numpy arrays
        feat1 = np.array(features1).reshape(1, -1)
        feat2 = np.array(features2).reshape(1, -1)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(feat1, feat2)[0][0]
        
        return similarity >= threshold, round(similarity, 4)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face comparison error: {str(e)}"
        )

# Student Signup with Face Registration
@router.post("/student/signup")
async def student_signup(data: StudentSignupRequest):
    # Check if email already exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    password_hash = pwd_context.hash(data.password)

    # Build document
    user_doc = {
        "name": data.name,
        "email": data.email,
        "password_hash": password_hash,
        "role": "student",
        "created_at": datetime.utcnow()
    }

    # Process face image if provided
    if data.faceImage:
        try:
            # Convert base64 to image
            image_array = base64_to_image(data.faceImage)
            
            # Extract face features
            face_features = extract_face_features_simple(image_array)
            
            # Store face features
            user_doc["face_features"] = face_features
            user_doc["face_registered_at"] = datetime.utcnow()
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to process face image: {str(e)}"
            )

    # Insert user
    result = await db.users.insert_one(user_doc)

    return {
        "message": "Student registered successfully",
        "user": {
            "user_id": str(result.inserted_id),
            "name": user_doc["name"],
            "email": user_doc["email"],
            "role": user_doc["role"],
            "created_at": user_doc["created_at"].isoformat(),
            "face_registered": data.faceImage is not None
        }
    }

# Student Login with Face or Password
@router.post("/student/login")
async def student_login(data: UserLogin):
    # Find student user
    user = await db.users.find_one({"email": data.email, "role": "student"})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check authentication method
    if data.faceImage:
        # Face authentication
        if "face_features" not in user:
            raise HTTPException(
                status_code=400, 
                detail="Face not registered for this user. Please use password login or register your face first."
            )
        
        try:
            # Convert base64 to image
            image_array = base64_to_image(data.faceImage)
            
            # Extract face features from login image
            login_features = extract_face_features_simple(image_array)
            
            # Compare with stored features
            is_match, similarity = compare_face_features(login_features, user["face_features"])
            
            if not is_match:
                raise HTTPException(
                    status_code=401, 
                    detail=f"Face verification failed (similarity: {similarity}). Please try again or use password login."
                )
                
            print(f"Face login successful for {data.email}, similarity: {similarity}")
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Face verification error: {str(e)}"
            )
            
    elif data.password:
        # Password authentication
        if not pwd_context.verify(data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
    else:
        raise HTTPException(
            status_code=400, 
            detail="Either password or faceImage is required for login"
        )

    # Create JWT token
    token = create_access_token({
        "user_id": str(user["_id"]), 
        "role": user["role"],
        "email": user["email"]
    })
    
    # Check if first time login (for profile setup)
    first_time = not await db.student_profiles.find_one({"user_id": user["_id"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "student",
        "first_time": first_time,
        "user_id": str(user["_id"]),
        "name": user["name"]
    }

# Club Login (UNCHANGED)
@router.post("/club/login")
async def club_login(data: UserLogin):
    # Find club by email
    club = await db.clubs.find_one({"email": data.email})
    if not club:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Compare plain text password
    if club.get("password") != data.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create JWT token with club_id
    token = create_access_token({"club_id": str(club["_id"])})

    return {
        "club_id": str(club["_id"]),
        "access_token": token,
    }

# Admin Login (UNCHANGED)
@router.post("/admin/login")
async def admin_login(data: UserLogin):
    # Authenticate admin user
    user = await db.users.find_one({"email": data.email, "role": "admin"})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not pwd_context.verify(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create token
    token = create_access_token({"user_id": str(user["_id"]), "role": user["role"]})
    
    return {"access_token": token, "role": "admin"}