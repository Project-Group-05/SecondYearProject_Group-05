"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Points directly to the sibling style sheet in this exact folder
import styles from './quiz.module.css';

export default function QuizForm({ subtopicId }) {
  const router = useRouter();

  const questions = [
    {
      id: 1,
      text: "Which property increases down Group 1 elements?",
      options: ["First ionization energy", "Electronegativity", "Atomic radius", "Melting point"],
      correctIndex: 2
    },
    {
      id: 2,
      text: "Why do Group 2 elements have higher melting points than Group 1 elements?",
      options: ["They contribute two valence electrons to the metallic lattice", "They have larger atomic radii", "They are less dense", "They form weaker metallic bonds"],
      correctIndex: 0
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(120);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      autoSubmitQuiz();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOptionSelect = (index) => {
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: index }));
  };

  const autoSubmitQuiz = () => {
    alert("Time has expired! Your quiz is being submitted automatically.");
    processSubmission();
  };

  const processSubmission = async () => {
    setIsSubmitting(true);
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) correctCount++;
    });
    const score = Math.round((correctCount / questions.length) * 100);
    
    // --- BACKEND CONNECTION HERE ---
    
    router.push('/dashboard');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to finish and submit this quiz?")) {
      processSubmission();
    }
  };

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <form onSubmit={handleSubmit} className={styles.quizFormLayout}>
      <div className={`${styles.timerRow} ${timeLeft < 30 ? styles.timerUrgent : ''}`}>
        <span className={styles.timerIcon}>⏱</span>
        <span className={styles.timeDigits}>Time Remaining: {formatTime(timeLeft)}</span>
      </div>

      <div className={styles.splitContentGrid}>
        <aside className={styles.webcamPanel}>
          <div className={styles.webcamBox}>
            <div className={styles.cameraPlaceholder}>
              <span className={styles.cameraDot}>●</span>
              <p className={styles.cameraText}>Webcam Monitoring Active</p>
              <small className={styles.subText}>AI tracks focus indicators</small>
            </div>
          </div>
          <div className={styles.proctoringRules}>
            <p>• Ensure your face remains entirely visible.</p>
            <p>• Avoid using phones or looking away.</p>
          </div>
        </aside>

        <section className={styles.questionSection}>
          <div className={styles.questionHeader}>
            <span className={styles.questionCount}>Question {currentIndex + 1} of {questions.length}</span>
          </div>

          <div className={styles.questionCard}>
            <h2 className={styles.questionText}>{currentQuestion?.text}</h2>
            
            <div className={styles.optionsStack}>
              {currentQuestion?.options.map((option, index) => {
                const isSelected = selectedAnswers[currentIndex] === index;
                return (
                  <button
                    key={index}
                    type="button"
                    className={`${styles.optionRow} ${isSelected ? styles.optionActive : ''}`}
                    onClick={() => handleOptionSelect(index)}
                  >
                    <span className={styles.optionIndex}>{String.fromCharCode(65 + index)}</span>
                    <span className={styles.optionLabel}>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.prevBtn}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>

            {isLastQuestion ? (
              <button
                type="submit"
                className={styles.finishBtn}
                disabled={selectedAnswers[currentIndex] === undefined || isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Submit Answers"}
              </button>
            ) : (
              <button
                type="button"
                className={styles.nextBtn}
                onClick={() => setCurrentIndex(prev => prev + 1)}
                disabled={selectedAnswers[currentIndex] === undefined}
              >
                Next Question →
              </button>
            )}
          </div>
        </section>
      </div>
    </form>
  );
}