import Link from 'next/link';
import StudyForm from './StudyForm'; // Imports from the same folder
import styles from './StudyPage.module.css';

export default function StudyPage() {
  const subtopicTitle = "Group Trends"; 

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumbWrapper}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Quit to Dashboard
        </Link>
      </div>

      <div className={styles.glassCard}>
        {/* The interactive content cycle handles rendering inside the form */}
        <StudyForm />
      </div>
    </div>
  );
}