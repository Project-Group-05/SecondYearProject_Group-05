'use client';

import { useEffect, useState } from 'react';
import styles from './progressoverview.module.css';

const BACKEND_URL = "http://127.0.0.1:8000";

export default function ProgressOverview() {
  
  const [combinedProgress, setCombinedProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  async function fetchProgressData() {
    setIsLoading(true);
    try {
      const raw = localStorage.getItem("student");
      if (!raw) {
        console.error("No student session found.");
        setIsLoading(false);
        return;
      }
      const student = JSON.parse(raw);
      if (!student?.id) {
        setIsLoading(false);
        return;
      }

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

  const renderGroupSection = (targetGroup) => {
    const groupItems = combinedProgress
      .filter(item => item.groupNum === targetGroup)
      .slice(0, 2);

    if (groupItems.length === 0) return null;

    return (
      <div className={styles.groupContainer}>
        <h3 className={styles.groupHeading}>Group {targetGroup} Elements</h3>
        
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

  if (isLoading) return <div className={styles.statusLabel}>Syncing structural data frames...</div>;

  return (
    <div className={styles.overviewWrapper}>
      {renderGroupSection(1)}
      {renderGroupSection(2)}
    </div>
  );
}
