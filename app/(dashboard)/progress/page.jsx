"use client";

/**
 * PROGRESS PAGE
 * Save at: /app/(dashboard)/progress/page.jsx
 *
 * This is a CLIENT COMPONENT because it uses:
 *  - useState / useEffect for data fetching and UI state
 *  - localStorage to read student info
 *  - expandable row interactions
 *
 * The (dashboard) route group applies the dashboard layout (Navbar).
 * See /app/(dashboard)/layout.jsx — Navbar is rendered there.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./progress.module.css";

// ─────────────────────────────────────────────
// CONSTANTS — the 10 chemistry subtopics
// ─────────────────────────────────────────────
const GROUP_1_SUBTOPICS = [
  { id: "g1-trends",      name: "Group Trends of Group 1 Elements",    group: "Group 1" },
  { id: "g1-reactions",   name: "Reaction of Group 1 Elements",         group: "Group 1" },
  { id: "g1-thermal",     name: "Thermal Stability of Group 1 Salts",   group: "Group 1" },
  { id: "g1-solubility",  name: "Solubility of Group 1 Salts",          group: "Group 1" },
  { id: "g1-flame",       name: "Flame Test of Group 1 Elements",       group: "Group 1" },
];

const GROUP_2_SUBTOPICS = [
  { id: "g2-trends",      name: "Group Trends of Group 2 Elements",    group: "Group 2" },
  { id: "g2-reactions",   name: "Reaction of Group 2 Elements",         group: "Group 2" },
  { id: "g2-thermal",     name: "Thermal Stability of Group 2 Salts",   group: "Group 2" },
  { id: "g2-solubility",  name: "Solubility of Group 2 Salts",          group: "Group 2" },
  { id: "g2-flame",       name: "Flame Test of Group 2 Elements",       group: "Group 2" },
];

// ─────────────────────────────────────────────
// HELPER UTILITIES
// ─────────────────────────────────────────────

/**
 * Returns "beginner" | "intermediate" | "advanced" from a score (0–100).
 */
function levelFromScore(score) {
  if (score <= 40) return "beginner";
  if (score <= 70) return "intermediate";
  return "advanced";
}

/**
 * Returns a human-readable label for a level key.
 */
function levelLabel(level) {
  const map = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
  return map[level] ?? level;
}

/**
 * Colour class for a score number cell.
 */
function scoreColorClass(score) {
  if (score < 40) return styles.scoreRed;
  if (score < 70) return styles.scoreYellow;
  return styles.scoreGreen;
}

/**
 * Change indicator arrow based on level comparison.
 */
function ChangeIndicator({ before, after }) {
  const levels = ["beginner", "intermediate", "advanced"];
  const diff = levels.indexOf(after) - levels.indexOf(before);
  if (diff > 0)  return <span className={`${styles.changeCell} ${styles.changeUp}`}>⬆</span>;
  if (diff < 0)  return <span className={`${styles.changeCell} ${styles.changeDown}`}>⬇</span>;
  return <span className={`${styles.changeCell} ${styles.changeSame}`}>—</span>;
}

// ─────────────────────────────────────────────
// BADGE COMPONENT
// ─────────────────────────────────────────────
function Badge({ type, children }) {
  return <span className={`${styles.badge} ${styles[type]}`}>{children}</span>;
}

