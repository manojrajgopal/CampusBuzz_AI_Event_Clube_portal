import React, { useRef, useState, useEffect } from 'react';

// FaceAuth component
// - Captures camera frames
// - (Optionally) runs segmentation on the client (MediaPipe SelfieSegmentation or BodyPix recommended)
// - Collects consent for storage
// - Sends masked/base64 images to backend endpoints:
//    POST /api/auth/face/signup  { email, image_base64, consent }
//    POST /api/auth/face/login   { email, images: [img1, img2] }
// It intentionally keeps UI minimal and delegates heavy tasks (segmentation/liveness) to the client when available.

export default function FaceAuth({ mode = 'login' /* 'login' | 'signup' */, onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('');
  const [captured, setCaptured] = useState([]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      videoRef.current.srcObject = s;
      await videoRef.current.play();
      setStreaming(true);
    } catch (err) {
      setStatus('Camera access denied or not available');
    }
  }

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Note: For production, run client-side segmentation here (MediaPipe/BodyPix)
    const data = canvas.toDataURL('image/jpeg', 0.8);
    setCaptured(prev => [...prev, data]);
  }

  async function submitSignup() {
    if (!email || !consent || captured.length < 1) {
      setStatus('Provide email, consent and capture a selfie');
      return;
    }
    setStatus('Uploading...');
    try {
      const res = await fetch('/api/auth/face/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, image_base64: captured[0], consent: true })
      });
      const json = await res.json();
      if (res.ok) {
        setStatus('Face signup successful');
        onSuccess && onSuccess(json);
      } else {
        setStatus(json.detail || JSON.stringify(json));
      }
    } catch (e) {
      setStatus('Failed to contact server');
    }
  }

  async function submitLogin() {
    if (!email || captured.length < 1) {
      setStatus('Provide email and capture frames');
      return;
    }
    setStatus('Verifying...');
    try {
      const res = await fetch('/api/auth/face/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, images: captured })
      });
      const json = await res.json();
      if (res.ok) {
        setStatus('Face login successful');
        onSuccess && onSuccess(json);
      } else {
        setStatus(json.detail || JSON.stringify(json));
      }
    } catch (e) {
      setStatus('Failed to contact server');
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <h3>{mode === 'signup' ? 'Face Signup' : 'Face Login'}</h3>
      <div>
        <video ref={videoRef} style={{ width: '100%', maxWidth: 640 }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div style={{ marginTop: 8 }}>
        <input placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>

      {mode === 'signup' && (
        <div style={{ marginTop: 8 }}>
          <label>
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
            I consent to the storage and use of my face data for authentication as described.
          </label>
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <button onClick={captureFrame}>Capture Frame</button>
        <button onClick={() => setCaptured([])}>Clear</button>
      </div>

      <div style={{ marginTop: 8 }}>
        Captured: {captured.length}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {captured.map((c, i) => (
            <img key={i} src={c} alt={`capture-${i}`} style={{ width: 120, height: 90, objectFit: 'cover' }} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {mode === 'signup' ? (
          <button onClick={submitSignup}>Sign up with face</button>
        ) : (
          <button onClick={submitLogin}>Login with face</button>
        )}
      </div>

      <div style={{ marginTop: 12, color: '#333' }}>{status}</div>

      <div style={{ marginTop: 12 }}>
        <small>Fallback: use email/password on the main login form if face fails or you opt out.</small>
      </div>
    </div>
  );
}
