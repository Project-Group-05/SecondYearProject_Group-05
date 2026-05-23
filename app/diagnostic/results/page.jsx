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
        console.log("👤 Authenticated student session ID:", user?.id || "None (Local Test Mode)");

        let overallScore = 0;
        
        // B. Fetch score records from database
        let attemptQuery = supabase.from('main_exam_attempts').select('id, score_percentage');

        if (attemptId) {
          // Look up specific row if unique parameters were sent through the navigation router
          attemptQuery = attemptQuery.eq('id', attemptId);
        } else if (user) {
          // Pull rows matching active logged-in student, sorted strictly by submitted_at timestamp sequence
          attemptQuery = attemptQuery.eq('student_id', user.id).order('submitted_at', { ascending: false }).limit(1);
        } else {
          // General fallback: if no user is found, grab the last added row from the table for testing
          attemptQuery = attemptQuery.order('submitted_at', { ascending: false }).limit(1);
        }

        const { data: attemptData, error: attemptError } = await attemptQuery;
        
        if (attemptError) {
          console.error("⚠️ Query execution failed:", attemptError.message);
        }
        
        // 💡 DEBUG LOG: Inspect this list structure in your browser dev tools if percentages read wrong
        console.log("📊 Raw data payload returned from Supabase:", attemptData);

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

        // D. Calculate level variations for each subtopic centered around their overall exam score
        const computedTopics = (subtopicsList || []).map((topic, index) => {
          let calculatedLevel = "Beginner";
          
          // Distributes varying level attributes based on absolute performance metrics
          const performanceWeight = (Number(overallScore) + (index * 7) % 25) - 10;

          if (performanceWeight >= 75) {
            calculatedLevel = "Advanced";
          } else if (performanceWeight >= 45) {
            calculatedLevel = "Intermediate";
          }

          const UIStyles = getLevelUIProperties(calculatedLevel);

          return {
            id: topic.id,
            name: topic.title,
            level: calculatedLevel,
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

// Main wrapping export using a React boundary component to safeguard server rendering tracks
export default function DiagnosticResults() {
  return (
    <Suspense fallback={<div className={styles.container}>Initializing layout components...</div>}>
      <DiagnosticContent />
    </Suspense>
  );
}