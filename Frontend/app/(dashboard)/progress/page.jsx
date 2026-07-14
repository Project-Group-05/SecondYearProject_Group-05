"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./progress.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function ProgressPage() {
  const [studentName, setStudentName] = useState("");
  const [combinedProgress, setCombinedProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Behavior Report States
  const [activeTab, setActiveTab] = useState("progress"); // 'progress' | 'behaviour'
  const [behaviourReport, setBehaviourReport] = useState(null);
  const [isBehaviourLoading, setIsBehaviourLoading] = useState(false);

  useEffect(() => {
    const student = JSON.parse(localStorage.getItem("student"));
    if (student?.name) setStudentName(student.name);

    async function fetchProgressData() {
      setIsLoading(true);
      try {
        if (!student?.id) throw new Error("No student session found.");

        const response = await fetch(`${BACKEND_URL}/progress/${student.id}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.message);

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

  // Fetch Behavior Report when switching to the behavior tab
  useEffect(() => {
    if (activeTab !== "behaviour" || behaviourReport) return;

    const student = JSON.parse(localStorage.getItem("student"));
    async function fetchBehaviourReport() {
      setIsBehaviourLoading(true);
      try {
        if (!student?.id) throw new Error("No student session found.");

        const response = await fetch(`${BACKEND_URL}/behaviour/report/${student.id}`);
        const result = await response.json();

        if (result.success) {
          setBehaviourReport(result.data);
        }
      } catch (err) {
        console.error("Behavior report fetch failed:", err.message);
      } finally {
        setIsBehaviourLoading(false);
      }
    }

    fetchBehaviourReport();
  }, [activeTab, behaviourReport]);

  // Helper Style Utilities
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

  const getFocusBadgeColor = (score) => {
    if (score >= 85) return styles.fillNormal;
    if (score >= 50) return styles.fillWarning;
    return styles.fillDanger;
  };

  // Counter Metrics for Progress Profile
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

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>

        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Progress</h1>
          <p className={styles.studentSubtitle}>{studentName}&apos;s Learning Journey</p>
        </header>

        {/* Tab Controls Row */}
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'progress' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            📊 Progress Profile
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'behaviour' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('behaviour')}
          >
            🛡️ Cognitive Behavior Report
          </button>
        </div>

        {isLoading ? (
          <div className={styles.statusLabel}>Syncing platform analytics profiles...</div>
        ) : activeTab === 'progress' ? (
          /* ==================== PROGRESS PROFILE TAB ==================== */
          <>
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
          </>
        ) : (
          /* ==================== COGNITIVE BEHAVIOR REPORT TAB ==================== */
          <div className={styles.behaviorReport}>
            {isBehaviourLoading ? (
              <div className={styles.statusLabel}>Gathering frame-analysis proctor streams...</div>
            ) : !behaviourReport || behaviourReport.sessions.length === 0 ? (
              <div className={styles.noSessionsContainer}>
                <span className={styles.noSessionsIcon}>🔒</span>
                <span className={styles.noSessionsTitle}>No Proctored Session Data Found</span>
                <span>Complete a personalized study module or assessment quiz with your webcam enabled to build your report.</span>
              </div>
            ) : (
              <>
                {/* Summary Scoreboard metrics */}
                <div className={styles.summaryRow}>
                  <div className={styles.summaryCard}>
                    <span className={styles.cardIcon}>🧠</span>
                    <div className={styles.cardInfo}>
                      <span className={styles.cardVal}>{behaviourReport.overall_focus_average}%</span>
                      <span className={styles.cardLabel}>Average Focus</span>
                    </div>
                  </div>

                  <div className={`${styles.summaryCard} ${behaviourReport.phone_warning_count > 0 ? styles.warningCardRed : ''}`}>
                    <span className={styles.cardIcon}>📱</span>
                    <div className={styles.cardInfo}>
                      <span className={styles.cardVal}>{behaviourReport.phone_warning_count}</span>
                      <span className={styles.cardLabel}>Phone Warnings</span>
                    </div>
                  </div>

                  <div className={`${styles.summaryCard} ${behaviourReport.absence_warning_count > 0 ? styles.warningCardYellow : ''}`}>
                    <span className={styles.cardIcon}>👤</span>
                    <div className={styles.cardInfo}>
                      <span className={styles.cardVal}>{behaviourReport.absence_warning_count}</span>
                      <span className={styles.cardLabel}>Away Warnings</span>
                    </div>
                  </div>
                </div>

                {/* List of proctored study / quiz sessions */}
                <div className={styles.sessionsList}>
                  <h2 className={styles.groupHeading}>Session Behavior Logs</h2>

                  {behaviourReport.sessions.map((session) => (
                    <div key={session.session_id} className={styles.sessionProctorCard}>
                      <div className={styles.sessionHeader}>
                        <div className={styles.sessionTitleMeta}>
                          <span className={styles.sessionTitleText}>{session.subtopic_name}</span>
                          <span className={styles.sessionDateText}>Session Date: {session.date}</span>
                        </div>

                        <div className={styles.focusScoreBox}>
                          <span className={styles.cardLabel}>Focus Grade:</span>
                          <span className={`${styles.badgeBase} ${getLevelColorClass(
                            session.focus_score >= 85 ? 'Advanced' : session.focus_score >= 50 ? 'Intermediate' : 'Beginner'
                          )}`}>
                            {session.focus_score}%
                          </span>
                        </div>
                      </div>

                      {/* Proctor metrics details */}
                      <div className={styles.proctorMetricsGrid}>
                        {/* Device check metric */}
                        <div className={styles.metricColumn}>
                          <span className={styles.metricName}>Device Distraction</span>
                          <div className={styles.metricValueRow}>
                            <div className={styles.metricValueBar}>
                              <div
                                className={styles.metricValueFill}
                                style={{
                                  width: `${session.phone_percent}%`,
                                  backgroundColor: session.phone_percent > 10 ? '#ef4444' : session.phone_percent > 2 ? '#f59e0b' : '#10b981'
                                }}
                              />
                            </div>
                            <span className={styles.metricPercentText}>{session.phone_percent}%</span>
                          </div>
                        </div>

                        {/* Absence check metric */}
                        <div className={styles.metricColumn}>
                          <span className={styles.metricName}>Student Absence</span>
                          <div className={styles.metricValueRow}>
                            <div className={styles.metricValueBar}>
                              <div
                                className={styles.metricValueFill}
                                style={{
                                  width: `${session.absent_percent}%`,
                                  backgroundColor: session.absent_percent > 20 ? '#ef4444' : session.absent_percent > 5 ? '#f59e0b' : '#10b981'
                                }}
                              />
                            </div>
                            <span className={styles.metricPercentText}>{session.absent_percent}%</span>
                          </div>
                        </div>

                        {/* Proctoring integrity verdict */}
                        <div className={styles.metricColumn}>
                          <span className={styles.metricName}>Integrity Verdict</span>
                          <div style={{ display: 'flex', alignItems: 'center', height: '24px' }}>
                            <span style={{
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              color: session.focus_score >= 85 ? '#10b981' : session.focus_score >= 50 ? '#d97706' : '#ef4444'
                            }}>
                              {session.focus_score >= 85 ? '🟢 Excellent Integrity' : session.focus_score >= 50 ? '🟡 Distraction Alert' : '🔴 Focus Integrity Risk'}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className={styles.bottomActions}>
          <Link href="/dashboard" className={styles.btnPrimary}>
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}