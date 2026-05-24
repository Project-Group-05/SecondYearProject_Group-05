'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client'; // Adjust this path if your utils folder changes
import styles from './studyplan.module.css';

export default function StudyPlanSection() {
  const router = useRouter();
  const supabase = createClient();

  const [subtopics, setSubtopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubtopicsAndLevels() {
      setIsLoading(true);
      try {
        // 1. Fetch active authentication context session profile tokens
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        // 2. Fetch all available structural subtopic datasets
        const { data: subtopicsData, error: subtopicsError } = await supabase
          .from('subtopics')
          .select('id, group_name, title, order_index')
          .order('order_index', { ascending: true });

        if (subtopicsError) throw subtopicsError;

        // 3. FETCH THE REAL CALCULATED LEVEL DATA FROM YOUR VIEW
        let levelsMap = {};
        if (user) {
          const { data: levelsData, error: levelsError } = await supabase
            .from('v_student_subtopic_levels')
            .select('subtopic_id, current_level')
            .eq('student_id', user.id);

          if (!levelsError && levelsData) {
            // Convert array rows instantly into an optimized lookup keymap mapping
            levelsData.forEach(row => {
              levelsMap[row.subtopic_id] = row.current_level;
            });
          }
        }

        // 4. Combine data blocks cleanly down the line
        const compiledCards = (subtopicsData || []).map(topic => {
          const trueLevel = levelsMap[topic.id] || 'Beginner'; // Defaults to Beginner if unattempted
          return {
            ...topic,
            level: trueLevel,
            ui: getLevelUIProperties(trueLevel) // Attach color codes instantly
          };
        });

        setSubtopics(compiledCards);
      } catch (err) {
        console.error("Error loading subtopic data matrix nodes:", err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubtopicsAndLevels();
  }, [supabase]);

  // 🟢 UPDATED UTILITY: Setting card palettes to specific clean Red, Yellow, and Green themes
  const getLevelUIProperties = (level) => {
    if (level === 'Advanced') {
      return { bg: '#F0FFF4', border: '#C6F6D5', text: '#22543D', label: 'Advanced' }; // 🟢 Smooth Light Green
    }
    if (level === 'Intermediate') {
      return { bg: '#FEFCBF', border: '#FAF089', text: '#744210', label: 'Intermediate' }; // 🟡 Smooth Light Yellow
    }
    return { bg: '#FFF5F5', border: '#FED7D7', text: '#742A2A', label: 'Beginner' }; // 🔴 Smooth Light Red
  };

  const handleStartSession = (topicId) => {
    router.push(`/webcam-check?taskId=${topicId}`);
  };

  if (isLoading) return <div className={styles.loadingText}>Loading study modules...</div>;
  if (!subtopics.length) return <div className={styles.loadingText}>No modules found in database.</div>;

  // Filter subtopics logically by group name
  const group1Cards = subtopics.filter(topic => topic.group_name === 'Group 1');
  const group2Cards = subtopics.filter(topic => topic.group_name === 'Group 2');
  const generalCards = subtopics.filter(topic => topic.group_name !== 'Group 1' && topic.group_name !== 'Group 2');

  const renderCardGrid = (cardsList) => (
    <div className={styles.grid}>
      {cardsList.map((topic) => (
        <div 
          key={topic.id} 
          className={styles.card}
          style={{ 
            backgroundColor: topic.ui.bg, 
            borderColor: topic.ui.border,
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <div className={styles.cardHeader}>
            <span className={styles.groupBadge}>{topic.group_name || 'General'}</span>
            <span 
              style={{ 
                fontSize: '11px', 
                fontWeight: '700', 
                color: topic.ui.text,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              • {topic.ui.label}
            </span>
          </div>

          <h3 className={styles.cardTitle}>{topic.title}</h3>
          
          <button 
            className={styles.btnPrimary} 
            onClick={() => handleStartSession(topic.id)}
          >
            Start Session →
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      
      {/* Group 1 Section */}
      {group1Cards.length > 0 && (
        <div className={styles.sectionZone}>
          <h2 className={styles.sectionHeader}>Alkali Metals (Group 1)</h2>
          {renderCardGrid(group1Cards)}
        </div>
      )}

      {/* Group 2 Section */}
      {group2Cards.length > 0 && (
        <div className={styles.sectionZone}>
          <h2 className={styles.sectionHeader}>Alkaline Earth Metals (Group 2)</h2>
          {renderCardGrid(group2Cards)}
        </div>
      )}

      {/* General Fallback Section */}
      {generalCards.length > 0 && (
        <div className={styles.sectionZone}>
          {renderCardGrid(generalCards)}
        </div>
      )}

    </div>
  );
}