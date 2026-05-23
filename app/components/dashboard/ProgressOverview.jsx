'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../utils/supabase/client'; // Adjust this relative path if necessary
import styles from './progressoverview.module.css';

export default function ProgressOverview() {
  const supabase = createClient();
  const [combinedProgress, setCombinedProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProgressData() {
      setIsLoading(true);
      // Add this line temporarily inside your fetchProgressData function right below: const { data: { user } } = ...

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

        // 4. Group row records into an map lookup object by subtopic_id
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
            // Extracts string values: 'Group 1' or 'Group 2' -> maps to pure numbers 1 or 2
            groupNum: topic.group_name?.includes('2') ? 2 : 1, 
            level: userProgress?.current_level || 'Beginner', // Empty fallback defaults
            score: userProgress?.last_quiz_score !== undefined ? userProgress.last_quiz_score : 0, // 0% if empty
            sessions: userProgress?.total_sessions || 0 // 0 sessions if empty
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
