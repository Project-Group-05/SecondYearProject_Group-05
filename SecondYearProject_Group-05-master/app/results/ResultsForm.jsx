"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './ResultsPage.module.css';

export default function ResultsForm() {
  // Mocking the assessment payload evaluation engine response
  const [scoreSummary] = useState({
    subtopic: "Group Trends",
    totalQuestions: 5,
    correctAnswers: 4,
    percentage: 80,
    performanceLevel: "Advanced", // Beginner, Intermediate, Advanced
    feedbackMessage: "Excellent work! You have clearly mastered the structural trends and shielding behaviors of Group 1 elements."
  });

  const [recommendedRoute, setRecommendedRoute] = useState('/dashboard');

  useEffect(() => {
    // Dynamic adaptive logic based on scoring threshold metrics
    if (scoreSummary.percentage < 50) {
      setRecommendedRoute('/study'); // Send back to review material
    } else {
      setRecommendedRoute('/dashboard'); // Advance to dashboard map grid
    }
  }, [scoreSummary.percentage]);

  const handleActionProceed = (e) => {
    e.preventDefault();
    window.location.href = recommendedRoute;
  };

  // Assign distinct level badge styling color variants matching design standards
  const getLevelBadgeClass = (lvl) => {
    if (lvl === 'Beginner') return styles.badgeBeginner;
    if (lvl === 'Intermediate') return styles.badgeIntermediate;
    return styles.badgeAdvanced;
  };

  return (
    <form className={styles.form} onSubmit={handleActionProceed}>
      <div className={styles.header}>
        <div className={styles.metaBadgeRow}>
          <span className={styles.groupBadge}>{scoreSummary.subtopic}</span>
          <span className={`${styles.levelBadge} ${getLevelBadgeClass(scoreSummary.performanceLevel)}`}>
            Status: {scoreSummary.performanceLevel}
          </span>
        </div>
        <h1 className={styles.appNameText}>Performance Scorecard</h1>
      </div>

      <div className={styles.scoreVisualCenter}>
        <div className={styles.scoreCircle}>
          <span className={styles.hugeScoreNum}>{scoreSummary.percentage}%</span>
          <span className={styles.scoreLabel}>Final Mark</span>
        </div>
      </div>

      <div className={styles.contentBodyArea}>
        <div className={styles.statsOverviewRow}>
          <div className={styles.statBoxCard}>
            <span className={styles.statValueText}>{scoreSummary.totalQuestions}</span>
            <span className={styles.statLabelText}>Total Tasks</span>
          </div>
          <div className={styles.statBoxCardSuccess}>
            <span className={styles.statValueTextCorrect}>{scoreSummary.correctAnswers}</span>
            <span className={styles.statLabelText}>Correct</span>
          </div>
          <div className={styles.statBoxCardDanger}>
            <span className={styles.statValueTextIncorrect}>
              {scoreSummary.totalQuestions - scoreSummary.correctAnswers}
            </span>
            <span className={styles.statLabelText}>Incorrect</span>
          </div>
        </div>

        <p className={styles.paragraphText}>
          {scoreSummary.feedbackMessage}
        </p>
      </div>

      <button type="submit" className={styles.registerBtn}>
        {scoreSummary.percentage < 50 ? "Review Study Module Again" : "Continue to Next Subtopic →"}
      </button>

      <div className={styles.footer}>
        <p>Want to check detailed breakdowns? <Link href="/progress">View Analytics Profile</Link></p>
      </div>
    </form>
  );
}
