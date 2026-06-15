"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const BACKEND_URL = "http://127.0.0.1:8000";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      // Google sends ?code=... and ?state=... in the URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        router.push('/login?error=google_cancelled');
        return;
      }

      if (!code) {
        router.push('/login?error=no_code');
        return;
      }

      try {
        // Send the code to your FastAPI backend to exchange for tokens
        const response = await fetch(`${BACKEND_URL}/auth/google/callback?code=${code}&state=${state}`, {
          method: "GET",
        });

        const result = await response.json();

        if (!result.success) {
          router.push(`/login?error=${encodeURIComponent(result.message || 'google_failed')}`);
          return;
        }

        // Same storage pattern as login/register
        localStorage.setItem("student", JSON.stringify(result.data));
        localStorage.setItem("access_token", result.data.access_token);
        localStorage.setItem("student_id", result.data.id);

        // New user → diagnostic, existing user → dashboard
        if (result.data.diagnostic_completed) {
          router.push('/dashboard');
        } else {
          router.push('/diagnostic');
        }

      } catch (err) {
        console.error("Callback error:", err);
        router.push('/login?error=server_unreachable');
      }
    };

    handleCallback();
  }, [searchParams, router]);

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