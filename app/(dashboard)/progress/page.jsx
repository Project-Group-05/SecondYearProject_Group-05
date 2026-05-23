"use client";

import React, { useState, useEffect } from 'react';
import styles from './progress.module.css';

export default function ProgressPage() {
  // State for user progress data
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    /* BACKEND CONNECTION POINT:
       Replace this mockData with a fetch request to your API.
       Example: 
       fetch('/api/user/progress').then(res => res.json()).then(data => setUserData(data))
    */
    const mockData = {
      name: "Student",
      overallProgress: 65,
      completedTopics: 4,
      totalTopics: 10,
      recentActivity: [
        { topic: "Atomic Radius", score: 85, date: "2026-04-05" },
        { topic: "Ionization Energy", score: 62, date: "2026-04-06" },
        { topic: "Oxides", score: 45, date: "2026-04-07" }
      ]
    };
    setUserData(mockData);
  }, []);

  if (!userData) return <div className={styles.loading}>Loading Progress...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Learning Progress</h1>
        <p className={styles.subtitle}>Track your mastery of s-block elements</p>
      </header>

      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Overall Mastery</span>
          <div className={styles.progressCircle}>
            <span className={styles.percentage}>{userData.overallProgress}%</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Topics Completed</span>
          <h2 className={styles.statValue}>{userData.completedTopics} / {userData.totalTopics}</h2>
          <div className={styles.progressBarBase}>
            <div 
              className={styles.progressBarFill} 
              style={{ width: `${(userData.completedTopics / userData.totalTopics) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className={styles.activitySection}>
        <h3 className={styles.sectionTitle}>Recent Diagnostic Performance</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Topic</th>
              <th>Score</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {userData.recentActivity.map((item, index) => (
              <tr key={index}>
                <td className={styles.topicName}>{item.topic}</td>
                <td>{item.score}%</td>
                <td>{item.date}</td>
                <td>
                  <span className={item.score >= 75 ? styles.statusHigh : styles.statusLow}>
                    {item.score >= 75 ? 'Mastered' : 'Needs Review'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}