// components/StudyPlanSection.js
'use client';

export default function StudyPlanSection() {
  // Mock data representing subtopics assigned by the scheduler [cite: 133]
  const tasks = [
    { id: 1, title: 'Group Trends', group: 'Group 1', level: 'Beginner', type: 'Weak Area', overdue: true },
    { id: 2, title: 'Solubility', group: 'Group 2', level: 'Intermediate', type: 'Maintenance', overdue: false },
  ];

  return (
    <div style={styles.grid}>
      {tasks.map((task) => (
        <div key={task.id} style={{
          ...styles.card,
          borderLeft: `6px solid ${task.level === 'Beginner' ? '#7F1D1D' : '#065F46'}`
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
          <button style={styles.btnPrimary}>Start Session →</button>
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
