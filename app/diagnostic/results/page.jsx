"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../diagnostic.module.css'; // This connects the design!

export default function DiagnosticResults() {
  const router = useRouter();
  const [results, setResults] = useState(null);

  useEffect(() => {
    // This is your data list
    const mockData = {
      score: 72,
      topics: [
        { id: 1, name: "Atomic Radius", level: "Beginner", color: '#991B1B', bg: '#FEF2F2' },
        { id: 2, name: "Ionization Energy", level: "Intermediate", color: '#92400E', bg: '#FFFBEB' },
        { id: 3, name: "Reactivity", level: "Intermediate", color: '#92400E', bg: '#FFFBEB' },
        { id: 4, name: "Oxides", level: "Beginner", color: '#991B1B', bg: '#FEF2F2' },
        { id: 5, name: "Hydroxides", level: "Intermediate", color: '#92400E', bg: '#FFFBEB' },
        { id: 6, name: "Physical Properties", level: "Advanced", color: '#065F46', bg: '#ECFDF5' },
        { id: 7, name: "Chemical Properties", level: "Advanced", color: '#065F46', bg: '#ECFDF5' },
        { id: 8, name: "Carbonates", level: "Intermediate", color: '#92400E', bg: '#FFFBEB' },
        { id: 9, name: "Nitrates", level: "Intermediate", color: '#92400E', bg: '#FFFBEB' },
        { id: 10, name: "Uses", level: "Advanced", color: '#065F46', bg: '#ECFDF5' }
      ]
    };
    setResults(mockData);
  }, []);

  if (!results) return <div className={styles.container}>Loading your profile...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your Diagnostic Profile</h1>
        <p className={styles.subtitle}>Based on your performance, we've identified your level for each subtopic.</p>
      </header>
      
      <div className={styles.scoreBanner}>
        <span className={styles.scoreLabel}>Overall Performance</span>
        <h2 className={styles.scoreValue}>{results.score}%</h2>
      </div>

      <div className={styles.grid}>
        {results.topics.map((topic) => (
          <div key={topic.id} className={styles.topicCard}>
            <span className={styles.topicName}>{topic.name}</span>
            <span 
              className={styles.badge}
              style={{ backgroundColor: topic.bg, color: topic.color }}
            >
              {topic.level}
            </span>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>
        <button 
          className={styles.mainButton}
          onClick={() => router.push('/dashboard')}
        >
          Go to Personalized Dashboard
        </button>
      </footer>
    </div>
  );
}
