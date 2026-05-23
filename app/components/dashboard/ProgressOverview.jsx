<<<<<<< HEAD
// components/ProgressOverview.js
'use client';

export default function ProgressOverview() {
  /* BACKEND CONNECTION: 
     Fetch the student's full list of 10 subtopics and their current levels.
     Example: const progressData = await fetchProgressSummary(student_id);
  */
 

  const subtopics = [
    { name: 'Group Trends', group: 1, level: 'Beginner', score: 35, sessions: 3 },
    { name: 'Atomic Radius', group: 1, level: 'Intermediate', score: 55, sessions: 2 },
    { name: 'Solubility', group: 2, level: 'Advanced', score: 85, sessions: 5 }
  ];

  const renderGroup = (groupNum) => (
    <div style={styles.groupContainer}>
      <h3 style={styles.groupHeading}>Group {groupNum} Elements</h3>
      {subtopics
        .filter(s => s.group === groupNum)
        .map((subtopic, index) => (
          <div key={index} style={styles.row}>
            <div style={styles.nameSection}>
              <span style={styles.subtopicName}>{subtopic.name}</span>
            </div>
            
            <div style={styles.progressSection}>
              <div style={styles.progressBarContainer}>
                <div style={{
                  ...styles.progressBarFill,
                  width: `${subtopic.score}%`,
                  backgroundColor: getLevelColor(subtopic.level)
                }} />
              </div>
            </div>

            <div style={styles.badgeSection}>
              <span style={getBadgeStyle(subtopic.level)}>{subtopic.level}</span>
            </div>

            <div style={styles.statsSection}>
              <span style={styles.statText}>Last: {subtopic.score}%</span>
              <span style={styles.statText}>Sessions: {subtopic.sessions}</span>
            </div>
          </div>
        ))}
    </div>
  );

  return (
    <div style={styles.overviewWrapper}>
      {renderGroup(1)}
      {renderGroup(2)}
    </div>
  );
}

// Helper to match the UI Specification for Level Badge Colors [cite: 50, 126]
const getLevelColor = (level) => {
  if (level === 'Beginner') return '#7F1D1D'; // Red fill 
  if (level === 'Intermediate') return '#92400E'; // Yellow fill 
  return '#065F46'; // Green fill 
};

const getBadgeStyle = (level) => {
  const base = { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' };
  if (level === 'Beginner') return { ...base, backgroundColor: '#FEF2F2', color: '#B91C1C' };
  if (level === 'Intermediate') return { ...base, backgroundColor: '#FFFBEB', color: '#92400E' };
  return { ...base, backgroundColor: '#ECFDF5', color: '#065F46' };
};

const styles = {
  overviewWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  groupHeading: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1A56DB', // Bold blue 
    marginBottom: '16px'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #E5E7EB',
    gap: '20px'
  },
  nameSection: { flex: '2' },
  subtopicName: { fontSize: '16px', fontWeight: 'medium', color: '#111827' },
  progressSection: { flex: '3' },
  progressBarContainer: {
    height: '8px',
    backgroundColor: '#E5E7EB',
    borderRadius: '4px',
    width: '100%'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  badgeSection: { flex: '1', textAlign: 'center' },
  statsSection: { 
    flex: '1.5', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'flex-end',
    gap: '2px'
  },
  statText: { fontSize: '12px', color: '#6B7280' }
};
=======
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
>>>>>>> 1aeca1be5e804b85d646b87891612e0e9c2b7d4e
