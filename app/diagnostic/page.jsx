"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './diagnostic.module.css';

export default function DiagnosticPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      {/* This part is the Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Chemistry Diagnostic Test</h1>
        <p className={styles.subtitle}>Evaluation: Group 1 & Group 2 Elements</p>
      </div>
      
      {/* This part is the Neat White Box */}
      <div className={styles.card}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🧪</div>
        <h2 style={{ color: '#1A2B5F', marginBottom: '15px' }}>Instructions</h2>
        
        <p>
          This diagnostic will assess your current level across 10 key subtopics. 
          Your webcam must remain active for eye-tracking analysis throughout the session.
        </p>
        
        <button 
          className={styles.mainButton} 
          onClick={() => router.push('/diagnostic/results')}
        >
          Start Assessment
        </button>
      </div>
    </div>
  );
}
