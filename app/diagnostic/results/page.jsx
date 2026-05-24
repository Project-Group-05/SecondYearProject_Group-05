"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../utils/supabase/client'; // Adjust this relative path if necessary
import styles from '../diagnostic.module.css'; // Connects your custom design system layout

function DiagnosticContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Extract a specific attempt id from URL query parameters if present (e.g., /diagnostic?attemptId=42)
  const attemptId = searchParams.get('attemptId');

  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function compileDiagnosticProfile() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        console.log("🔄 Initializing diagnostic evaluation pipeline...");

        // A. Identify active frontend authentication context
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) throw new Error("No active authenticated session discovered.");
        
        console.log("👤 Authenticated student session ID:", user.id);

        let overallScore = 0;
        
        // B. Fetch score records from main_exam_attempts
        let attemptQuery = supabase.from('main_exam_attempts').select('id, score_percentage');

        if (attemptId) {
          attemptQuery = attemptQuery.eq('id', attemptId);
        } else {
          attemptQuery = attemptQuery.eq('student_id', user.id).order('submitted_at', { ascending: false }).limit(1);
        }

        const { data: attemptData, error: attemptError } = await attemptQuery;
        if (attemptError) throw attemptError;

        if (attemptData && attemptData.length > 0) {
          overallScore = attemptData[0].score_percentage !== undefined ? attemptData[0].score_percentage : 0;
        }
        console.log("🎯 Evaluated benchmark score percentage:", overallScore + "%");

        // C. Fetch all available standard chemistry subtopic rows dynamically from database
        const { data: subtopicsList, error: subtopicsError } = await supabase
          .from('subtopics')
          .select('id, title')
          .order('id', { ascending: true });
          
        if (subtopicsError) throw subtopicsError;
        console.log(`✅ Loaded ${subtopicsList?.length || 0} subtopics from database.`);

        // 🟢 D1. NEW FIX: Fetch the true, calculated level data directly from your database view matrix
        const { data: realCalculatedLevels, error: viewError } = await supabase
          .from('v_student_subtopic_levels')
          .select('subtopic_id, current_level')
          .eq('student_id', user.id);

        if (viewError) {
          console.warn("⚠️ View retrieval failed, falling back to basic checks:", viewError.message);
        }

        // Convert the view rows to a clear object map for instant indexing searches
        const levelsMap = {};
        realCalculatedLevels?.forEach(row => {
          levelsMap[row.subtopic_id] = row.current_level;
        });

        // D2. Map the subtopics array to compile the full visual diagnostic nodes profile
        const computedTopics = (subtopicsList || []).map((topic) => {
          // 🟢 FIXED: Grab their actual real database level. Fall back to 'Beginner' if they haven't taken it.
          const trueLevel = levelsMap[topic.id] || "Beginner";
          const UIStyles = getLevelUIProperties(trueLevel);

          return {
            id: topic.id,
            name: topic.title,
            level: trueLevel,
            color: UIStyles.color,
            bg: UIStyles.bg
          };
        });

        setResults({
          score: overallScore,
          topics: computedTopics
        });

      } catch (err) {
        console.error("❌ Pipeline crash tracking node:", err.message);
        setErrorMessage(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    compileDiagnosticProfile();
  }, [attemptId, supabase]);

  // Helper styling dictionary utility
  const getLevelUIProperties = (level) => {
    if (level === 'Advanced') return { color: '#065F46', bg: '#ECFDF5' };
    if (level === 'Intermediate') return { color: '#92400E', bg: '#FFFBEB' };
    return { color: '#991B1B', bg: '#FEF2F2' }; // Defaults to Beginner layout styles
  };

  // State Management Conditional Screens
  if (isLoading) return <div className={styles.container}>Analyzing diagnostic records...</div>;
  if (errorMessage) return <div className={styles.container} style={{color: '#991B1B'}}>Error: {errorMessage}</div>;
  if (!results || results.topics.length === 0) {
    return (
      <div className={styles.container}>
        <h3>No system metrics found.</h3>
        <p>Please make sure your "subtopics" table contains row entries in your Supabase panel.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Evaluation Test Results</h1>
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
          Back to Dashboard
        </button>
      </footer>
    </div>
  );
}

// Main wrapping export using a React boundary component to safeguard server rendering tracks
export default function DiagnosticResults() {
  return (
    <Suspense fallback={<div className={styles.container}>Initializing layout components...</div>}>
      <DiagnosticContent />
    </Suspense>
  );
}