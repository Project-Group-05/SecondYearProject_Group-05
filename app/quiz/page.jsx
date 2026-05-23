<<<<<<< HEAD
"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QuizForm from './quizform'; 
import styles from './quiz.module.css';

function QuizPageContent() {
  const searchParams = useSearchParams();
  
  // Captures the dynamic task or subtopic ID parameter passed from the webcam screen
  const targetSubtopic = searchParams.get('subtopicId') || 'group-trends';

  // Helper mapping helper to convert database IDs into human-readable headers
  const getTopicHeaderTitle = (id) => {
    const routingMap = {
      '1': 'Group Trends of Group 1 Elements',
      '2': 'Reactions of Group 1 Elements',
      '3': 'Thermal Stability of Group 1 Salts',
      '4': 'Solubility of Group 1 Salts',
      '5': 'Flame Test of Group 1 Elements',
      '6': 'Group Trends of Group 2 Elements',
      '7': 'Reactions of Group 2 Elements',
      '8': 'Thermal Stability of Group 2 Salts',
      '9': 'Solubility of Group 2 Salts',
      '10': 'Flame Test of Group 2 Elements',
    };
    return routingMap[id] || 'Inorganic Chemistry Evaluation';
  };

  return (
    <main className={styles.container}>
      {/* Top Banner indicating current focused task dynamically */}
      <header className={styles.taskBanner}>
        <div className={styles.bannerContent}>
          <span className={styles.assessmentBadge}>Formative Quiz</span>
          <h1 className={styles.subtopicHeader}>{getTopicHeaderTitle(targetSubtopic)}</h1>
        </div>
      </header>

      {/* Main Core Layout Grid */}
      <div className={styles.workspaceLayout}>
        <QuizForm subtopicId={targetSubtopic} /> 
      </div>
    </main>
  );
}

// Wrapped with a Suspense Boundary to prevent Next.js layout compilation issues
export default function QuizPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading evaluation framework...</div>}>
      <QuizPageContent />
    </Suspense>
  );
=======
import DiagnosticForm from './DiagnosticForm';
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
>>>>>>> 1aeca1be5e804b85d646b87891612e0e9c2b7d4e
}