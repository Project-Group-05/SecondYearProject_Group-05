"use client";

<<<<<<< HEAD
import React, { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
=======
import React, { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
>>>>>>> 1aeca1be5e804b85d646b87891612e0e9c2b7d4e
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
<<<<<<< HEAD
      width: '100%',
      transition: 'background-color 0.2s ease'
=======
      width: '100%'
>>>>>>> 1aeca1be5e804b85d646b87891612e0e9c2b7d4e
    }}
  >
    {label}
  </button>
);

<<<<<<< HEAD
function WebcamCheckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('idle');
  const videoRef = useRef(null); 
  const streamRef = useRef(null); 

  // Pulls the dynamic chemistry task ID from the URL parameters
=======
export default function WebcamCheck() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('idle');
  const videoRef = useRef(null); // Reference to hold our video element instance
  const streamRef = useRef(null); // Keep a reference to stop the stream if needed later

>>>>>>> 1aeca1be5e804b85d646b87891612e0e9c2b7d4e
  const taskId = searchParams.get('taskId');

  const requestCamera = async () => {
    setStatus('loading');
    try {
<<<<<<< HEAD
=======
      // 1. Request access to the video hardware stream
>>>>>>> 1aeca1be5e804b85d646b87891612e0e9c2b7d4e
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: "user" } 
      });
      
<<<<<<< HEAD
      streamRef.current = stream;

=======
      // 2. Keep track of the stream instance globally in the component
      streamRef.current = stream;

      // 3. Mount the stream directly into our video element source
>>>>>>> 1aeca1be5e804b85d646b87891612e0e9c2b7d4e
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('success');
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setStatus('error');
    }
  };

<<<<<<< HEAD
  // Navigates directly into the chemistry diagnostic quiz page layout
  const handleStartQuiz = () => {
    // Shuts down hardware recording indicators before shifting page paths
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Forwards your unique task sequence integer to the evaluation panel
    router.push(`/quiz?subtopicId=${taskId || '1'}`);
  };

=======
>>>>>>> 1aeca1be5e804b85d646b87891612e0e9c2b7d4e
  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ maxWidth: '500px', width: '100%' }}>
        <div className={styles.iconCircle}>📷</div>
<<<<<<< HEAD
        <h1 className={styles.title}>Identity & Environment Check</h1>
        <p className={styles.description}>
          Please enable your camera feed to begin your chemistry diagnostic test for Task #{taskId || "None Selected"}.
=======
        <h1 className={styles.title}>Webcam Verification</h1>
        <p className={styles.description}>
          Please enable your camera feed to begin your study session for Task #{taskId || "None Selected"}.
>>>>>>> 1aeca1be5e804b85d646b87891612e0e9c2b7d4e
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
<<<<<<< HEAD
          {status === 'success' && <p style={{color: 'green', fontWeight: 'bold'}}>✓ Integrity Check Passed</p>}
          {status === 'error' && <p style={{color: 'red', fontWeight: 'bold'}}>⚠ Camera access denied or not found.</p>}
        </div>

        {/* Swaps interactive button triggers contextually based on hardware stream states */}
        <div style={{ width: '100%', marginTop: '4px' }}>
          {status !== 'success' ? (
            <LocalButton 
              label={status === 'loading' ? "Connecting..." : "Enable Camera"} 
              onClick={requestCamera} 
              disabled={status === 'loading'}
            />
          ) : (
            <LocalButton 
              label="Start Diagnostic Test →" 
              onClick={handleStartQuiz} 
            />
          )}
        </div>
=======
          {status === 'success' && <p style={{color: 'green', fontWeight: 'bold'}}>✓ Camera Live Feed Active</p>}
          {status === 'error' && <p style={{color: 'red', fontWeight: 'bold'}}>⚠ Camera access denied or not found.</p>}
        </div>

        <LocalButton 
          label={status === 'loading' ? "Connecting..." : status === 'success' ? "Camera Active" : "Enable Camera"} 
          onClick={requestCamera} 
          disabled={status === 'success' || status === 'loading'}
        />
>>>>>>> 1aeca1be5e804b85d646b87891612e0e9c2b7d4e
      </div>
    </div>
  );
}

<<<<<<< HEAD
// Default page wrapper satisfying Next.js Suspense boundary parsing conditions for query tracking
export default function WebcamCheck() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><p>Assembling security matrix...</p></div>}>
      <WebcamCheckContent />
    </Suspense>
  );
}

=======
// Inline styles designed to blend perfectly with your corporate blue theme layout structure
>>>>>>> 1aeca1be5e804b85d646b87891612e0e9c2b7d4e
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
<<<<<<< HEAD
};
=======
};
>>>>>>> 1aeca1be5e804b85d646b87891612e0e9c2b7d4e
