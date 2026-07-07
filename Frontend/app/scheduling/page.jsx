"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function SchedulingPage() {
  const [studentId, setStudentId] = useState(null);
  const [studentEmail, setStudentEmail] = useState('');
  const [subtopicsList, setSubtopicsList] = useState([]);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState('');
  const [selectedSubtopicName, setSelectedSubtopicName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);

  // Booked Sessions State (fetched from DB)
  const [bookedSessions, setBookedSessions] = useState([]);

  // User Availabilities States
  const [availabilities, setAvailabilities] = useState([
    { day_of_week: "Monday", time: "10:00" },
    { day_of_week: "Wednesday", time: "14:00" },
    { day_of_week: "Friday", time: "16:00" }
  ]);
  const [newDay, setNewDay] = useState("Monday");
  const [newTime, setNewTime] = useState("10:00");

  // Recommended Timetable States
  const [recommendedTimetable, setRecommendedTimetable] = useState([]);
  const [isTimetableLoading, setIsTimetableLoading] = useState(false);
  const [timetableStatus, setTimetableStatus] = useState('');

  useEffect(() => {
    const student = JSON.parse(localStorage.getItem("student"));
    if (student) {
      setStudentId(student.id);
      setStudentEmail(student.email || "student@edufx.com");
      fetchSubtopics(student.id);
      fetchBookedSessions(student.id);
    }
  }, []);

  const fetchSubtopics = async (studId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/progress/${studId}`);
      const result = await response.json();
      if (result.success && result.data?.progress) {
        const formatted = result.data.progress.map(item => ({
          id: item.subtopic_id,
          title: item.subtopics?.title,
          level: item.current_level || 'Beginner'
        }));
        setSubtopicsList(formatted);
        if (formatted.length > 0) {
          setSelectedSubtopicId(formatted[0].id);
          setSelectedSubtopicName(formatted[0].title);
        }
      }
    } catch (err) {
      console.error("Failed to fetch subtopics:", err);
    }
  };

  const fetchBookedSessions = async (studId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/scheduler/scheduled-sessions/${studId}`);
      const result = await response.json();
      if (result.success && result.data?.sessions) {
        setBookedSessions(result.data.sessions);
      }
    } catch (err) {
      console.error("Failed to fetch booked sessions from database:", err);
    }
  };

  const handleAddAvailability = () => {
    const exists = availabilities.some(a => a.day_of_week === newDay && a.time === newTime);
    if (!exists) {
      setAvailabilities([...availabilities, { day_of_week: newDay, time: newTime }]);
    }
  };

  const handleRemoveAvailability = (index) => {
    setAvailabilities(availabilities.filter((_, idx) => idx !== index));
  };

  const handleGenerateTimetable = async () => {
    if (availabilities.length === 0) {
      setTimetableStatus("❌ Please add at least one available study slot first.");
      return;
    }
    setIsTimetableLoading(true);
    setTimetableStatus('');
    setRecommendedTimetable([]);

    try {
      const response = await fetch(`${BACKEND_URL}/scheduler/generate-best-timetable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          availabilities: availabilities
        })
      });
      const result = await response.json();
      if (result.success && result.data?.timetable) {
        setRecommendedTimetable(result.data.timetable);
        setTimetableStatus("🎉 Timetable generated successfully! Review below and click sync to apply.");
      } else {
        setTimetableStatus(`❌ Timetable generation failed: ${result.message}`);
      }
    } catch (err) {
      console.error("Failed to generate timetable:", err);
      setTimetableStatus("❌ Server error generating optimized timetable.");
    } finally {
      setIsTimetableLoading(false);
    }
  };

  const handleSubtopicChange = (e) => {
    const id = e.target.value;
    setSelectedSubtopicId(id);
    const sub = subtopicsList.find(s => s.id.toString() === id.toString());
    if (sub) {
      setSelectedSubtopicName(sub.title);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage('');

    const startDateTime = `${date}T${time}:00`;
    const currentHour = parseInt(time.split(':')[0]);
    const currentMinutes = time.split(':')[1];
    const endHour = (currentHour + 1).toString().padStart(2, '0');
    const endDateTime = `${date}T${endHour}:${currentMinutes}:00`;

    try {
      const response = await fetch(`${BACKEND_URL}/scheduler/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: studentEmail,
          student_id: studentId,
          subtopic_id: selectedSubtopicId,
          topic: selectedSubtopicName,
          startTime: startDateTime,
          endTime: endDateTime
        })
      });

      const result = await response.json();
      setIsLoading(false);

      if (result.success) {
        setStatusMessage("🎉 Session booked successfully! Email reminder scheduled.");
        setDate('');
        setTime('');
        fetchBookedSessions(studentId);
        setCalendarKey(prev => prev + 1);
      } else {
        setStatusMessage(`❌ Booking failed: ${result.message}`);
      }
    } catch (err) {
      setIsLoading(false);
      setStatusMessage("❌ Server Error: Unable to communicate with backend.");
    }
  };

  const handleSyncTimetable = async () => {
    if (recommendedTimetable.length === 0) return;
    setIsTimetableLoading(true);
    setTimetableStatus('');

    try {
      const response = await fetch(`${BACKEND_URL}/scheduler/sync-timetable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          email: studentEmail,
          timetable: recommendedTimetable
        })
      });

      const result = await response.json();
      setIsTimetableLoading(false);

      if (result.success) {
        setTimetableStatus("🎉 Timetable fully synced! Email reminders scheduled on study days.");
        fetchBookedSessions(studentId);
        setCalendarKey(prev => prev + 1);
      } else {
        setTimetableStatus(`❌ Timetable sync failed: ${result.message}`);
      }
    } catch (err) {
      setIsTimetableLoading(false);
      setTimetableStatus("❌ Network Error: Unable to sync recommended timetable.");
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (!confirm("Are you sure you want to cancel this scheduled study session?")) return;
    try {
      const response = await fetch(`${BACKEND_URL}/scheduler/cancel/${sessionId}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (result.success) {
        fetchBookedSessions(studentId);
        setCalendarKey(prev => prev + 1);
      } else {
        alert(`Failed to cancel session: ${result.message}`);
      }
    } catch (err) {
      console.error("Failed to cancel session:", err);
    }
  };

  const calendarId = "nadarajayasinghe@gmail.com";
  const encodedCalendarId = encodeURIComponent(calendarId);

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "40px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b", letterSpacing: "-0.5px" }}>📅 Personalized Study Planner</h1>
            <p style={{ color: "#64748b", marginTop: "4px", fontSize: "16px" }}>Add your available hours, let the AI allocate subtopics by score priority, and get email reminders.</p>
          </div>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "#1d4ed8", fontWeight: "600", fontSize: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
            ← Back to Dashboard
          </Link>
        </div>

        {/* Top Section: Manual Form + Calendar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px", marginBottom: "40px" }}>
          
          {/* Manual Scheduler Form */}
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px", color: "#0f172a" }}>Schedule a Session</h2>
            
            <form onSubmit={handleScheduleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "14px", marginBottom: "8px", color: "#475569" }}>Select Subtopic</label>
                <select
                  value={selectedSubtopicId}
                  onChange={handleSubtopicChange}
                  required
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", fontSize: "15px", outline: "none" }}
                >
                  {subtopicsList.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.title} ({sub.level})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "600", fontSize: "14px", marginBottom: "8px", color: "#475569" }}>Select Date</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    required 
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none" }} 
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: "600", fontSize: "14px", marginBottom: "8px", color: "#475569" }}>Start Time</label>
                  <input 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)} 
                    required 
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none" }} 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                style={{ padding: "14px", backgroundColor: "#1e3a8a", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", width: "100%", fontSize: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
              >
                {isLoading ? "Booking..." : "Schedule Session →"}
              </button>
            </form>

            {statusMessage && (
              <div style={{ marginTop: "20px", padding: "14px", borderRadius: "8px", backgroundColor: statusMessage.startsWith("❌") ? "#fef2f2" : "#f0fdf4", color: statusMessage.startsWith("❌") ? "#991b1b" : "#166534", fontWeight: "600", fontSize: "14px", border: "1px solid" }}>
                {statusMessage}
              </div>
            )}
          </div>

          {/* Calendar Display */}
          <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px", color: "#0f172a" }}>Google Calendar Integration</h2>
            <div style={{ width: "100%", flexGrow: 1, minHeight: "400px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
              <iframe 
                key={calendarKey}
                src={`https://calendar.google.com/calendar/embed?src=${encodedCalendarId}&ctz=Asia%2FColombo&mode=WEEK`}
                style={{ border: "0", width: "100%", height: "100%" }}
                frameBorder="0" 
                scrolling="no"
              ></iframe>
            </div>
          </div>

        </div>

        {/* 🌟 NEW DATABASE SESSIONS GRID: Displays active local scheduled slots */}
        <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)", border: "1px solid #e2e8f0", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>📋 Your Active Scheduled Study Sessions</h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>These slots are saved in your dashboard and scheduled for automatic email reminders.</p>
          
          {bookedSessions.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: "15px", fontStyle: "italic" }}>
              No active study sessions scheduled yet. Use the scheduler form above or generate a custom AI timetable below to begin.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
              {bookedSessions.map((session) => (
                <div key={session.id} style={{ padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "800", color: "#1e3a8a" }}>📆 {session.date}</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "50px", backgroundColor: session.status === "Reminded" ? "#dbeafe" : "#dcfce7", color: session.status === "Reminded" ? "#1e40af" : "#15803d" }}>
                        {session.status}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginBottom: "6px", lineHeight: "1.4" }}>{session.subtopic_name}</h3>
                    <div style={{ fontSize: "14px", color: "#64748b", fontWeight: "600" }}>⏰ Time: {session.time}</div>
                  </div>
                  <button
                    onClick={() => handleCancelSession(session.id)}
                    style={{ marginTop: "16px", padding: "8px 16px", border: "1px solid #fecaca", backgroundColor: "#fff", color: "#dc2626", borderRadius: "6px", fontSize: "13px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = "#fef2f2"; }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = "#fff"; }}
                  >
                    Cancel Study Slot
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Availabilities & AI Timetable Generation */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>
          
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)", border: "1px solid #e2e8f0" }}>
            
            {/* Slot Picker Form */}
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>📅 Define Your Free Hours</h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>Add times throughout the week when you are free to study. The AI will distribute subtopics weighted by priority.</p>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "flex-end", marginBottom: "30px", borderBottom: "1px solid #e2e8f0", paddingBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "13px", marginBottom: "8px", color: "#475569" }}>Day of Week</label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", outline: "none", fontSize: "15px" }}
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "13px", marginBottom: "8px", color: "#475569" }}>Free Time</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "15px" }}
                />
              </div>

              <button
                onClick={handleAddAvailability}
                style={{ padding: "11px 20px", backgroundColor: "#0f172a", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}
              >
                + Add Free Slot
              </button>
            </div>

            {/* Availability Chips */}
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#475569", marginBottom: "12px" }}>Your Free Slots:</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "30px" }}>
              {availabilities.map((slot, index) => (
                <div key={index} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "50px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                  <span>{slot.day_of_week} at {slot.time}</span>
                  <button onClick={() => handleRemoveAvailability(index)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444", fontSize: "15px", display: "flex", alignItems: "center", padding: 0 }}>
                    ×
                  </button>
                </div>
              ))}
              {availabilities.length === 0 && (
                <p style={{ color: "#94a3b8", fontSize: "14px", fontStyle: "italic", margin: 0 }}>No free hours added yet. Please define your availability.</p>
              )}
            </div>

            <button
              onClick={handleGenerateTimetable}
              disabled={isTimetableLoading || availabilities.length === 0}
              style={{ padding: "14px 28px", backgroundColor: "#1e3a8a", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "15px", display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              {isTimetableLoading ? "Generating..." : "Generate AI-Optimized Timetable"}
            </button>

          </div>

          {/* Timetable Results Grid */}
          {(recommendedTimetable.length > 0 || timetableStatus) && (
            <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)", border: "1px solid #e2e8f0" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "15px" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>📚 AI-Allocated Weekly Timetable</h3>
                  <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>Weaker modules (Beginner/Intermediate) have been allocated more slots.</p>
                </div>
                {recommendedTimetable.length > 0 && (
                  <button
                    onClick={handleSyncTimetable}
                    disabled={isTimetableLoading}
                    style={{ padding: "12px 24px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    {isTimetableLoading ? "Syncing..." : "Sync Custom Timetable to Calendar"}
                  </button>
                )}
              </div>

              {timetableStatus && (
                <div style={{ marginBottom: "20px", padding: "14px", borderRadius: "8px", backgroundColor: timetableStatus.startsWith("❌") ? "#fef2f2" : "#f0fdf4", color: timetableStatus.startsWith("❌") ? "#991b1b" : "#166534", fontWeight: "600", fontSize: "14px", border: "1px solid" }}>
                  {timetableStatus}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                {recommendedTimetable.map((slot, index) => {
                  const getLvlColor = (lvl) => {
                    const l = lvl.toLowerCase();
                    if (l === "advanced") return { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" };
                    if (l === "intermediate") return { bg: "#fef9c3", border: "#fef08a", text: "#713f12" };
                    return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" };
                  };
                  const colors = getLvlColor(slot.level);
                  return (
                    <div key={index} style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.bg, padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>{slot.day_of_week}</span>
                          <span style={{ fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "50px", backgroundColor: "#fff", border: `1px solid ${colors.border}`, color: colors.text }}>{slot.level}</span>
                        </div>
                        <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "8px", lineHeight: "1.4" }}>{slot.subtopic_name}</h4>
                        <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 16px 0", lineHeight: "1.4" }}>{slot.reason}</p>
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e3a8a", display: "flex", alignItems: "center", gap: "4px" }}>
                        ⏰ {slot.time} (1 Hour)
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}