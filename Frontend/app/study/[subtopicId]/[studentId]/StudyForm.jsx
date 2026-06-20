"use client";

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './StudyPage.module.css';
import { parseSections } from './parseContent';


export default function StudyForm({ content }) {
  const studySteps = parseSections(content.body);
  const [currentStep, setCurrentStep] = useState(0);

  const activeContent = studySteps[currentStep];
  const isLastStep = currentStep === studySteps.length - 1;

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
    } else {
      window.location.href = '/modulequiz';
    }
  };

  return (
    <form className={styles.form} onSubmit={handleNextStep}>
      <div className={styles.header}>
        <div className={styles.metaBadgeRow}>
          <span className={styles.groupBadge}>{content.group_name}</span>
          <span className={styles.levelBadge}>{activeContent.badge}</span>
        </div>
        <h1 className={styles.appNameText}>{activeContent.title}</h1>
      </div>

      <div className={styles.contentBodyArea}>
        <div className={styles.paragraphText}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {activeContent.body}
          </ReactMarkdown>
        </div>
      </div>

      <div className={styles.progressBarWrapper}>
        <div
          className={styles.progressBarFill}
          style={{ width: `${((currentStep + 1) / studySteps.length) * 100}%` }}
        ></div>
      </div>

      <button type="submit" className={styles.registerBtn}>
        {isLastStep ? "Proceed to Assessment Quiz →" : "Next Concept →"}
      </button>

      <div className={styles.footer}>
        {currentStep > 0 && (
          <button
            type="button"
            className={styles.backButtonInline}
            onClick={() => setCurrentStep(prev => prev - 1)}
          >
            ← Previous Section
          </button>
        )}
        <p className={styles.helpText}>Stuck on this topic? <Link href="/dashboard">Return Home</Link></p>
      </div>
    </form>
  );
}