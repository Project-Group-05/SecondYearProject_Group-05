import Link from 'next/link';
import ResultsForm from './ResultsForm';
import styles from './ResultsPage.module.css';

export default function ResultsPage() {
  // --- BACKEND CONNECTION START ---
  // You will typically pull the latest quiz evaluation details here:
  // GET /quiz/results/latest?student_id=${localStorage.getItem('id')}
  // --- BACKEND CONNECTION END ---

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumbWrapper}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Return to Dashboard
        </Link>
      </div>

      <div className={styles.glassCard}>
        <ResultsForm />
      </div>
    </div>
  );
}