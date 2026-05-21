import React from 'react';
import Link from 'next/link';
import { Target, Zap, ShieldCheck, TrendingUp } from 'lucide-react';

import './landing.modules.css';

export default function LandingPage() {
  return (
    <div className="landing-container">
      {/* Header / Navbar */}
      <nav className="navbar">
        <div className="logo">
          Edu<span className="logo-accent">FX</span>
        </div>
        <div className="nav-links">
          {/* Kept only essential Nav Link for focus */}
          <Link href="/login" className="btn-secondary-outline">Sign In</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Master <span className="text-highlight">S-Block Chemistry</span> with AI Precision.
          </h1>
          <p className="hero-description">
            The adaptive learning platform that turns complex inorganic reactions into mastered skills through personalized study paths.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn-hero-primary">
              Get Start<Zap size={20} fill="currentColor" />
            </Link>
          </div>
        </div>

        {/* New Creative Chemistry Graphic Area */}
        <div className="hero-graphic-area">
          <div className="s-orbital-sphere">
            <div className="electron-orbit">
              <div className="electron"></div>
            </div>
          </div>

          <div className="chemistry-stat-card">
            <div className="stat-header">
              <div className="element-box">
                <span className="atomic-number">3</span>
                <span className="element-symbol">Li</span>
              </div>
              <div className="element-text">
                <h4>Lithium Mastery</h4>
                <div className="status-badge">Stable Progression</div>
              </div>
            </div>

            <div className="config-section">
              <div className="config-header">
                <span>[He]  2s¹</span>
                <span> 85%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill"></div>
              </div>
            </div>

            <div className="flame-test-row">
              <div className="flame-chip lithium">Flame: Crimson</div>
              <div className="flame-chip sodium">Highly Reactive</div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Highlights - Cleaned of citations */}
      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="icon-wrapper icon-blue"><Target size={32} /></div>
            <h3>Diagnostic Exam</h3>
            <p>Our initial assessment maps your exact starting point for every Alkali subtopic.</p>
          </div>
          <div className="feature-card">
            <div className="icon-wrapper icon-green"><ShieldCheck size={32} /></div>
            <h3>Focus Guard</h3>
            <p>Stay productive with AI-driven focus tracking during intense quiz sessions.</p>
          </div>
          <div className="feature-card">
            <div className="icon-wrapper icon-purple"><TrendingUp size={32} /></div>
            <h3>Adaptive Content</h3>
            <p>Study materials evolve as you level up, targeting your specific weak points in real-time.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
