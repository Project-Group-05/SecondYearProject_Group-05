// StudyPage.jsx
import StudyForm from './StudyForm';
import styles from './StudyPage.module.css';

async function getContent(subtopicId, studentId) {
  const res = await fetch(`http://localhost:8000/content/${subtopicId}/${studentId}`, {
    cache: 'no-store'
  });
   if (!res.ok) {
    console.error("Failed to fetch content:", res.status);
    return null;
  }
  const json = await res.json();
  console.log("API response:", json);
  return json.data;
}

export default async function StudyPage({ params }) {
  const { subtopicId, studentId } = await params; // ← must await in Next.js 16

  const content = await getContent(subtopicId, studentId);

  if (!content) {
    return (
      <div className={styles.container}>
        <p>No content available for subtopic {subtopicId}, student {studentId}.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumbWrapper}>
        <a href="/dashboard" className={styles.backLink}>← Quit to Dashboard</a>
      </div>

      <div className={styles.glassCard}>
        <StudyForm content={content} />
      </div>
    </div>
  );
}