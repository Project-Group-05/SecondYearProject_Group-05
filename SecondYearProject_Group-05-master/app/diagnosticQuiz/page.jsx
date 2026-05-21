import DiagnosticForm from '@/components/quiz/DiagnosticForm';
import styles from './diagnostic.module.css';

export default function DiagnosticPage() {
  // --- BACKEND CONNECTION START ---
  // Optional server-side data pre-fetching:
  // Fetch initial quiz configuration or eligibility rules if needed.
  // --- BACKEND CONNECTION END ---

  return (
    <main className={styles.container}>
      <div className={styles.quizWrapper}>
        <header className={styles.quizHeader}>
          <h1 className={styles.title}>Chemistry Diagnostic Assessment</h1>
          <p className={styles.subtitle}>
            Answer the following questions carefully. This baseline assessment evaluates your understanding of Group 1 and Group 2 element trends.
          </p>
        </header>

        {/* Client-side form for quiz interaction */}
        <DiagnosticForm />
      </div>
    </main>
  );
}