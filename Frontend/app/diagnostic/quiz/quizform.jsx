"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './quiz.module.css';

export default function QuizForm() {
  const router = useRouter();
  const BACKEND_URL = "http://127.0.0.1:8000";

  // Hardware Verification States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('idle');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // 🛡️ Focus Guardian Core States & Refs
  const [isDistracted, setIsDistracted] = useState(false);
  const [aiMessage, setAiMessage] = useState("Monitoring Feed Active 🟢");
  const canvasRef = useRef(null);

  // Core Quiz States
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(4500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Controls the custom centered confirmation dialog box
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Controls the custom post-submit results dialog box
  const [quizResult, setQuizResult] = useState(null);

  // 🔄 Focus Guardian: Automated background frame-polling loop
  useEffect(() => {
    if (!isCameraActive || quizResult) return;

    const intervalId = setInterval(() => {
      captureAndSendFrame();
    }, 2500); 

    return () => clearInterval(intervalId);
  }, [isCameraActive, quizResult]);

  const captureAndSendFrame = async () => {
    if (!videoRef.current || !canvasRef.current || quizResult) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("file", blob, "snapshot.jpg");

      try {
        const res = await fetch(`${BACKEND_URL}/behaviour/analyze-frame`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          setAiMessage(data.data.distracted ? data.data.message : "Monitoring Feed Active 🟢");
          setIsDistracted(data.data.distracted);
        }
      } catch (err) {
        console.error("AI proctoring network drop:", err);
      }
    }, "image/jpeg", 0.7); 
  };

  // 1. Fetch questions from FastAPI backend on mount
  useEffect(() => {
    async function fetchQuestions() {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:8000/diagnostic/questions');
        const resData = await response.json();

        if (resData.success && resData.data?.questions) {
          setQuestions(resData.data.questions);
        } else {
          console.error("Error fetching question records:", resData.message);
        }
      } catch (err) {
        console.error("Network failure gathering diagnostic records from FastAPI:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestions();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. Countdown Timer Loop (Pauses countdown when frozen to be fair to students)
  useEffect(() => {
    if (isLoading || !questions.length || !isCameraActive || quizResult || isDistracted) return;

    if (timeLeft <= 0) {
      autoSubmitQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLoading, questions.length, isCameraActive, quizResult, isDistracted]);

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
    if (isDistracted) return; // Fail-safe block
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: optionLetter }));
  };

  const autoSubmitQuiz = () => {
    setShowConfirmModal(false);
    executeDatabaseWrite(true);
  };

  const openConfirmationModal = (e) => {
    if (e) e.preventDefault();
    if (isDistracted) return; // Prevent submission actions while flagged
    setShowConfirmModal(true);
  };

  const executeDatabaseWrite = async (isForcedByTimeout = false) => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      const stored = localStorage.getItem('student');
      if (!stored) throw new Error("No active authenticated session discovered.");
      const user = JSON.parse(stored);

      const formattedAnswers = questions.map((question, idx) => ({
        question_id: question.id,
        student_answer: selectedAnswers[idx] || ""
      }));

      const studentId = localStorage.getItem('student_id') || user.id;
      const payload = {
        student_id: studentId,
        student_email: user.email,
        answers: formattedAnswers
      };

      const backendResponse = await fetch('http://localhost:8000/diagnostic/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resultData = await backendResponse.json();

      if (!backendResponse.ok || !resultData.success) {
        throw new Error(resultData.message || "Failed processing submission payload.");
      }

      const reportSummary = resultData.data.results;

      await fetch('http://localhost:8000/diagnostic/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId })
      });

      const updatedStudent = { ...user, diagnostic_completed: true };
      localStorage.setItem('student', JSON.stringify(updatedStudent));

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      setQuizResult({
        correct: reportSummary.correct_answers,
        total: reportSummary.total_questions,
        percentage: reportSummary.score_percentage,
        wasAutomated: isForcedByTimeout
      });

    } catch (err) {
      console.error("Submission crash:", err.message);
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

  if (!isCameraActive) {
    return (
      <div className={styles.gateCard}>
        <div className={styles.gateIcon}>🔒</div>
        <h2 className={styles.gateTitle}>Webcam Activation Required</h2>
        <p className={styles.gateText}>
          This exam requires an active webcam feed. Please enable your device camera!
        </p>

        <div style={{ margin: '12px 0', minHeight: '24px', fontSize: '14px' }}>
          {cameraStatus === 'loading' && <p style={{ color: '#1A56DB' }}>Initializing video framework...</p>}
          {cameraStatus === 'error' && <p style={{ color: '#EF4444', fontWeight: 'bold' }}>⚠ Camera access denied. Please check your system permission flags.</p>}
        </div>

        <button
          type="button"
          onClick={startCameraHardware}
          disabled={cameraStatus === 'loading'}
          className={styles.gateBtn}
          style={{ backgroundColor: cameraStatus === 'loading' ? '#9CA3AF' : '#1A2B5F' }}
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
  ].filter(opt => opt.text);

  return (
    <form onSubmit={openConfirmationModal} className={styles.quizFormLayout}>
      <div className={`${styles.timerRow} ${timeLeft < 60 ? styles.timerUrgent : ''} ${isDistracted ? styles.timerFrozen : ''}`}>
        <span className={styles.timerIcon}>{isDistracted ? "⏸" : "⏱"}</span>
        <span className={styles.timeDigits}>
          {isDistracted ? "Exam Interrupted: Look back at the screen to resume" : timeLeft <= 0 ? "Time's Up!" : `Time Remaining: ${formatTime(timeLeft)}`}
        </span>
      </div>

      <div className={styles.splitContentGrid}>
        {/* Proctoring Side Bar Panel */}
        <aside className={styles.webcamPanel}>
          <div 
            className={styles.webcamBox} 
            style={{ 
              border: quizResult ? '3px solid #9CA3AF' : isDistracted ? '4px solid #EF4444' : '3px solid #10B981',
              borderRadius: '8px',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
          </div>
          
          <div className={styles.proctoringRules}>
            <p style={{ 
              color: quizResult ? '#6B7280' : isDistracted ? '#EF4444' : '#059669', 
              fontWeight: 'bold', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              transition: 'color 0.2s ease'
            }}>
              <span style={{ 
                inlineSize: '8px', 
                blockSize: '8px', 
                backgroundColor: quizResult ? '#9CA3AF' : isDistracted ? '#EF4444' : '#10B981', 
                borderRadius: '50%',
                transition: 'background-color 0.2s ease'
              }}></span>
              {quizResult ? 'Monitoring Feed Off' : aiMessage}
            </p>
            <p style={{ color: isDistracted ? '#EF4444' : '#4B5563', transition: 'color 0.2s ease' }}>• Ensure your face remains entirely visible.</p>
            <p style={{ color: isDistracted ? '#EF4444' : '#4B5563', transition: 'color 0.2s ease' }}>• Avoid looking away or swapping browser tabs.</p>
          </div>
        </aside>

        {/* 📖 Core Multi-Choice Workspace Section (Controlled by isDistracted) */}
        <section 
          className={styles.questionSection}
          style={{
            opacity: isDistracted ? 0.5 : 1,
            pointerEvents: isDistracted ? 'none' : 'auto', // 🚫 Total interaction block lock
            transition: 'all 0.2s ease'
          }}
        >
          <div className={styles.questionHeader}>
            <span className={styles.questionCount}>
              {isDistracted ? "⚠️ INTERFACE LOCKED" : `Question ${currentIndex + 1} of ${questions.length}`}
            </span>
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
                    disabled={isSubmitting || quizResult !== null || isDistracted} // 🔒 Locks answers
                  >
                    <span className={styles.optionIndex}>{option.key}</span>
                    <span className={styles.optionLabel}>{option.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigational Controls */}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.prevBtn}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              disabled={currentIndex === 0 || quizResult !== null || isDistracted} // 🔒 Locks Previous
            >
              ← Previous
            </button>

            {isLastQuestion ? (
              <button
                type="submit"
                className={styles.finishBtn}
                disabled={isSubmitting || quizResult !== null || isDistracted} // 🔒 Locks Submit
              >
                {isSubmitting ? "Processing..." : "Submit Answers"}
              </button>
            ) : (
              <button
                type="button"
                className={styles.nextBtn}
                onClick={() => setCurrentIndex(prev => prev + 1)}
                disabled={quizResult !== null || isDistracted} // 🔒 Locks Next
              >
                Next Question →
              </button>
            )}
          </div>
        </section>
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {showConfirmModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.dialogBox}>
            <div style={modalStyles.icon}>❓</div>
            <h3 style={modalStyles.title}>Submit Assessment?</h3>
            <p style={modalStyles.text}>
              Are you sure you want to submit your answers? You cannot review or change them after submission.
            </p>
            <div style={modalStyles.actionRow}>
              <button type="button" style={modalStyles.cancelBtn} onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button type="button" style={modalStyles.confirmBtn} onClick={() => executeDatabaseWrite(false)}>Confirm Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* --- RESULTS MODAL --- */}
      {quizResult && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.dialogBox, borderTop: quizResult.wasAutomated ? '6px solid #EF4444' : '6px solid #10B981' }}>
            <div style={{ ...modalStyles.icon, color: quizResult.wasAutomated ? '#EF4444' : '#10B981' }}>{quizResult.wasAutomated ? '⏰' : '🎉'}</div>
            <h3 style={modalStyles.title}>{quizResult.wasAutomated ? "Time's Up! Quiz Auto-Submitted" : "Assessment Completed!"}</h3>
            <p style={modalStyles.text}>
              {quizResult.wasAutomated ? "The evaluation period expired. Your captured progress has been securely locked and saved." : "You have successfully completed your evaluation test."}
            </p>
            <div style={resultScoreCardStyle}>
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Final Evaluation Score</p>
              <h2 style={{ margin: 0, fontSize: '36px', color: '#1A2B5F', fontWeight: '800' }}>{quizResult.percentage}%</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#4B5563', fontWeight: '500' }}>
                Answered <strong style={{ color: quizResult.wasAutomated ? '#EF4444' : '#10B981' }}>{quizResult.correct}</strong> out of <strong>{quizResult.total}</strong> correct
              </p>
            </div>
            <div style={modalStyles.actionRow}>
              <button type="button" style={{ ...modalStyles.confirmBtn, width: '100%' }} onClick={handleExitQuiz}>Go to Results</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

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