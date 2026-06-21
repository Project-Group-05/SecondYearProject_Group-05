"use client";

import React from 'react';
import QuizForm from './quizform'; 
import styles from './quiz.module.css';

export default function QuizPage() {
  return (
    <main className={styles.container}>
      {/* Top Banner indicating current focused task */}
      <header className={styles.taskBanner}>
        <div className={styles.bannerContent}>
          <span className={styles.assessmentBadge}>Evaluation Test</span>
          <h1 className={styles.appNameText}>Edu<span className={styles.logoAccent}>FX</span></h1>
        </div>
      </header>

      {/* Main Core Layout Grid */}
      <div className={styles.workspaceLayout}>
        <QuizForm /> 
      </div>
    </main>
  );
}