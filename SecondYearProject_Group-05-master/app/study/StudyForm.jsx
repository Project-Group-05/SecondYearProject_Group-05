"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from './StudyPage.module.css'; // FIXED: Points directly to sibling stylesheet

export default function StudyForm() {
  const [currentStep, setCurrentStep] = useState(0);
  
  const studySteps = [
    {
      title: "Group Trends Overview",
      badge: "Concept 1 of 3",
      body: "Chemical elements in Group 1 (Alkali Metals) exhibit sharp structural and chemical trends down the column. As atomic number increases, a new primary electron shell is added to each subsequent element.",
      callout: "Key Point: Adding electron shells directly affects both physical size and ionization patterns."
    },
    {
      title: "Atomic Radius & Shielding",
      badge: "Concept 2 of 3",
      body: "Because outer valence electrons inhabit shells progressively further from the nucleus, the atomic radius increases down the group. Increased inner-shell shielding weakens the electrostatic attraction on the single outer electron.",
      callout: "Observation: This structural configuration is why density generally increases down the column."
    },
    {
      title: "Reactivity Profiles",
      badge: "Concept 3 of 3",
      body: "Due to the weak hold on the outer valence shell, ionization energy decreases down the group. Consequently, chemical reactivity with air and water increases dramatically from Lithium down to Caesium.",
      callout: "Safety Warning: Group 1 elements react violently with atmospheric moisture and must be preserved in protective mineral oil."
    }
  ];

  const activeContent = studySteps[currentStep];
  const isLastStep = currentStep === studySteps.length - 1;

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
    } else {
      // --- BACKEND CONNECTION START ---
      // POST /study/complete-log
      // Payload: { student_id: localStorage.getItem('id'), current_track: 'Group 1' }
      // --- BACKEND CONNECTION END ---
      
      window.location.href = '/quiz'; 
    }
  };

  return (
    <form className={styles.form} onSubmit={handleNextStep}>
      <div className={styles.header}>
        <div className={styles.metaBadgeRow}>
          <span className={styles.groupBadge}>Group 1 Elements</span>
          <span className={styles.levelBadge}>{activeContent.badge}</span>
        </div>
        <h1 className={styles.appNameText}>{activeContent.title}</h1>
      </div>

      <div className={styles.contentBodyArea}>
        <p className={styles.paragraphText}>
          {activeContent.body}
        </p>
        
        <blockquote className={styles.calloutBlock}>
          {activeContent.callout}
        </blockquote>
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