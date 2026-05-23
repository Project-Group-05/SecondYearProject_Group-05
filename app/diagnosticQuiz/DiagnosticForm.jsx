"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/diagnostic/diagnostic.module.css';

export default function DiagnosticForm() {
  const router = useRouter();

  // Mock array matching data structures specified in your educational logic definitions
  const questions = [
    {
      id: 1,
      text: "Which of the following elements has the lowest first ionization energy?",
      options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Rubidium (Rb)"],
      correctIndex: 3
    },
    {
      id: 2,
      text: "What product is formed when an alkali metal reacts vigorously with water?",
      options: ["Metal Oxide + Hydrogen", "Metal Hydroxide + Hydrogen", "Metal Hydride + Oxygen", "Metal Oxide + Oxygen"],
      correctIndex: 1
    },
    {
      id: 3,
      text: "Identify the correct trend for atomic radius down Group 2 elements.",
      options: ["Decreases due to increasing nuclear charge", "Increases due to additional electron shells", "Remains constant", "Fluctuates unpredictably"],
      correctIndex: 1
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionSelect = (optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Calculate total score percentage
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });
    const finalScore = Math.round((correctCount / questions.length) * 100);

    // --- BACKEND CONNECTION START ---
    // 1. Get student_id from localStorage: const studentId = localStorage.getItem('student_id');
    // 2. Transmit payloads via POST /diagnostic/submit
    //    Body: { student_id: studentId, score: finalScore, answers: selectedAnswers }
    // 3. Mark diagnostic evaluation complete in your state
    // --- BACKEND CONNECTION END ---

    // Cache local diagnostic completion context and navigate to dashboard workspace
    localStorage.setItem('diagnostic_completed', 'true');
    router.push('/dashboard');
  };

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasAnsweredCurrent = selectedAnswers[currentIndex] !== undefined;

  // Calculate percentage progress through total question count
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <form onSubmit={handleSubmit} className={styles.formStructure}>
      {/* Visual Tracking Progress Indicator */}
      <div className={styles.progressContainer}>
        <div className={styles.progressTrack}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <span className={styles.progressLabel}>
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Main Question Card Structure */}
      <div className={styles.questionCard}>
        <h2 className={styles.questionText}>{currentQuestion.text}</h2>
        
        <div className={styles.optionsList}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers[currentIndex] === index;
            return (
              <button
                key={index}
                type="button"
                className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ''}`}
                onClick={() => handleOptionSelect(index)}
              >
                <span className={styles.optionMarker}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className={styles.optionContent}>{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Execution/Navigation Interface */}
      <div className={styles.navigationControl}>
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={styles.backBtn}
        >
          ← Back
        </button>

        {isLastQuestion ? (
          <button
            type="submit"
            disabled={!hasAnsweredCurrent || isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? "Processing..." : "Finish Assessment"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasAnsweredCurrent}
            className={styles.nextBtn}
          >
            Next Question →
          </button>
        )}
      </div>
    </form>
  );
}