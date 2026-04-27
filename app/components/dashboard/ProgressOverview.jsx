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
