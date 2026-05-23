"use client";

import React, { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
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
      width: '100%'
    }}
  >
    {label}
  </button>
);

export default function WebcamCheck() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('idle');
  const videoRef = useRef(null); // Reference to hold our video element instance
  const streamRef = useRef(null); // Keep a reference to stop the stream if needed later

  const taskId = searchParams.get('taskId');

  const requestCamera = async () => {
    setStatus('loading');
    try {
      // 1. Request access to the video hardware stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: "user" } 
      });
      
      // 2. Keep track of the stream instance globally in the component
      streamRef.current = stream;

      // 3. Mount the stream directly into our video element source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('success');
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setStatus('error');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ maxWidth: '500px', width: '100%' }}>
        <div className={styles.iconCircle}>📷</div>
        <h1 className={styles.title}>Webcam Verification</h1>
        <p className={styles.description}>
          Please enable your camera feed to begin your study session for Task #{taskId || "None Selected"}.
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
          {status === 'success' && <p style={{color: 'green', fontWeight: 'bold'}}>✓ Camera Live Feed Active</p>}
          {status === 'error' && <p style={{color: 'red', fontWeight: 'bold'}}>⚠ Camera access denied or not found.</p>}
        </div>

        <LocalButton 
          label={status === 'loading' ? "Connecting..." : status === 'success' ? "Camera Active" : "Enable Camera"} 
          onClick={requestCamera} 
          disabled={status === 'success' || status === 'loading'}
        />
      </div>
    </div>
  );
}

// Inline styles designed to blend perfectly with your corporate blue theme layout structure
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
