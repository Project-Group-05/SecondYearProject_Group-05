"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../diagnostic.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function DiagnosticContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId');

  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const getLevelUIProperties = (level) => {
    const normalized = level?.toLowerCase();
    if (normalized === 'advanced')     return { color: '#065F46', bg: '#ECFDF5', bar: '#10B981' };
    if (normalized === 'intermediate') return { color: '#92400E', bg: '#FFFBEB', bar: '#F59E0B' };
    return { color: '#991B1B', bg: '#FEF2F2', bar: '#EF4444' };
  };

  useEffect(() => {
    async function loadResults() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const token = localStorage.getItem("access_token");
        const studentId = localStorage.getItem("student_id");

        console.log("STUDENT ID:", studentId);   // ← add
    console.log("TOKEN:", token);

        if (!token || !studentId) {
          router.push('/login');
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/diagnostic/student/${studentId}/results`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData?.message || "Failed to fetch results.");
        }

        const json = await response.json();
        const data = json?.data;

        if (!data || !data.subtopics) {
          throw new Error("Failed to load results.");
        }

        const computedTopics = data.subtopics.map((item) => {
          const uiStyles = getLevelUIProperties(item.level);
          return {
            id: item.subtopic_id,
            name: item.subtopic_name,
            level: item.level,
            score: item.score ?? 0,
            color: uiStyles.color,
            bg: uiStyles.bg,
            bar: uiStyles.bar,
          };
        });

        setResults({
          studentId,
          levelSummary: data.level_summary,
          totalSubtopics: data.total_subtopics,
          topics: computedTopics,
        });

      } catch (err) {
        console.error("❌ Error loading diagnostic results:", err.message);
        setErrorMessage(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadResults();
  }, [attemptId]);

  if (isLoading) return <div className={styles.container}>Analyzing diagnostic records...</div>;

  if (errorMessage) return (
    <div className={styles.container} style={{ color: '#991B1B' }}>
      Error: {errorMessage}
      <button className={styles.mainButton} style={{ marginTop: '1rem' }} onClick={() => router.push('/login')}>
        Go to Login
      </button>
    </div>
  );

  if (!results || results.topics.length === 0) return (
    <div className={styles.container}>
      <h3>No results found.</h3>
      <p>Please complete the diagnostic exam first.</p>
    </div>
  );

  const { levelSummary, totalSubtopics, topics } = results;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Evaluation Test Results</h1>
        <p className={styles.subtitle}>
          Based on your performance, we've identified your level for each subtopic.
        </p>
      </header>

      {/* Summary Banner */}
      <div className={styles.scoreBanner}>
        <span className={styles.scoreLabel}>Subtopics Assessed</span>
        <h2 className={styles.scoreValue}>{totalSubtopics}</h2>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Advanced',     color: '#065F46', bg: '#ECFDF5' },
            { label: 'Intermediate', color: '#92400E', bg: '#FFFBEB' },
            { label: 'Beginner',     color: '#991B1B', bg: '#FEF2F2' },
          ].map(({ label, color, bg }) => (
            <span key={label} style={{
              backgroundColor: bg, color,
              padding: '4px 12px', borderRadius: '999px',
              fontSize: '0.85rem', fontWeight: 600,
            }}>
              {label}: {levelSummary?.[label.toLowerCase()] ?? 0}
            </span>
          ))}
        </div>
      </div>

      {/* Subtopic Cards with Progress Bars */}
     {/* Subtopic Cards */}
<div className={styles.grid}>
  {topics.map((topic) => (
    <div key={topic.id} className={styles.topicCard}>

      {/* Top row: name + badge */}
      <div className={styles.topicCardHeader}>
        <span className={styles.topicName}>{topic.name}</span>
        <span className={styles.badge} style={{ backgroundColor: topic.bg, color: topic.color }}>
          {topic.level}
        </span>
      </div>

      {/* Score */}
      <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>
        Score: {topic.score}%
      </span>

    </div>
  ))}
</div>

      

      <footer className={styles.footer}>
        <button className={styles.mainButton} onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </button>
      </footer>
    </div>
  );
}

export default function DiagnosticResults() {
  return (
    <Suspense fallback={<div>Initializing layout components...</div>}>
      <DiagnosticContent />
    </Suspense>
  );
}