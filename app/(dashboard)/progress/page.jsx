"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "../../utils/supabase/client"; // Adjust relative path if necessary
import styles from "./progress.module.css";

export default function ProgressPage() {
  const supabase = createClient();
  
  // ── State Management ──
  const [studentName, setStudentName] = useState("");
  const [combinedProgress, setCombinedProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Safely extract student context metrics from client storage layers
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("name") || "Student";
      setStudentName(name);
    }

    async function fetchProgressData() {
      setIsLoading(true);
      try {
        // 1. Fetch current logged-in authenticated user session metadata
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("User session token unverified.");

        // 2. Fetch all available subtopics across s-block groups to prevent missing items
        const { data: subtopicsData, error: subtopicsError } = await supabase
          .from('subtopics')
          .select('id, group_name, title, order_index')
          .order('order_index', { ascending: true });

        if (subtopicsError) throw subtopicsError;

        // 3. Fetch the logged-in student's personal row logs inside student_progress
        const { data: progressRecords, error: progressError } = await supabase
          .from('student_progress')
          .select('subtopic_id, current_level, last_quiz_score, total_sessions')
          .eq('student_id', user.id);

        if (progressError) throw progressError;

        // 4. Group row records into a map lookup object by subtopic_id
        const progressMap = {};
        progressRecords?.forEach(record => {
          progressMap[record.subtopic_id] = record;
        });

        // 5. Build combined data nodes fallback mapping structure
        const compiledData = subtopicsData.map(topic => {
          const userProgress = progressMap[topic.id];
          return {
            id: topic.id,
            name: topic.title,
            groupNum: topic.group_name?.includes('2') ? 2 : 1, 
            level: userProgress?.current_level || 'Beginner', 
            score: userProgress?.last_quiz_score !== undefined ? userProgress.last_quiz_score : 0, 
            sessions: userProgress?.total_sessions || 0 
          };
        });

        setCombinedProgress(compiledData);
      } catch (err) {
        console.error("Database tracking sync failed:", err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgressData();
  }, [supabase]);

  // ── Helper Style Utility Selectors ──
  const getLevelColorClass = (level) => {
    if (level === 'Intermediate') return styles.fillIntermediate;
    if (level === 'Advanced') return styles.fillAdvanced;
    return styles.fillBeginner;
  };

  const getBadgeClass = (level) => {
    if (level === 'Intermediate') return styles.badgeIntermediate;
    if (level === 'Advanced') return styles.badgeAdvanced;
    return styles.badgeBeginner;
  };

  // ── Compute Header Counter Metrics ──
  let beginnerCount     = 0;
  let intermediateCount = 0;
  let advancedCount     = 0;
  let totalSessions     = 0;

  combinedProgress.forEach((item) => {
    totalSessions += item.sessions;
    if (item.level === "Advanced") advancedCount++;
    else if (item.level === "Intermediate") intermediateCount++;
    else beginnerCount++;
  });

  const renderGroupSection = (targetGroup, sectionHeading) => {
    const groupItems = combinedProgress.filter(item => item.groupNum === targetGroup);

    if (groupItems.length === 0) return null;

    return (
      <div className={styles.groupContainer}>
        <h2 className={styles.groupHeading}>{sectionHeading}</h2>
        
        {groupItems.map((subtopic) => (
          <div key={subtopic.id} className={styles.row}>
            
            <div className={styles.nameSection}>
              <span className={styles.subtopicName}>{subtopic.name}</span>
            </div>
            
            <div className={styles.progressSection}>
              <div className={styles.progressBarContainer}>
                <div 
                  className={`${styles.progressBarFill} ${getLevelColorClass(subtopic.level)}`}
                  style={{ width: `${subtopic.score}%` }} 
                />
              </div>
            </div>

            <div className={styles.badgeSection}>
              <span className={`${styles.badgeBase} ${getBadgeClass(subtopic.level)}`}>
                {subtopic.level}
              </span>
            </div>

            <div className={styles.statsSection}>
              <span className={styles.statText}>Last: {subtopic.score}%</span>
              <span className={styles.statText}>Sessions: {subtopic.sessions}</span>
            </div>

          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.statusLabel}>Syncing structural data frames...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>

        {/* Header Layout */}
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Progress</h1>
          <p className={styles.studentSubtitle}>{studentName}&apos;s Learning Journey</p>
        </header>

        {/* Card Analytics Block */}
        <div className={styles.statsRow}>
          <div className={`${styles.statBox} ${styles.beginnerBox}`}>
            <span className={styles.statNumber}>{beginnerCount}</span>
            <span className={styles.statLabel}>Beginner Modules</span>
          </div>
          <div className={`${styles.statBox} ${styles.intermediateBox}`}>
            <span className={styles.statNumber}>{intermediateCount}</span>
            <span className={styles.statLabel}>Intermediate Modules</span>
          </div>
          <div className={`${styles.statBox} ${styles.advancedBox}`}>
            <span className={styles.statNumber}>{advancedCount}</span>
            <span className={styles.statLabel}>Advanced Modules</span>
          </div>
          <div className={`${styles.statBox} ${styles.sessionsBox}`}>
            <span className={styles.statNumber}>{totalSessions}</span>
            <span className={styles.statLabel}>Total Sessions</span>
          </div>
        </div>

        {/* Dynamic Structural Grid Fills */}
        <div className={styles.overviewWrapper}>
          {renderGroupSection(1, "Alkali Metals (Group 1) Elements")}
          {renderGroupSection(2, "Alkaline Earth Metals (Group 2) Elements")}
        </div>

        {/* Back navigation CTA */}
        <div className={styles.bottomActions}>
          <Link href="/dashboard" className={styles.btnPrimary}>
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}