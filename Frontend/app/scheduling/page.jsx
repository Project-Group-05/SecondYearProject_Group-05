"use client";

import { useState, useEffect } from 'react';

const BACKEND_URL = "http://127.0.0.1:8000";

export default function SchedulingPage() {
  const [studentEmail, setStudentEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 🔄 State key to trigger automated iframe refresh loops
  const [calendarKey, setCalendarKey] = useState(0);

  useEffect(() => {
    const student = JSON.parse(localStorage.getItem("student"));
    if (student?.email) {
      setStudentEmail(student.email);
    } else {
      setStudentEmail("student@edufx.com");
    }
  }, []);

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
          topic: topic,
          startTime: startDateTime,
          endTime: endDateTime
        })
      });

      const result = await response.json();
      setIsLoading(false);

      if (result.success) {
        setStatusMessage("🎉 Session booked successfully! Your slot has been updated below.");
        setTopic('');
        setDate('');
        setTime('');
        
        // 🔄 Increments key index to force immediate iframe data reload
        setCalendarKey(prev => prev + 1);
      } else {
        setStatusMessage(`❌ Booking failed: ${result.message}`);
      }
    } catch (err) {
      setIsLoading(false);
      setStatusMessage("❌ Server Error: Unable to communicate with backend.");
    }
  };

  // ⚠️ Remember to paste your real Google Calendar ID right here inside the quotes!
// 🌟 Change this to your real calendar ID email:
const calendarId = "nadarajayasinghe@gmail.com";
  const encodedCalendarId = encodeURIComponent(calendarId);

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "40px 20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b" }}>📅 Personal Study Planner</h1>
          <p style={{ color: "#64748b", marginTop: "5px" }}>Book a customized study slot directly into the system timeline.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "30px" }}>
          
          {/* Left Form */}
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "20px", color: "#0f172a" }}>Reserve a Slot</h2>
            
            <form onSubmit={handleScheduleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontWeight: "500", marginBottom: "8px", color: "#334155" }}>Target Focus Topic</label>
                <input 
                  type="text" 
                  placeholder="e.g., Thermal Stability or Solubility Trends" 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  required 
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "500", marginBottom: "8px", color: "#334155" }}>Select Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "500", marginBottom: "8px", color: "#334155" }}>Start Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              </div>

              <button type="submit" disabled={isLoading} style={{ padding: "14px", backgroundColor: "#1e40af", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", width: "100%" }}>
                {isLoading ? "Syncing Grid..." : "Schedule Session →"}
              </button>
            </form>

            {statusMessage && (
              <div style={{ marginTop: "20px", padding: "12px", borderRadius: "8px", backgroundColor: "#f1f5f9", fontWeight: "500", fontSize: "14px" }}>
                {statusMessage}
              </div>
            )}
          </div>

          {/* Right Calendar Grid Display */}
          <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "20px", color: "#0f172a" }}>Availability Grid</h2>
            <div style={{ width: "100%", flexGrow: 1, minHeight: "450px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
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
      </div>
    </div>
  );
}