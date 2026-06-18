"use client";

import React, { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './webcam.module.css';

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
  const videoRef = useRef(null); 
  const streamRef = useRef(null); 

  // Pulls the dynamic chemistry task ID from the URL parameters
  const taskId = searchParams.get('taskId');

  const requestCamera = async () => {
    setStatus('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: "user" } 
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

  // Navigates directly into the chemistry diagnostic quiz page layout
  const handleStartStudy = () => {
    // Shuts down hardware recording indicators before shifting page paths
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Forwards your unique task sequence integer to the evaluation panel
    router.push('/study');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ maxWidth: '500px', width: '100%' }}>
        <h1 className={styles.title}>Webcam Activation Required</h1>
        <p className={styles.description}>
          Please enable your camera feed to begin your study session.
        </p>

        {/* --- Live Video Feed Frame Container --- */}
        <div style={videoContainerStyle}>
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
              display: status === 'success' ? 'block' : 'none'
            }}
          />
        </div>

        <div className={styles.statusBox} style={{ margin: '8px 0' }}>
          {status === 'loading' && <p>Requesting hardware permission...</p>}
          {status === 'success' && <p style={{color: 'green', fontWeight: 'bold'}}>✓ Integrity Check Passed</p>}
          {status === 'error' && <p style={{color: 'red', fontWeight: 'bold'}}>⚠ Camera access denied or not found.</p>}
        </div>

        {/* Swaps interactive button triggers contextually based on hardware stream states */}
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

// Default page wrapper satisfying Next.js Suspense boundary parsing conditions for query tracking
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
  border: '2px solid #E2E8F0'
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