// ─────────────────────────────────────────────
// SKELETON ROW (loading placeholder)
// ─────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className={styles.skeletonRow}>
      <div style={{ flex: 1 }}>
        <div className={styles.skeletonBlock} style={{ height: 14, width: "55%", marginBottom: 8 }} />
        <div className={styles.skeletonBlock} style={{ height: 10, width: "30%" }} />
      </div>
      <div style={{ flex: 2, display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div className={styles.skeletonBlock} style={{ flex: 1, height: 8, borderRadius: 4 }} />
        <div className={styles.skeletonBlock} style={{ height: 10, width: 50 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 90, alignItems: "flex-end" }}>
        <div className={styles.skeletonBlock} style={{ height: 10, width: 70 }} />
        <div className={styles.skeletonBlock} style={{ height: 10, width: 55 }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUBTOPIC ROW COMPONENT (expandable)
// ─────────────────────────────────────────────
function SubtopicRow({ subtopicMeta, data }) {
  const [expanded, setExpanded] = useState(false);

  // If we have no data yet for this subtopic, show defaults
  const lastScore    = data?.last_score    ?? 0;
  const sessionCount = data?.session_count ?? 0;
  const lastStudied  = data?.last_studied  ?? null;
  const level        = data?.level         ?? levelFromScore(lastScore);
  const history      = data?.history       ?? [];

  const groupBadgeType = subtopicMeta.group === "Group 1" ? "group1" : "group2";

  return (
    <div className={styles.subtopicRow}>
      {/* ── Main clickable row ── */}
      <div
        className={styles.rowMain}
        onClick={() => setExpanded((prev) => !prev)}
        role="button"
        aria-expanded={expanded}
        aria-label={`Toggle session history for ${subtopicMeta.name}`}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded((p) => !p); }}
      >
        {/* Left — name + badges */}
        <div className={styles.rowLeft}>
          <p className={styles.rowSubtopicName}>{subtopicMeta.name}</p>
          <div className={styles.rowBadgeRow}>
            <Badge type={groupBadgeType}>{subtopicMeta.group}</Badge>
            <Badge type={level}>{levelLabel(level)}</Badge>
          </div>
        </div>

        {/* Centre — progress bar + score */}
        <div className={styles.rowCenter}>
          <div className={styles.scoreBar} aria-label={`Score: ${lastScore}%`}>
            <div
              className={`${styles.scoreBarFill} ${styles[level]}`}
              style={{ width: `${lastScore}%` }}
            />
          </div>
          <span className={styles.rowScoreText}>Last: {lastScore}%</span>
        </div>

        {/* Right — sessions + date */}
        <div className={styles.rowRight}>
          <span className={styles.rowSessionsText}>{sessionCount} session{sessionCount !== 1 ? "s" : ""}</span>
          {lastStudied && (
            <span className={styles.rowLastStudied}>{lastStudied}</span>
          )}
        </div>

        {/* Expand chevron */}
        <button
          className={`${styles.expandBtn} ${expanded ? styles.expanded : ""}`}
          aria-label={expanded ? "Collapse" : "Expand"}
          tabIndex={-1} /* row itself is focusable */
        >
          {/* Inline SVG chevron — no icon library dependency */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── Expanded session history ── */}
      {expanded && (
        <div className={styles.historyPanel}>
          <p className={styles.historyTitle}>Session History</p>

          {history.length === 0 ? (
            <p className={styles.emptyHistory}>No study sessions yet for this subtopic.</p>
          ) : (
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Quiz Score</th>
                  <th>Focus Score</th>
                  <th>Level Before</th>
                  <th>Level After</th>
                  <th style={{ textAlign: "center" }}>Change</th>
                </tr>
              </thead>
              <tbody>
                {history.map((session, idx) => (
                  <tr key={idx}>
                    <td>{session.date}</td>

                    <td className={`${styles.scoreCell} ${scoreColorClass(session.quiz_score)}`}>
                      {session.quiz_score}%
                    </td>

                    <td className={`${styles.scoreCell} ${session.focus_score !== null ? scoreColorClass(session.focus_score) : ""}`}>
                      {/* BACKEND: session.focus_score is null when webcam was disabled */}
                      {session.focus_score !== null ? `${session.focus_score}%` : "—"}
                    </td>

                    <td>
                      <Badge type={session.level_before}>{levelLabel(session.level_before)}</Badge>
                    </td>

                    <td>
                      <Badge type={session.level_after}>{levelLabel(session.level_after)}</Badge>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <ChangeIndicator before={session.level_before} after={session.level_after} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────
export default function ProgressPage() {
  // ── State ──
  const [studentName, setStudentName] = useState("");
  const [progressData, setProgressData] = useState(null); // keyed by subtopic id
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // ── Read student info from localStorage (client only) ──
  useEffect(() => {
    // BACKEND: also grab student_id for the API call
    const name = localStorage.getItem("name") || "Student";
    // const studentId = localStorage.getItem("student_id");
    setStudentName(name);

    fetchProgress(/* studentId */);
  }, []);

  // ── Fetch progress data ──
  async function fetchProgress(/* studentId */) {
    setLoading(true);
    setError(null);

    try {
      // BACKEND: Replace the mock below with a real API call, e.g.:
      //   const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/progress/${studentId}`);
      //   if (!res.ok) throw new Error("Failed to fetch progress");
      //   const json = await res.json();
      //   setProgressData(json.subtopics);  // expected shape shown in MOCK_DATA below

      // ── MOCK DATA — remove when backend is connected ──
      await new Promise((r) => setTimeout(r, 900)); // simulate network delay
      setProgressData(MOCK_PROGRESS_DATA);
    } catch (err) {
      setError(err.message || "Could not load progress. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }

  // ── Derive summary stats ──
  const allSubtopics = [...GROUP_1_SUBTOPICS, ...GROUP_2_SUBTOPICS];

  let beginnerCount     = 0;
  let intermediateCount = 0;
  let advancedCount     = 0;
  let totalSessions     = 0;

  if (progressData) {
    allSubtopics.forEach(({ id }) => {
      const d = progressData[id];
      if (!d) return;
      const lvl = d.level ?? levelFromScore(d.last_score ?? 0);
      if (lvl === "beginner")     beginnerCount++;
      else if (lvl === "intermediate") intermediateCount++;
      else                        advancedCount++;
      totalSessions += d.session_count ?? 0;
    });
  }

  // ─────────────────────────────────────────
  // RENDER — Loading
  // ─────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.pageHeader}>
            <div className={`${styles.skeletonBlock}`} style={{ height: 36, width: 200, marginBottom: 8 }} />
            <div className={`${styles.skeletonBlock}`} style={{ height: 16, width: 280 }} />
          </div>

          {/* Skeleton stats */}
          <div className={styles.statsRow}>
            {[1,2,3,4].map((i) => (
              <div key={i} className={`${styles.skeletonBlock}`} style={{ height: 80, borderRadius: 10 }} />
            ))}
          </div>

          {/* Skeleton rows */}
          {["Group 1 Elements", "Group 2 Elements"].map((g) => (
            <div key={g} className={styles.groupSection}>
              <div className={`${styles.skeletonBlock}`} style={{ height: 18, width: 160, marginBottom: 16 }} />
              {[1,2,3,4,5].map((i) => <SkeletonRow key={i} />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // RENDER — Error
  // ─────────────────────────────────────────
  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.errorWrapper}>
            <span className={styles.errorIcon}>⚠️</span>
            <h2 className={styles.errorTitle}>Failed to load progress</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.btnPrimary} onClick={() => fetchProgress()}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // RENDER — Main
  // ─────────────────────────────────────────
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>

        {/* ── Page Header ── */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Progress</h1>
          <p className={styles.studentSubtitle}>{studentName}&apos;s Learning Journey</p>
        </div>

        {/* ── Summary Stats Row ── */}
        <div className={styles.statsRow}>
          {/* BACKEND: These counts are derived from progressData (local mock or real API) */}
          <div className={`${styles.statBox} ${styles.beginner}`}>
            <span className={styles.statNumber}>{beginnerCount}</span>
            <span className={styles.statLabel}>Beginner Subtopics</span>
          </div>
          <div className={`${styles.statBox} ${styles.intermediate}`}>
            <span className={styles.statNumber}>{intermediateCount}</span>
            <span className={styles.statLabel}>Intermediate Subtopics</span>
          </div>
          <div className={`${styles.statBox} ${styles.advanced}`}>
            <span className={styles.statNumber}>{advancedCount}</span>
            <span className={styles.statLabel}>Advanced Subtopics</span>
          </div>
          <div className={`${styles.statBox} ${styles.sessions}`}>
            <span className={styles.statNumber}>{totalSessions}</span>
            <span className={styles.statLabel}>Total Sessions</span>
          </div>
        </div>

        {/* ── Group 1 Section ── */}
        <section className={styles.groupSection} aria-labelledby="group1-heading">
          <h2 className={styles.groupHeading} id="group1-heading">Group 1 Elements</h2>
          {GROUP_1_SUBTOPICS.map((sub) => (
            <SubtopicRow
              key={sub.id}
              subtopicMeta={sub}
              data={progressData?.[sub.id] ?? null}
            />
          ))}
        </section>

        {/* ── Group 2 Section ── */}
        <section className={styles.groupSection} aria-labelledby="group2-heading">
          <h2 className={styles.groupHeading} id="group2-heading">Group 2 Elements</h2>
          {GROUP_2_SUBTOPICS.map((sub) => (
            <SubtopicRow
              key={sub.id}
              subtopicMeta={sub}
              data={progressData?.[sub.id] ?? null}
            />
          ))}
        </section>

        {/* ── Back to Dashboard ── */}
        <div className={styles.bottomActions}>
          <Link href="/dashboard" className={styles.btnPrimary}>
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOCK DATA
// Remove this block and replace fetchProgress() with a real API call.
//
// Expected API response shape from GET /progress/{student_id}:
// {
//   subtopics: {
//     [subtopic_id]: {
//       level:         "beginner" | "intermediate" | "advanced",
//       last_score:    number,          // 0–100
//       session_count: number,
//       last_studied:  string | null,   // e.g. "May 20"
//       history: [
//         {
//           date:         string,        // e.g. "May 12, 2025"
//           quiz_score:   number,        // 0–100
//           focus_score:  number | null, // null if webcam was off
//           level_before: "beginner" | "intermediate" | "advanced",
//           level_after:  "beginner" | "intermediate" | "advanced",
//         },
//         ...
//       ]
//     }
//   }
// }
// ─────────────────────────────────────────────
const MOCK_PROGRESS_DATA = {
  "g1-trends": {
    level: "intermediate", last_score: 62, session_count: 4, last_studied: "May 20",
    history: [
      { date: "May 20, 2025", quiz_score: 62, focus_score: 80,   level_before: "beginner",     level_after: "intermediate" },
      { date: "May 15, 2025", quiz_score: 45, focus_score: 55,   level_before: "beginner",     level_after: "beginner"     },
      { date: "May 10, 2025", quiz_score: 30, focus_score: null, level_before: "beginner",     level_after: "beginner"     },
      { date: "May 5, 2025",  quiz_score: 20, focus_score: 40,   level_before: "beginner",     level_after: "beginner"     },
    ],
  },
  "g1-reactions": {
    level: "beginner", last_score: 35, session_count: 2, last_studied: "May 18",
    history: [
      { date: "May 18, 2025", quiz_score: 35, focus_score: 60, level_before: "beginner", level_after: "beginner" },
      { date: "May 12, 2025", quiz_score: 25, focus_score: 50, level_before: "beginner", level_after: "beginner" },
    ],
  },
  "g1-thermal": {
    level: "advanced", last_score: 88, session_count: 3, last_studied: "May 21",
    history: [
      { date: "May 21, 2025", quiz_score: 88, focus_score: 92, level_before: "intermediate", level_after: "advanced"      },
      { date: "May 16, 2025", quiz_score: 72, focus_score: 85, level_before: "beginner",     level_after: "intermediate"  },
      { date: "May 11, 2025", quiz_score: 38, focus_score: 70, level_before: "beginner",     level_after: "beginner"      },
    ],
  },
  "g1-solubility": {
    level: "intermediate", last_score: 58, session_count: 1, last_studied: "May 19",
    history: [
      { date: "May 19, 2025", quiz_score: 58, focus_score: null, level_before: "beginner", level_after: "intermediate" },
    ],
  },
  "g1-flame": {
    level: "beginner", last_score: 20, session_count: 1, last_studied: "May 17",
    history: [
      { date: "May 17, 2025", quiz_score: 20, focus_score: 30, level_before: "beginner", level_after: "beginner" },
    ],
  },
  "g2-trends": {
    level: "intermediate", last_score: 65, session_count: 3, last_studied: "May 22",
    history: [
      { date: "May 22, 2025", quiz_score: 65, focus_score: 78, level_before: "beginner",      level_after: "intermediate" },
      { date: "May 17, 2025", quiz_score: 42, focus_score: 65, level_before: "beginner",      level_after: "beginner"     },
      { date: "May 12, 2025", quiz_score: 30, focus_score: 45, level_before: "beginner",      level_after: "beginner"     },
    ],
  },
  "g2-reactions": {
    level: "advanced", last_score: 80, session_count: 2, last_studied: "May 21",
    history: [
      { date: "May 21, 2025", quiz_score: 80, focus_score: 88, level_before: "intermediate", level_after: "advanced"     },
      { date: "May 15, 2025", quiz_score: 60, focus_score: 72, level_before: "beginner",     level_after: "intermediate" },
    ],
  },
  "g2-thermal": {
    level: "beginner", last_score: 28, session_count: 1, last_studied: "May 20",
    history: [
      { date: "May 20, 2025", quiz_score: 28, focus_score: null, level_before: "beginner", level_after: "beginner" },
    ],
  },
  "g2-solubility": {
    level: "intermediate", last_score: 55, session_count: 2, last_studied: "May 19",
    history: [
      { date: "May 19, 2025", quiz_score: 55, focus_score: 67, level_before: "beginner",      level_after: "intermediate" },
      { date: "May 14, 2025", quiz_score: 38, focus_score: 55, level_before: "beginner",      level_after: "beginner"     },
    ],
  },
  "g2-flame": {
    level: "beginner", last_score: 0, session_count: 0, last_studied: null,
    history: [],
  },
};
