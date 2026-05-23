"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../utils/supabase/client'; // Adjust this path if needed
import styles from './quiz.module.css';

export default function QuizForm({ subtopicId }) {
  const router = useRouter();
  const supabase = createClient();

  // Hardware Verification States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Core Quiz States
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes countdown
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch questions from database on mount
  useEffect(() => {
    async function fetchQuestions() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('main_exam_questions')
        .select('*')
        .gte('id', 1)
        .lte('id', 40)
        .order('id', { ascending: true });

      if (!error && data) {
        setQuestions(data);
      } else {
        console.error("Error fetching question records:", error?.message);
      }
      setIsLoading(false);
    }
    fetchQuestions();

    // Cleanup camera streams if the user leaves the page abruptly nada
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. Countdown Timer Loop (Only ticks down if camera verification passes!)
  useEffect(() => {
    if (isLoading || !questions.length || !isCameraActive) return;
    if (timeLeft <= 0) {
      autoSubmitQuiz();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLoading, questions.length, isCameraActive]);

  // 3. Hardware Authorization Call
  const startCameraHardware = async () => {
    setCameraStatus('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: "user" } 
      });
      
      streamRef.current = stream;
      setCameraStatus('success');
      setIsCameraActive(true);

      // Give React a tiny fraction of a second to render the video tag before binding the stream source
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);

    } catch (err) {
      console.error("Webcam allocation failure:", err);
      setCameraStatus('error');
    }
  };

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

  const processSubmission = async () => {
    setIsSubmitting(true);
    let correctCount = 0;
    const totalQuestionsCount = questions.length;

    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_option) {
        correctCount++;
      }
    });

    const finalPercentage = totalQuestionsCount > 0 
      ? Math.round((correctCount / totalQuestionsCount) * 100) 
      : 0;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("No active authenticated session discovered.");

      const { error: insertError } = await supabase
        .from('main_exam_attempts')
        .insert([
          {
            student_id: user.id,
            student_email: user.email,
            total_questions: totalQuestionsCount,
            correct_answers: correctCount,
            score_percentage: finalPercentage,
            submitted_at: new Date().toISOString()
          }
        ]);

      if (insertError) throw insertError;
      alert(`Quiz submitted successfully! Performance: ${finalPercentage}%`);
    } catch (err) {
      console.error("Submission crash:", err.message);
      alert(`Could not record your metrics: ${err.message}`);
    } finally {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsSubmitting(false);
      router.push('/dashboard');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to finalize and submit your answers?")) {
      processSubmission();
    }
  };

  if (isLoading) return <div className={styles.loadingPlaceholder}>Assembling quiz framework...</div>;
  if (!questions.length) return <div className={styles.loadingPlaceholder}>No quiz questions found in database.</div>;

  // --- GATEWAY LOOK: If camera is not active yet, show verification gate instead of the quiz questions ---
  if (!isCameraActive) {
    return (
      <div style={gateStyles.card}>
        <div style={gateStyles.icon}>🔒</div>
        <h2 style={gateStyles.title}>Proctor Verification Required</h2>
        <p style={gateStyles.text}>
          To maintain academic integrity, this exam requires an active webcam feed. 
          Please enable your device camera to unlock your diagnostic questions.
        </p>
        
        <div style={{ margin: '12px 0', minHeight: '24px', fontSize: '14px' }}>
          {cameraStatus === 'loading' && <p style={{ color: '#1A56DB' }}>Initializing video framework...</p>}
          {cameraStatus === 'error' && <p style={{ color: '#EF4444', fontWeight: 'bold' }}>⚠ Camera access denied. Please check your system permission flags.</p>}
        </div>

        <button
          type="button"
          onClick={startCameraHardware}
          disabled={cameraStatus === 'loading'}
          style={{
            ...gateStyles.btn,
            backgroundColor: cameraStatus === 'loading' ? '#9CA3AF' : '#1A2B5F'
          }}
        >
          {cameraStatus === 'loading' ? 'Connecting...' : 'Authorize & Launch Camera'}
        </button>
      </div>
    );
  }

  // --- REGULAR LOOK: Render active quiz once camera verification passes ---
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const availableOptions = [
    { key: 'A', text: currentQuestion.option_a },
    { key: 'B', text: currentQuestion.option_b },
    { key: 'C', text: currentQuestion.option_c },
    { key: 'D', text: currentQuestion.option_d },
  ];
  if (currentQuestion.option_e) {
    availableOptions.push({ key: 'E', text: currentQuestion.option_e });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.quizFormLayout}>
      {/* Timer Element */}
      <div className={`${styles.timerRow} ${timeLeft < 60 ? styles.timerUrgent : ''}`}>
        <span className={styles.timerIcon}>⏱</span>
        <span className={styles.timeDigits}>Time Remaining: {formatTime(timeLeft)}</span>
      </div>

      <div className={styles.splitContentGrid}>
        {/* Proctoring Side Bar Panel showing active live feed */}
        <aside className={styles.webcamPanel}>
          <div className={styles.webcamBox}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div className={styles.proctoringRules}>
            <p style={{ color: '#059669', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ inlineSize: '8px', blockSize: '8px', backgroundColor: '#10B981', borderRadius: '50%' }}></span> 
              Monitoring Feed Active
            </p>
            <p>• Ensure your face remains entirely visible.</p>
            <p>• Avoid looking away or swapping browser tabs.</p>
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

// Styling objects for the initial verification screen before quiz elements unlock
const gateStyles = {
  card: { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '40px 32px', textAlign: 'center', maxWidth: '540px', margin: '40px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
  icon: { fontSize: '48px', marginBottom: '16px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1A2B5F', margin: '0 0 12px 0' },
  text: { fontSize: '15px', color: '#4B5563', lineHeight: '1.6', margin: '0 0 20px 0' },
  btn: { color: '#FFFFFF', padding: '14px 28px', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }
};