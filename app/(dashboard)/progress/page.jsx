"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./progress.module.css";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function ProgressPage() {
  const [studentName, setStudentName] = useState("");
  const [combinedProgress, setCombinedProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const student = JSON.parse(localStorage.getItem("student"));
    if (student?.name) setStudentName(student.name);

    async function fetchProgressData() {
      setIsLoading(true);
      try {
        if (!student?.id) throw new Error("No student session found.");

        // Single call — FastAPI joins student_progress + subtopics together
        const response = await fetch(`${BACKEND_URL}/progress/${student.id}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.message);

        // Map backend data to UI shape
        const compiledData = result.data.progress.map(item => ({
          id: item.subtopic_id,
          name: item.subtopics?.title,
          groupNum: item.subtopics?.group_name?.includes('2') ? 2 : 1,
          level: item.current_level || 'Beginner',
          score: item.last_quiz_score ?? 0,
          sessions: item.total_sessions || 0
        }));

        setCombinedProgress(compiledData);
      } catch (err) {
        console.error("Progress fetch failed:", err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgressData();
  }, []);

  // ── Helper Style Utilities ──
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

  // ── Counter Metrics ──
  let beginnerCount = 0;
  let intermediateCount = 0;
  let advancedCount = 0;
  let totalSessions = 0;

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

        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Progress</h1>
          <p className={styles.studentSubtitle}>{studentName}&apos;s Learning Journey</p>
        </header>

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

        <div className={styles.overviewWrapper}>
          {renderGroupSection(1, "Alkali Metals (Group 1) Elements")}
          {renderGroupSection(2, "Alkaline Earth Metals (Group 2) Elements")}
        </div>

        <div className={styles.bottomActions}>
          <Link href="/dashboard" className={styles.btnPrimary}>
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}