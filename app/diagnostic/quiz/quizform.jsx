"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client'; // Adjust this relative path if your utils folder moves
import styles from './quiz.module.css';

export default function QuizForm({ subtopicId }) {
  const router = useRouter();
  const supabase = createClient();

  // State Hooks
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // e.g., { 0: 'C', 1: 'A' }
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes countdown
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch live quiz questions from your Supabase table
  useEffect(() => {
    async function fetchQuestions() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('main_exam_questions')
        .select('*')
        .gte('id', 1)
        .lte('id', 65)
        .order('id', { ascending: true });

      if (!error && data) {
        setQuestions(data);
      } else {
        console.error("Error fetching question records:", error?.message);
      }
      setIsLoading(false);
    }
    fetchQuestions();
  }, []);

  // 2. Countdown Timer Loop
  useEffect(() => {
    if (isLoading || !questions.length) return;
    if (timeLeft <= 0) {
      autoSubmitQuiz();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLoading, questions.length]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOptionSelect = (optionLetter) => {
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: optionLetter }));
  };

  const autoSubmitQuiz = () => {
    alert("Time has expired! Your quiz is being submitted automatically.");
    processSubmission();
  };

  // 3. Process Submission & Save straight to your exact database schema layout
  const processSubmission = async () => {
    setIsSubmitting(true);
    
    let correctCount = 0;
    const totalQuestionsCount = questions.length;

    // Evaluate how many selections exactly matched correct_option string flags
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_option) {
        correctCount++;
      }
    });

    // Calculate score percentage mapping safely
    const finalPercentage = totalQuestionsCount > 0 
      ? Math.round((correctCount / totalQuestionsCount) * 100) 
      : 0;

    try {
      // Fetch current logged in student profile details safely
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("No active authenticated student session discovered.");
      }

      // 🟢 Write straight to your custom data parameters grid layout setup
      const { error: insertError } = await supabase
        .from('main_exam_attempts')
        .insert([
          {
            student_id: user.id,                  // Secure profile UUID key tracking
            student_email: user.email,            // Maps to student_email
            total_questions: totalQuestionsCount, // Maps to total_questions
            correct_answers: correctCount,        // Maps to correct_answers
            score_percentage: finalPercentage,   // Maps to score_percentage
            submitted_at: new Date().toISOString() // Maps to submitted_at
          }
        ]);

      if (insertError) throw insertError;

      alert(`Quiz submitted successfully! Performance: ${finalPercentage}%`);
    } catch (err) {
      console.error("Database submission storage crash:", err.message);
      alert(`Could not record your metrics: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      router.push('/diagnostic/results');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to finalize and push your answers?")) {
      processSubmission();
    }
  };

  if (isLoading) return <div className={styles.loadingPlaceholder}>Assembling quiz framework...</div>;
  if (!questions.length) return <div className={styles.loadingPlaceholder}>No quiz questions found in database.</div>;

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const availableOptions = [
    { key: 'A', text: currentQuestion.option_a },
    { key: 'B', text: currentQuestion.option_b },
    { key: 'C', text: currentQuestion.option_c },
    { key: 'D', text: currentQuestion.option_d },
    { key: 'E', text: currentQuestion.option_e },
  ];

 
  return (
    <form onSubmit={handleSubmit} className={styles.quizFormLayout}>
      {/* Timer Element */}
      <div className={`${styles.timerRow} ${timeLeft < 60 ? styles.timerUrgent : ''}`}>
        <span className={styles.timerIcon}>⏱</span>
        <span className={styles.timeDigits}>Time Remaining: {formatTime(timeLeft)}</span>
      </div>

      <div className={styles.splitContentGrid}>
        {/* Proctoring Side Bar panel */}
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

        {/* Core Multi-Choice Workspace layout frame */}
        <section className={styles.questionSection}>
          <div className={styles.questionHeader}>
            <span className={styles.questionCount}>Question {currentIndex + 1} of {questions.length}</span>
          </div>

          <div className={styles.questionCard}>
            <h2 className={styles.questionText}>{currentQuestion?.question_text}</h2>
            
            <div className={styles.optionsStack}>
              {availableOptions.map((option) => {
                const isSelected = selectedAnswers[currentIndex] === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`${styles.optionRow} ${isSelected ? styles.optionActive : ''}`}
                    onClick={() => handleOptionSelect(option.key)}
                  >
                    <span className={styles.optionIndex}>{option.key}</span>
                    <span className={styles.optionLabel}>{option.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigational Controls Footing segment */}
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
                {isSubmitting ? "Processing..." : "Submit Answers"}
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