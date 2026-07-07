"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './modulequiz.module.css';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function DiagnosticForm() {
  const router = useRouter();

  // Hardware Verification States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // 🛡️ Focus Guardian States
  const [isDistracted, setIsDistracted] = useState(false);
  const [aiMessage, setAiMessage] = useState("Monitoring Feed Active 🟢");
  const canvasRef = useRef(null);

  // Dynamic Quiz Core States
  const [questions, setQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [subtopicId, setSubtopicId] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1200); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load subtopic and student parameters from localStorage and fetch quiz
  useEffect(() => {
    const subId = localStorage.getItem('current_subtopic_id') || 1;
    const studId = localStorage.getItem('current_student_id') || 130;
    setSubtopicId(subId);
    setStudentId(studId);

    async function loadQuizQuestions() {
      setIsLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/quiz/${subId}/${studId}`);
        const result = await response.json();
        if (result.success && result.data?.questions) {
          setQuestions(result.data.questions);
          setSessionId(result.data.session_id);
        }
      } catch (err) {
        console.error("Failed to load subtopic quiz:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuizQuestions();
  }, []);

  // 🔄 Focus Guardian frame capture loop
  useEffect(() => {
    if (!isCameraActive || isSubmitting || questions.length === 0) return;

    const intervalId = setInterval(() => {
      captureAndSendFrame();
    }, 2500);

    return () => clearInterval(intervalId);
  }, [isCameraActive, isSubmitting, questions.length]);

  const captureAndSendFrame = async () => {
    if (!videoRef.current || !canvasRef.current || questions.length === 0) return;

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
        console.error("AI Proctoring Network Drop:", err);
      }
    }, "image/jpeg", 0.7);
  };

  // Camera stream handler
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

  // Countdown timer loop
  useEffect(() => {
    if (!isCameraActive || isLoading || !questions.length || isSubmitting || isDistracted) return;

    if (timeLeft <= 0) {
      autoSubmitQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isCameraActive, isLoading, questions.length, isSubmitting, isDistracted]);

  // Cleanup stream
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const optionLetters = ["A", "B", "C", "D"];
  const handleOptionSelect = (optionIndex) => {
    if (isDistracted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIndex]: optionLetters[optionIndex]
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

  const autoSubmitQuiz = () => {
    executeSubmit(true);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isDistracted) return;
    executeSubmit(false);
  };

  const executeSubmit = async (isForced = false) => {
    setIsSubmitting(true);

    const formattedAnswers = questions.map((q, idx) => ({
      question_id: q.id,
      student_answer: selectedAnswers[idx] || ""
    }));

    try {
      const response = await fetch(`${BACKEND_URL}/results/submit-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: Number(studentId),
          session_id: Number(sessionId),
          subtopic_id: Number(subtopicId),
          webcam_enabled: isCameraActive,
          answers: formattedAnswers
        })
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('latest_quiz_result', JSON.stringify({
          subtopic: data.data.subtopic_title || "Chemistry Quiz",
          totalQuestions: data.data.total_questions,
          correctAnswers: data.data.correct_answers,
          percentage: data.data.quiz_score,
          performanceLevel: data.data.new_level,
          feedbackMessage: `Quiz evaluation registered completely. You scored ${data.data.quiz_score}%! Your level is updated to ${data.data.new_level}.`
        }));
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      router.push('/results');
    } catch (err) {
      console.error("Submission failed:", err);
      router.push('/results');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: '16px' }}>
        <p style={{ color: '#64748b', fontWeight: '600' }}>Fetching assessment questions from server...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Camera check gateway screen
  if (!isCameraActive) {
    return (
      <div className={styles.gateCard}>
        <div className={styles.gateIcon}>🔒</div>
        <h2 className={styles.gateTitle}>Webcam Activation Required</h2>
        <p className={styles.gateText}>
          This assessment requires active webcam proctor monitoring. 
          Please enable your device camera to launch.
        </p>
        <div style={{ margin: '12px 0', minHeight: '24px', fontSize: '14px' }}>
          {cameraStatus === 'loading' && <p style={{ color: '#1A56DB' }}>Initializing camera hardware...</p>}
          {cameraStatus === 'error' && <p style={{ color: '#EF4444', fontWeight: 'bold' }}>⚠ Webcam access denied. Check system privacy settings.</p>}
        </div>
        <button
          type="button"
          onClick={startCameraHardware}
          disabled={cameraStatus === 'loading'}
          className={styles.gateBtn}
          style={{ width: '100%', backgroundColor: cameraStatus === 'loading' ? '#9CA3AF' : '#1A2B5F' }}
        >
          {cameraStatus === 'loading' ? 'Connecting...' : 'Authorize & Launch Camera'}
        </button>
      </div>
    );
  }

  // Proctor lock shield
  if (isDistracted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: '16px', padding: '30px', backgroundColor: '#FEF2F2', border: '3px solid #EF4444', borderRadius: '16px' }}>
        <div style={{ fontSize: '48px' }}>🚨</div>
        <h2 style={{ color: '#991B1B', fontWeight: '800' }}>Lock Protocol Active</h2>
        <p style={{ color: '#7F1D1D', textAlign: 'center', maxWidth: '500px' }}>{aiMessage}</p>
        <p style={{ color: '#991B1B', fontSize: '13px' }}>Return eye focus to the window and remove any portable devices to continue.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formStructure}>
      {/* Timer display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: timeLeft < 60 ? '#FEE2E2' : '#F3F4F6', borderRadius: '8px', marginBottom: '24px' }}>
        <span style={{ fontSize: '16px' }}>⏱</span>
        <span style={{ fontSize: '14px', fontWeight: '700', color: timeLeft < 60 ? '#991B1B' : '#374151' }}>
          {timeLeft <= 0 ? "Time Expired!" : `Time Remaining: ${formatTime(timeLeft)}`}
        </span>
      </div>

      {/* Progress */}
      <div className={styles.progressContainer}>
        <div className={styles.progressTrack}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <span className={styles.progressText}>Question {currentIndex + 1} of {questions.length}</span>
      </div>

      {/* Question rendering */}
      {currentQuestion && (
        <div className={styles.questionCard}>
          <h3 className={styles.questionText}>{currentQuestion.question_text}</h3>
          
          <div className={styles.optionsList}>
            {[currentQuestion.option_a, currentQuestion.option_b, currentQuestion.option_c, currentQuestion.option_d].map((opt, idx) => {
              const letter = optionLetters[idx];
              const isSelected = selectedAnswers[currentIndex] === letter;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleOptionSelect(idx)}
                  className={`${styles.optionBtn} ${isSelected ? styles.selectedOption : ''}`}
                >
                  <span className={styles.optionLetter}>{letter}</span>
                  <span className={styles.optionText}>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className={styles.navRow}>
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={styles.prevBtn}
        >
          ← Back
        </button>

        {isLastQuestion ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz ✔"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className={styles.nextBtn}
          >
            Next →
          </button>
        )}
      </div>
      
      {/* Hidden camera preview */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '120px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
      </div>
    </form>
  );
}