// 1. We look for the completely lowercase file, but name the variable with a Capital Q!
import QuizForm from './quizform'; 
import styles from './quiz.module.css';

export default function QuizPage() {
  return (
    <main className={styles.container}>
      {/* Top Banner indicating current focused task */}
      <header className={styles.taskBanner}>
        <div className={styles.bannerContent}>
          <span className={styles.assessmentBadge}>Formative Quiz</span>
          <h1 className={styles.subtopicHeader}>Group Trends</h1>
        </div>
      </header>

      {/* Main Core Layout Grid */}
      <div className={styles.workspaceLayout}>
        {/* 2. Capitalized tag makes your editor linter completely happy! */}
        <QuizForm subtopicId="group-trends" /> 
      </div>
    </main>
  );
}