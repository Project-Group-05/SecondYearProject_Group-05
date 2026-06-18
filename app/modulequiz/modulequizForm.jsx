"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './modulequiz.module.css';

export default function DiagnosticForm() {
  const router = useRouter();

  // Hardware Verification States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Timer State (e.g., 20 minutes countdown for a quick diagnostic)
  const [timeLeft, setTimeLeft] = useState(1200); 

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

  // 1. Hardware Authorization Stream Handlers
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

  // 2. Countdown Timer Lifecycle Hook Loop
  useEffect(() => {
    if (!isCameraActive || isSubmitting) return;

    if (timeLeft <= 0) {
      // Auto-submit form natively when time drops to zero
      const syntheticEvent = { preventDefault: () => {} };
      handleSubmit(syntheticEvent);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isCameraActive, isSubmitting]);

  // Clean up streams if the user abandons the page early
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
    if (e) e.preventDefault();
    setIsSubmitting(true);

    // Calculate total score percentage
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });
    const finalScore = Math.round((correctCount / questions.length) * 100);

    // 🛑 DATABASE CONNECTION START 🛑
    // If you need to persist this diagnostic in the future, fetch user/student parameters here:
    // const { data: { user } } = await supabase.auth.getUser();
    // await supabase.from('main_exam_attempts').insert([{ student_id: user.id, score_percentage: finalScore }]);
    // 🛑 DATABASE CONNECTION END 🛑

    // Shutdown device camera cleanly after database write/routing sequences trigger
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    localStorage.setItem('diagnostic_completed', 'true');
    router.push('/results');
  };

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasAnsweredCurrent = selectedAnswers[currentIndex] !== undefined;
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  // --- GATEWAY FRAME: Webcam Verification Required ---
  if (!isCameraActive) {
    return (
     <div className={styles.gateCard}>
             <div className={styles.gateIcon}>🔒</div>
             <h2 className={styles.gateTitle}>Webcam Activation Required</h2>
             <p className={styles.gateText}>
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
          className={styles.gateBtn}
          style={{ width: '100%', backgroundColor: cameraStatus === 'loading' ? '#9CA3AF' : '#1A2B5F' }}
        >
          {cameraStatus === 'loading' ? 'Connecting...' : 'Authorize & Launch Camera'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formStructure}>
      
      {/* Dynamic Timer Row Widget */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: timeLeft < 60 ? '#FEE2E2' : '#F3F4F6', borderRadius: '8px', marginBottom: '24px' }}>
        <span style={{ fontSize: '16px' }}>⏱</span>
        <span style={{ fontSize: '14px', fontWeight: '700', color: timeLeft < 60 ? '#991B1B' : '#374151' }}>
          {timeLeft <= 0 ? "Time's Expired!" : `Time Remaining: ${formatTime(timeLeft)}`}
        </span>
      </div>

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

      {/* Split Structural Interface View Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', alignItems: 'start', marginBottom: '32px' }}>
        
        {/* Proctor Sidebar Panel Card */}
        <aside style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ width: '100%', height: '140px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.4' }}>
            <p style={{ color: '#059669', fontWeight: 'bold', margin: '0 0 6px 0' }}>• Tracking Stream Active</p>
            <p style={{ margin: '0 0 4px 0' }}>• Keep your face centered inside the frame.</p>
            <p style={{ margin: 0 }}>• Do not exit the active browser viewport context.</p>
          </div>
        </aside>

        {/* Main Question Card Structure */}
        <div className={styles.questionCard} style={{ margin: 0 }}>
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
           <div className={styles.navigationControl}>
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={styles.backBtn}
        >
          ← Previous
        </button>

        {isLastQuestion ? (
          <button
            type="submit"
            disabled={!hasAnsweredCurrent || isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? "Processing..." : "Submit Answers"}
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
        </div>

      </div>

      {/* Execution/Navigation Interface */}
     
    </form>
  );
}