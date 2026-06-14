"use client";

import { useEffect, useState } from "react";

export default function TestConnection() {
  const [backendResponse, setBackendResponse] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Testing connection...");

  useEffect(() => {
    // Replace with your python backend URL if different
    const BACKEND_URL = "http://127.0.0.1:8000"; 

    fetch(`${BACKEND_URL}/api/connection-test`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setBackendResponse(data);
        setConnectionStatus("Connected successfully!");
      })
      .catch((err) => {
        console.error("Connection Error details:", err);
        setConnectionStatus("Connection Failed. Check browser console (F12).");
      });
  }, []);

  return (
    <div style={{ padding: "30px", fontFamily: "sans-serif" }}>
      <h1>Frontend $\leftrightarrow$ Backend Connection Status</h1>
      <p>Status: <strong>{connectionStatus}</strong></p>
      
      {backendResponse && (
        <div style={{ background: "#f0f0f0", padding: "15px", borderRadius: "5px" }}>
          <p><strong>Response from Python:</strong></p>
          <pre>{JSON.stringify(backendResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}