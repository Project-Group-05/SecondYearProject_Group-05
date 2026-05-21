"use client";

import { useState } from 'react';
import styles from '../../(auth)/login/login.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FcGoogle } from "react-icons/fc";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleClick = async () => {
    setIsLoading(true);
    try {
      /* 
        1. Trigger Auth Provider (Supabase / Firebase Client SDK)
        Example for Supabase client:
        const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
        const idToken = data.session?.access_token;
      */
      const idToken = "MOCK_TOKEN_FROM_PROVIDER"; // Replace with your live SDK token extraction logic

      // 2. Send Token to your FastAPI Backend
     // Change from 127.0.0.1 to localhost
const response = await fetch('http://localhost:8000/auth/google', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      // FIX #1: Match backend response schema (.success instead of .status)
      if (result.success) {
        // FIX #2: Store the token so subsequent endpoints can use it for Authorization headers
        localStorage.setItem('access_token', idToken);
        localStorage.setItem('student_id', result.data.student_id);
        
        // Redirect seamlessly based on backend database diagnostic tracking
        if (result.data.diagnostic_completed) {
          router.push('/dashboard');
        } else {
          router.push('/diagnostic-test');
        }
      } else {
        console.error("Backend Auth Rejected:", result.message);
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Logging in with standard credentials:", email);
      
      /* TODO: Integrate standard login logic here if needed:
         const idToken = await signInWithEmailAndPassword(auth, email, password);
      */
      
      router.push('/dashboard'); 
      
    } catch (error) {
      console.error("Login failed:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    email.includes('@') &&
    password.length >= 6 &&
    !emailError &&
    !passwordError;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.inputGroup}>
        <label>Email</label>
        <input 
          type="email" 
          placeholder="john@gmail.com" 
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(!e.target.value.includes('@') && e.target.value !== '');
          }}
          className={emailError ? styles.inputError : ''}  
          required
        />
        {emailError && <small className={styles.fieldErrorText}>Invalid email</small>}
      </div>
      
      <div className={styles.inputGroup}>
        <label>Password</label>
        <input 
          type="password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => {
            setPassword(e.target.value); 
            setPasswordError(e.target.value.length < 6 && e.target.value !== '');
          }}
          className={passwordError ? styles.inputError : ''} 
          required
        />
        {passwordError && <small className={styles.fieldErrorText}>Password must be at least 6 characters</small>}
      </div>

      <button type="submit" className={styles.loginBtn} disabled={!isFormValid || isLoading}>
        {isLoading ? 'Processing...' : 'Sign In'}
      </button>

      <div className={styles.divider}><span>OR</span></div>

      {/* FIX #3: Set type="button" explicitly so it doesn't fire the standard HTML form submission handler */}
      <button 
        type="button"
        className={styles.googleBtn} 
        onClick={handleGoogleClick}
        disabled={isLoading}
      >
        <FcGoogle size={20} />
        {isLoading ? 'Connecting...' : 'Continue with Google'}
      </button>

      <div className={styles.footer}>
        <p>Don't have an account? <Link href="/register">Sign up</Link></p>
      </div>
    </form>
  );
}
