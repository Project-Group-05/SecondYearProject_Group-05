"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './webcam.module.css';

// We are defining the Button right here so there is no "Module not found" error
const LocalButton = ({ label, onClick }) => (
  <button 
    onClick={onClick}
    style={{
      backgroundColor: '#1A2B5F',
      color: 'white',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold'
    }}
  >
    {label}
  </button>
);

export default function WebcamCheck() {
  const router = useRouter();
  const [status, setStatus] = useState('idle');

  const requestCamera = async () => {
    setStatus('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setStatus('success');
      setTimeout(() => { router.push('/diagnostic/results'); }, 1500);
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconCircle}>📷</div>
        <h1 className={styles.title}>Webcam Verification</h1>
        <p className={styles.description}>
          Please enable your camera to proceed to the diagnostic test.
        </p>

        <div className={styles.statusBox}>
          {status === 'loading' && <p>Requesting permission...</p>}
          {status === 'success' && <p style={{color: 'green'}}>Success! Redirecting...</p>}
          {status === 'error' && <p style={{color: 'red'}}>Camera access denied.</p>}
        </div>

        <LocalButton 
          label={status === 'loading' ? "Processing..." : "Enable Camera"} 
          onClick={requestCamera} 
        />
      </div>
    </div>
  );
}