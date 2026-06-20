"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from './StudyPage.module.css';

export default function StudyForm({ content }) {
  const handleFinish = (e) => {
    e.preventDefault();
    // POST /study/complete-log
    window.location.href = '/modulequiz';
  };

  return (
    <form className={styles.form} onSubmit={handleFinish}>
      <div className={styles.header}>
        <div className={styles.metaBadgeRow}>
          <span className={styles.groupBadge}>{content.group_name}</span>
          <span className={styles.levelBadge}>{content.level}</span>
        </div>
        <h1 className={styles.appNameText}>{content.subtopic_title}</h1>
      </div>

      <div className={styles.contentBodyArea}>
        <p className={styles.paragraphText}>
          {content.body}
        </p>
      </div>

      <button type="submit" className={styles.registerBtn}>
        Proceed to Assessment Quiz →
      </button>

      <div className={styles.footer}>
        <p className={styles.helpText}>Stuck on this topic? <Link href="/dashboard">Return Home</Link></p>
      </div>
    </form>
  );
}