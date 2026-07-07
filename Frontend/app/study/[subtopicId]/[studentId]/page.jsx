// StudyPage.jsx
import StudyForm from './StudyForm';
import styles from './StudyPage.module.css';

export default async function StudyPage({ params }) {
  const { subtopicId, studentId } = await params; // ← must await in Next.js 16

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumbWrapper}>
        <a href="/dashboard" className={styles.backLink}>← Quit to Dashboard</a>
      </div>

      <div className={styles.glassCard}>
        <StudyForm subtopicId={subtopicId} studentId={studentId} />
      </div>
    </div>
  );
}