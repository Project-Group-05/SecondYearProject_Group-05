"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

const BACKEND_URL = "http://127.0.0.1:8000";

function CallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash;
      const query = window.location.search;

      console.log("HASH:", hash);
      console.log("QUERY:", query);

      // ── Case 1: Hash fragment flow (#access_token=...) ──
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1)); // remove #
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const error = params.get('error');

        if (error) {
          router.push(`/login?error=${encodeURIComponent(error)}`);
          return;
        }

        if (!accessToken) {
          router.push('/login?error=no_token');
          return;
        }

        // Send token to backend to get student profile
        try {
          const response = await fetch(`${BACKEND_URL}/auth/google/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken })
          });

          const result = await response.json();
          console.log("TOKEN RESULT:", result);

          if (!result.success) {
            router.push(`/login?error=${encodeURIComponent(result.message || 'token_failed')}`);
            return;
          }

          localStorage.setItem("student", JSON.stringify(result.data));
          localStorage.setItem("access_token", result.data.access_token);
          localStorage.setItem("student_id", result.data.id);

          if (result.data.diagnostic_completed) {
            router.push('/dashboard');
          } else {
            router.push('/diagnostic');
          }

        } catch (err) {
          console.error("Token exchange error:", err);
          router.push('/login?error=server_unreachable');
        }
        return;
      }

      // ── Case 2: Code flow (?code=...) ──
      const searchParams = new URLSearchParams(query);
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        router.push(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      if (!code) {
        router.push('/login?error=no_code');
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/auth/google/callback?code=${code}`, {
          method: "GET",
        });

        const result = await response.json();
        console.log("BACKEND RESULT:", result);

        if (!result.success) {
          router.push(`/login?error=${encodeURIComponent(result.message || 'google_failed')}`);
          return;
        }

        localStorage.setItem("student", JSON.stringify(result.data));
        localStorage.setItem("access_token", result.data.access_token);
        localStorage.setItem("student_id", result.data.id);

        if (result.data.diagnostic_completed) {
          router.push('/dashboard');
        } else {
          router.push('/diagnostic');
        }

      } catch (err) {
        router.push('/login?error=server_unreachable');
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#6b7280', fontSize: '14px' }}>Signing you in with Google...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>}>
      <CallbackHandler />
    </Suspense>
  );
}