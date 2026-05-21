'use client';

import { useRouter } from 'next/navigation';

export default function StudyPlanSection() {
  const router = useRouter();

  // Enriched mock data matching your state fields
  const tasks = [
    { id: 1, title: 'Group Trends of Group 1 Elements', group: 'Group 1', level: 'Beginner', type: 'Weak Area', overdue: true },
    { id: 2, title: 'Reactions of Group 1 Elements', group: 'Group 1', level: 'Intermediate', type: 'Revision', overdue: false },
    { id: 3, title: 'Thermal Stability of Group 1 Salts', group: 'Group 1', level: 'Advanced', type: 'Revision', overdue: false },
    { id: 4, title: 'Solubility of Group 1 Salts', group: 'Group 1', level: 'Intermediate', type: 'Weak Area', overdue: false },
    { id: 5, title: 'Flame Test of Group 1 Elements', group: 'Group 1', level: 'Beginner', type: 'Weak Area', overdue: true },
    { id: 6, title: 'Group Trends of Group 2 Elements', group: 'Group 2', level: 'Intermediate', type: 'Revision', overdue: false },
    { id: 7, title: 'Reactions of Group 2 Elements', group: 'Group 2', level: 'Advanced', type: 'Revision', overdue: false },
    { id: 8, title: 'Thermal Stability of Group 2 Salts', group: 'Group 2', level: 'Beginner', type: 'Weak Area', overdue: false },
    { id: 9, title: 'Solubility of Group 2 Salts', group: 'Group 2', level: 'Intermediate', type: 'Revision', overdue: false },
    { id: 10, title: 'Flame Test of Group 2 Elements', group: 'Group 2', level: 'Advanced', type: 'Revision', overdue: false }
  ];

  const handleStartSession = (task) => {
    // Navigates directly to your webcam verification screen with the specific taskId
    router.push( `/webcam-check?taskId=${task.id}`);
  };

  return (
    <div style={styles.grid}>
      {tasks.map((task) => (
        <div key={task.id} style={{
          ...styles.card,
          borderLeft: `6px solid #1A2B5F`
        }}>
          <div style={styles.cardHeader}>
            <span style={styles.groupBadge}>{task.group}</span>
            {task.overdue && <span style={styles.overdueBadge}>OVERDUE</span>}
          </div>
          <h3 style={styles.cardTitle}>{task.title}</h3>
          <div style={styles.badgeRow}>
            <span style={getBadgeStyle(task.level)}>{task.level}</span>
          </div>
          <p style={styles.typeLabel}>{task.type === 'Weak Area' ? '⚠ ' : '✓ '}{task.type}</p>
          <button style={styles.btnPrimary} onClick={() => handleStartSession(task)}>Start Session →</button>
        </div>
      ))}
    </div>
  );
}

const getBadgeStyle = (level) => {
  const base = { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' };
  if (level === 'Beginner') return { ...base, backgroundColor: '#FEF2F2', color: '#7F1D1D' };
  if (level === 'Intermediate') return { ...base, backgroundColor: '#FFFBEB', color: '#92400E' };
  return { ...base, backgroundColor: '#ECFDF5', color: '#065F46' };
};

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: {
    backgroundColor: '#FFFFFF',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between' },
  groupBadge: { backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' },
  overdueBadge: { backgroundColor: '#7F1D1D', color: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' },
  cardTitle: { fontSize: '20px', fontWeight: 'semibold', margin: 0 },
  badgeRow: { display: 'flex', gap: '4px' },
  typeLabel: { fontSize: '14px', color: '#6B7280', margin: 0 },
  btnPrimary: {
    backgroundColor: '#1A2B5F',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '8px'
  }
};