// app/dashboard/page.js

import StudyPlanSection from '../../components/dashboard/StudyPlanSection';
import ProgressOverview from '../../components/dashboard/ProgressOverview';

export default function DashboardPage() {
  /* BACKEND CONNECTION: 
     Fetch student dashboard data here using a Server Action or fetch().
     Example: const data = await fetchDashboardData(student_id);
  */

  return (
    <div style={styles.dashboardContainer}>
      
      
      <main style={styles.mainContent}>
        <section>
          <div style={styles.headerGroup}>
            <h1 style={styles.pageTitle}>Today's Study Plan</h1>
            <p style={styles.subtitle}>Saturday, April 11, 2026</p> 
          </div>
          <StudyPlanSection />
        </section>

        <hr style={styles.divider} />

        <section>
          <div style={styles.headerGroupRow}>
            <h2 style={styles.sectionTitle}>Your Progress Overview</h2>
            <button style={styles.btnSecondarySmall}>View Full Progress</button>
          </div>
          <ProgressOverview />
        </section>
      </main>
    </div>
  );
}

const styles = {
  dashboardContainer: {
    backgroundColor: '#F9FAFB', // neutral background [cite: 7]
    minHeight: '100vh',
    fontFamily: 'sans-serif',
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  headerGroup: { marginBottom: '24px' },
  headerGroupRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: '24px' 
  },
  pageTitle: { fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }, // 
  sectionTitle: { fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }, // 
  subtitle: { fontSize: '16px', color: '#6B7280', marginTop: '4px' },
  divider: { border: 'none', height: '1px', backgroundColor: '#E5E7EB', margin: '40px 0' },
  btnSecondarySmall: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #1A2B5F',
    color: '#1A2B5F',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};
