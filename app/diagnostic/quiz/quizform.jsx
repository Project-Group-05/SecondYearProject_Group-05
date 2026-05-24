"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client'; // Adjust this path if needed
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
  const [timeLeft, setTimeLeft] = useState(4500); // 75 minutes countdown
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  

  // Controls the custom centered confirmation dialog box
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Controls the custom post-submit results dialog box
  const [quizResult, setQuizResult] = useState(null); 

  // 1. Fetch questions from database on mount
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

    // Cleanup camera streams if the user leaves the page abruptly
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. Countdown Timer Loop
  useEffect(() => {
    if (isLoading || !questions.length || !isCameraActive || quizResult) return;
    
    // 🌟 AUTOMATIC SUBMISSION TRIGGER CHECK
    if (timeLeft <= 0) {
      autoSubmitQuiz();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLoading, questions.length, isCameraActive, quizResult]);

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
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOptionSelect = (optionLetter) => {
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: optionLetter }));
  };

  // 🌟 FEATURE UPDATE: Handles structural auto-submission cleanly when timer runs dry
  const autoSubmitQuiz = () => {
    // Closes confirmation query box if it was open when time expired
    setShowConfirmModal(false); 
    
    // Directly process database operations and open score modal layout frames
    executeDatabaseWrite(true); 
  };

  const openConfirmationModal = (e) => {
    if (e) e.preventDefault();
    setShowConfirmModal(true);
  };

  // Core transactional writing operations logic
  const executeDatabaseWrite = async (isForcedByTimeout = false) => {
    setShowConfirmModal(false); 
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
      // Fetch user data right at submission runtime
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error("No active authenticated session discovered.");
      const user = userData.user;

      console.log("🔗 Executing unified transactional updates...");

      // Step A: Format and bulk-insert data to quiz_attempts breakdown table
      const attemptsToInsert = questions.map((question, idx) => {
        const studentAnswer = selectedAnswers[idx] || null;
        const isCorrect = studentAnswer === question.correct_option; 

        return {
          student_id: user.id,                  // Structural alignment fallback value
          question_id: question.id,          
          subtopic_id: question.subtopic_id, 
          student_answer: studentAnswer,
          correct_answer: question.correct_option,
          is_correct: isCorrect,
          explanation: question.explanation || null
        };
      });

      const { error: attemptsError } = await supabase
        .from('quiz_attempts')
        .insert(attemptsToInsert);

      if (attemptsError) throw attemptsError;
      console.log("🎉 Part 1 Complete: Breakdowns loaded to quiz_attempts!");

      // Step B: Insert general high-level performance logs into main_exam_attempts
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
          console.log("🏆 Part 2 Complete: Total metrics saved to main_exam_attempts!");
      // Shutdown local hardware camera stream indications safely
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Mount final scoring metrics and identify if submission was automated or manual
      setQuizResult({
        correct: correctCount,
        total: totalQuestionsCount,
        percentage: finalPercentage,
        wasAutomated: isForcedByTimeout
      });

    } catch (err) {
      console.error("Submission crash:", err.message);
      alert(`Could not record your metrics: ${err.message}`);
      router.push('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitQuiz = () => {
    router.push('/diagnostic/results');
  };

  
  

  if (isLoading) return <div className={styles.loadingPlaceholder}>Assembling quiz framework...</div>;
  if (!questions.length) return <div className={styles.loadingPlaceholder}>No quiz questions found in database.</div>;

  // --- GATEWAY LOOK: Proctor Verification Required ---
  if (!isCameraActive) {
    return (
      <div style={gateStyles.card}>
        <div style={gateStyles.icon}>🔒</div>
        <h2 style={gateStyles.title}>Webcam Activation Required</h2>
        <p style={gateStyles.text}>
          This exam requires an active webcam feed. 
          Please enable your device camera!
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

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const availableOptions = [
    { key: 'A', text: currentQuestion.option_a },
    { key: 'B', text: currentQuestion.option_b },
    { key: 'C', text: currentQuestion.option_c },
    { key: 'D', text: currentQuestion.option_d },
    { key: 'E', text: currentQuestion.option_e }
  ];
 

  return (
    <form onSubmit={openConfirmationModal} className={styles.quizFormLayout}>
      {/* Timer Element */}
      <div className={`${styles.timerRow} ${timeLeft < 60 ? styles.timerUrgent : ''}`}>
        <span className={styles.timerIcon}>⏱</span>
        <span className={styles.timeDigits}>
          {timeLeft <= 0 ? "Time's Up!" : `Time Remaining: ${formatTime(timeLeft)}`}
        </span>
      </div>

      <div className={styles.splitContentGrid}>
        {/* Proctoring Side Bar Panel */}
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
            <p style={{ color: quizResult ? '#6B7280' : '#059669', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ inlineSize: '8px', blockSize: '8px', backgroundColor: quizResult ? '#9CA3AF' : '#10B981', borderRadius: '50%' }}></span> 
              {quizResult ? 'Monitoring Feed Off' : 'Monitoring Feed Active'}
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
                    disabled={isSubmitting || quizResult !== null}
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
              disabled={currentIndex === 0 || quizResult !== null}
            >
              ← Previous
            </button>

            {isLastQuestion ? (
              <button
                type="submit" 
                className={styles.finishBtn}
                
                disabled={selectedAnswers[currentIndex] === undefined || isSubmitting || quizResult !== null}
              >
                {isSubmitting ? "Processing..." : "Submit Answers"}
              </button>
            ) : (
              <button
                type="button"
                className={styles.nextBtn}
                onClick={() => setCurrentIndex(prev => prev + 1)}
                disabled={selectedAnswers[currentIndex] === undefined || quizResult !== null}
              >
                Next Question →
              </button>
            )}
          </div>
        </section>
      </div>

      {/* --- CUSTOM CENTERED CONFIRMATION DIALOG BOX MODAL --- */}
      {showConfirmModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.dialogBox}>
            <div style={modalStyles.icon}>❓</div>
            <h3 style={modalStyles.title}>Submit Assessment?</h3>
            <p style={modalStyles.text}>
              Are you sure you want to submit your answers? You cannot review or change them after submission.
            </p>
            <div style={modalStyles.actionRow}>
              <button 
                type="button" 
                style={modalStyles.cancelBtn} 
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                style={modalStyles.confirmBtn} 
                onClick={() => executeDatabaseWrite(false)}
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM CENTERED PERFORMANCE RESULTS DIALOG BOX MODAL --- */}
      {quizResult && (
        <div style={modalStyles.overlay}>
          <div style={{ 
            ...modalStyles.dialogBox, 
            borderTop: quizResult.wasAutomated ? '6px solid #EF4444' : '6px solid #10B981' 
          }}>
            <div style={{ ...modalStyles.icon, color: quizResult.wasAutomated ? '#EF4444' : '#10B981' }}>
              {quizResult.wasAutomated ? '⏰' : '🎉'}
            </div>
            
            <h3 style={modalStyles.title}>
              {quizResult.wasAutomated ? "Time's Up! Quiz Auto-Submitted" : "Assessment Completed!"}
            </h3>
            
            <p style={modalStyles.text}>
              {quizResult.wasAutomated 
                ? "The evaluation period expired. Your captured progress has been securely locked and saved."
                : "You have successfully completed your evaluation test."}
            </p>
            
            {/* Score Breakdown Area */}
            <div style={resultScoreCardStyle}>
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Final Evaluation Score</p>
              <h2 style={{ margin: 0, fontSize: '36px', color: '#1A2B5F', fontWeight: '800' }}>{quizResult.percentage}%</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#4B5563', fontWeight: '500' }}>
                Answered <strong style={{ color: quizResult.wasAutomated ? '#EF4444' : '#10B981' }}>{quizResult.correct}</strong> out of <strong>{quizResult.total}</strong> correct
              </p>
            </div>

            <div style={modalStyles.actionRow}>
              <button 
                type="button" 
                style={{ ...modalStyles.confirmBtn, width: '100%' }} 
                onClick={handleExitQuiz}
              >
                Go to Results
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

// Global style mappings retain perfect styling standards
const gateStyles = {
  card: { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '40px 32px', textAlign: 'center', maxWidth: '540px', margin: '40px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
  icon: { fontSize: '48px', marginBottom: '16px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1A2B5F', margin: '0 0 12px 0' },
  text: { fontSize: '15px', color: '#4B5563', lineHeight: '1.6', margin: '0 0 20px 0' },
  btn: { color: '#FFFFFF', padding: '14px 28px', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' },
  dialogBox: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '32px', maxWidth: '440px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'fadeIn 0.2s ease-out' },
  icon: { fontSize: '36px', marginBottom: '12px' },
  title: { fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' },
  text: { fontSize: '14px', color: '#4B5563', lineHeight: '1.5', margin: '0 0 24px 0' },
  actionRow: { display: 'flex', gap: '12px', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', color: '#374151', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', flex: 1 },
  confirmBtn: { backgroundColor: '#1A2B5F', border: 'none', color: '#FFFFFF', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', flex: 1 }
};

const resultScoreCardStyle = { backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px', marginBottom: '24px', textAlign: 'center' };