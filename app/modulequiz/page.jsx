"use client";

import DiagnosticForm from './modulequizForm'; // Adjust path if it lives in a nested sub-folder
import styles from './modulequiz.module.css';

export default function DiagnosticPage() {
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
           {/* 2. Capitalized tag makes your editor linter completely happy! */}
           <DiagnosticForm /> 
         </div>
       </main>
  );
}