"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './StudyPage.module.css';
import { parseSections } from './parseContent';

const BACKEND_URL = "http://127.0.0.1:8000";

export default function StudyForm({ content }) {
  // 🛡️ CRITICAL NULL GUARD: If backend content hasn't loaded into memory yet, hold execution to prevent a crash
  if (!content || !content.body) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', color: '#64748b', fontWeight: '500' }}>
        🔄 Synchronizing learning materials from database...
      </div>
    );
  }

  // Safe to parse now that we confirmed content.body exists!
  const studySteps = parseSections(content.body);
  const [currentStep, setCurrentStep] = useState(0);

  const activeContent = studySteps[currentStep];
  const isLastStep = currentStep === studySteps.length - 1;

  // 🛡️ Focus Guardian Monitoring Hooks & Refs
  const [isDistracted, setIsDistracted] = useState(false);
  const [aiMessage, setAiMessage] = useState("Initializing Proctor Feed...");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // 🎥 Initialize browser camera hardware on component mount
  useEffect(() => {
    async function startStudyCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setAiMessage("Monitoring Feed Active 🟢");
        }
      } catch (err) {
        console.error("Camera linkage dropped:", err);
        setAiMessage("❌ Camera Hardware Blocked");
      }
    }
    startStudyCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 🔄 Automated background frame-polling loop
  useEffect(() => {
    const intervalId = setInterval(() => {
      captureAndSendFrame();
    }, 2500); 

    return () => clearInterval(intervalId);
  }, []);

  const captureAndSendFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

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
        console.error("Proctor framework dropped packet:", err);
      }
    }, "image/jpeg", 0.7); 
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
    } else {
      window.location.href = '/modulequiz';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '32px', padding: '20px', alignItems: 'flex-start', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
      {/* 🛡️ LEFT COLUMN: Persistent Real-Time Intelligent Proctor Component */}
      <aside style={{ width: '280px', flexShrink: 0, position: 'sticky', top: '24px' }}>
        <div 
          style={{ 
            width: '100%', 
            height: '210px', 
            backgroundColor: '#1e293b', 
            borderRadius: '12px', 
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            border: isDistracted ? '4px solid #ef4444' : '3px solid #10b981',
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

        {/* Dynamic Focus Status Display Card */}
        <div style={{ 
          marginTop: '12px', 
          padding: '14px', 
          borderRadius: '8px', 
          backgroundColor: isDistracted ? '#fef2f2' : '#f0fdf4', 
          border: isDistracted ? '1px solid #fca5a5' : '1px solid #86efac',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease'
        }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: isDistracted ? '#dc2626' : '#16a34a', textAlign: 'center', lineHeight: '1.4' }}>
            {aiMessage}
          </p>
        </div>

        {/* Quick Guide Reminders */}
        <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proctor Protocol</h4>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#64748b' }}>• Keep camera view unimpeded</p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#64748b' }}>• Handheld phones will flag locks</p>
        </div>
      </aside>

      {/* 📖 RIGHT COLUMN: Core Markdown Workspace Material */}
      <form className={styles.form} onSubmit={handleNextStep} style={{ flexGrow: 1, margin: 0, width: 'calc(100% - 312px)' }}>
        <div className={styles.header}>
          <div className={styles.metaBadgeRow}>
            <span className={styles.groupBadge}>{content.group_name}</span>
            <span className={styles.levelBadge}>{activeContent?.badge || "Core"}</span>
          </div>
          <h1 className={styles.appNameText}>{activeContent?.title || "Study Session"}</h1>
        </div>

        <div className={styles.contentBodyArea}>
          <div className={styles.paragraphText}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {activeContent?.body || ""}
            </ReactMarkdown>
          </div>
        </div>

        <div className={styles.progressBarWrapper}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${((currentStep + 1) / studySteps.length) * 100}%` }}
          ></div>
        </div>

        <button type="submit" className={styles.registerBtn}>
          {isLastStep ? "Proceed to Assessment Quiz →" : "Next Concept →"}
        </button>

        <div className={styles.footer}>
          {currentStep > 0 && (
            <button
              type="button"
              className={styles.backButtonInline}
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              ← Previous Section
            </button>
          )}
          <p className={styles.helpText}>Stuck on this topic? <Link href="/dashboard">Return Home</Link></p>
        </div>
      </form>

    </div>
  );
}