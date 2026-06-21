"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './webcam.module.css';

const BACKEND_URL = "http://127.0.0.1:8000";

const LocalButton = ({ label, onClick, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    style={{
      backgroundColor: disabled ? '#9CA3AF' : '#1A2B5F',
      color: 'white',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      width: '100%',
      transition: 'background-color 0.2s ease'
    }}
  >
    {label}
  </button>
);

function WebcamCheckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('idle');
  
  // 🛡️ Focus Guardian States
  const [aiMessage, setAiMessage] = useState('Camera Preview Off');
  const [isDistracted, setIsDistracted] = useState(false);

  const videoRef = useRef(null); 
  const canvasRef = useRef(null); // Hidden canvas to compile JPEG blobs
  const streamRef = useRef(null); 

 // 📑 Pulls dynamic IDs from the URL query params safely
const subtopicId = searchParams.get('subtopicId');
const studentId = searchParams.get('studentId') || (typeof window !== 'undefined' ? localStorage.getItem('student_id') : null);
  const requestCamera = async () => {
    setStatus('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: "user" } 
      });
      
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('success');
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setStatus('error');
    }
  };

  // 🔄 Automated frame-polling engine hook
  useEffect(() => {
    let intervalId;

    if (status === 'success') {
      setAiMessage("🧠 Starting focus validation...");
      // Captures a snapshot and evaluates it via backend AI every 2.5 seconds
      intervalId = setInterval(() => {
        captureAndSendFrame();
      }, 2500);
    } else {
      setIsDistracted(false);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status]);

  const captureAndSendFrame = async () => {
    if (!videoRef.current || !canvasRef.current || status !== 'success') return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    // Draw the active video frame on the background canvas coordinate tree
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Transform coordinate grid into a lightweight JPEG file bundle
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("file", blob, "snapshot.jpg");

      try {
        const res = await fetch(`${BACKEND_URL}/behaviour/analyze-frame`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          setAiMessage(data.data.message);
          setIsDistracted(data.data.distracted);
        }
      } catch (err) {
        console.error("Packet delivery to AI endpoint failed:", err);
      }
    }, "image/jpeg", 0.7); // 70% compression quality preserves CPU performance
  };

  const handleStartStudy = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (!subtopicId || !studentId) {
      console.error("Missing subtopicId or studentId:", { subtopicId, studentId });
      return;
    }

    router.push(`/study/${subtopicId}/${studentId}`); 
  };

  // Dynamic visual feedback boundary based on focus score
  const dynamicContainerStyle = {
    ...videoContainerStyle,
    border: isDistracted 
      ? '3px solid #EF4444' 
      : status === 'success' ? '3px solid #10B981' : '2px solid #E2E8F0',
    transition: 'all 0.2s ease'
  };

  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ maxWidth: '500px', width: '100%' }}>
        <h1 className={styles.title}>🛡️ Focus Guardian Activation</h1>
        <p className={styles.description}>
          Please enable your camera feed to initialize the tracking system and pass integrity checks.
        </p>

        <div style={dynamicContainerStyle}>
          {status !== 'success' && (
            <div style={placeholderStyle}>
              {status === 'loading' ? "Initializing lens hardware..." : "Camera Preview Off"}
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: status === 'success' ? 'block' : 'none',
              transform: 'scaleX(-1)' // Mirrors video for natural head tracking interaction
            }}
          />
          {/* Hidden snapshot pipeline generator layer */}
          <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
        </div>

        {/* Dynamic Focus Diagnostics Display Box */}
        <div style={{
          margin: '12px 0',
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: status !== 'success' ? '#F1F5F9' : isDistracted ? '#FEF2F2' : '#F0FDF4',
          border: status !== 'success' ? '1px solid #CBD5E1' : isDistracted ? '1px solid #FCA5A5' : '1px solid #86EFAC',
          textAlign: 'center',
          transition: 'all 0.2s ease'
        }}>
          <p style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '600',
            color: status !== 'success' ? '#475569' : isDistracted ? '#DC2626' : '#16A34A'
          }}>
            {status === 'success' ? aiMessage : status === 'loading' ? 'Requesting hardware permission...' : status === 'error' ? '⚠ Camera access denied.' : 'Camera system offline.'}
          </p>
        </div>

        <div style={{ width: '100%', marginTop: '4px' }}>
          {status !== 'success' ? (
            <LocalButton 
              label={status === 'loading' ? "Connecting..." : "Authorize & Launch Camera"} 
              onClick={requestCamera} 
              disabled={status === 'loading'}
            />
          ) : (
            <LocalButton 
              label="Start Study Session →" 
              onClick={handleStartStudy} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function WebcamCheck() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><p>Assembling security matrix...</p></div>}>
      <WebcamCheckContent />
    </Suspense>
  );
}

const videoContainerStyle = {
  width: '100%',
  height: '260px',
  backgroundColor: '#1E293B',
  borderRadius: '12px',
  overflow: 'hidden',
  position: 'relative',
  margin: '16px 0',
  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.20)',
};

const placeholderStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#94A3B8',
  fontSize: '14px',
  fontWeight: '500'
};