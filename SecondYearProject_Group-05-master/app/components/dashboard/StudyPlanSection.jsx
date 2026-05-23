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
    async function fetchSubtopics() {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('subtopics')
        .select('id, group_name, title, order_index')
        .order('order_index', { ascending: true });

      if (!error && data) {
        setSubtopics(data);
      } else {
        console.error("Error loading subtopic dataset nodes:", error?.message);
      }
      setIsLoading(false);
    }

    fetchSubtopics();
  }, []);

  const handleStartSession = (topicId) => {
    router.push(`/webcam-check?taskId=${topicId}`);
  };

  if (isLoading ) return <div className={styles.loadingText}>Loading study modules...</div>;
  if (!subtopics.length) return <div className={styles.loadingText}>No modules found in database.</div>;

  // Filter subtopics logically by group name
  const group1Cards = subtopics.filter(topic => topic.group_name === 'Group 1');
  const group2Cards = subtopics.filter(topic => topic.group_name === 'Group 2');
  const generalCards = subtopics.filter(topic => topic.group_name !== 'Group 1' && topic.group_name !== 'Group 2');

  const renderCardGrid = (cardsList) => (
    <div className={styles.grid}>
      {cardsList.map((topic) => (
        <div key={topic.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.groupBadge}>{topic.group_name || 'General'}</span>
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