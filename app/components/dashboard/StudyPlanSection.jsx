'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './studyplan.module.css';

const BACKEND_URL = "http://127.0.0.1:8000";

export default function StudyPlanSection() {
  const router = useRouter();
  const [subtopics, setSubtopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubtopicsAndLevels() {
      setIsLoading(true);
      try {
        const raw = localStorage.getItem("student");
if (!raw) {
  console.error("No student session found.");
  setIsLoading(false);
  return;
}
const student = JSON.parse(raw);

        const response = await fetch(`${BACKEND_URL}/progress/${student.id}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.message);

        const compiledCards = result.data.progress.map(item => {
          const level = item.current_level || 'Beginner';
          return {
            id: item.subtopic_id,
            title: item.subtopics?.title,
            group_name: item.subtopics?.group_name,
            level,
            ui: getLevelUIProperties(level)
          };
        });

        setSubtopics(compiledCards);
      } catch (err) {
        console.error("Study plan fetch failed:", err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubtopicsAndLevels();
  }, []);

  const getLevelUIProperties = (level) => {
    if (level === 'Advanced') {
      return { bg: '#F0FFF4', border: '#C6F6D5', text: '#22543D', label: 'Advanced' };
    }
    if (level === 'Intermediate') {
      return { bg: '#FEFCBF', border: '#FAF089', text: '#744210', label: 'Intermediate' };
    }
    return { bg: '#FFF5F5', border: '#FED7D7', text: '#742A2A', label: 'Beginner' };
  };

  const handleStartSession = (topicId) => {
    router.push(`/webcam-check?taskId=${topicId}`);
  };

  if (isLoading) return <div className={styles.loadingText}>Loading study modules...</div>;
  if (!subtopics.length) return <div className={styles.loadingText}>No modules found.</div>;

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

      {group1Cards.length > 0 && (
        <div className={styles.sectionZone}>
          <h2 className={styles.sectionHeader}>Alkali Metals (Group 1)</h2>
          {renderCardGrid(group1Cards)}
        </div>
      )}

      {group2Cards.length > 0 && (
        <div className={styles.sectionZone}>
          <h2 className={styles.sectionHeader}>Alkaline Earth Metals (Group 2)</h2>
          {renderCardGrid(group2Cards)}
        </div>
      )}

      {generalCards.length > 0 && (
        <div className={styles.sectionZone}>
          {renderCardGrid(generalCards)}
        </div>
      )}

    </div>
  );
}