// components/auth/LoginForm.jsx
"use client";

import { useState } from 'react';
import styles from '../../(auth)/login/login.module.css'; // Make sure this path correctly hits your CSS module location
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FcGoogle } from "react-icons/fc";
import { loginStudent } from '../../utils/supabase/actions'; 
import { createClient } from '../../utils/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  
  // These hooks must stay right here inside the functional block component
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [serverError, setServerError] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleClick = async () => {
    setServerError('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Supabase redirects back here after the user logs into Google
          // window.location.origin dynamically becomes http://localhost:3000 in dev
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setServerError(error.message);
        setIsLoading(false);
      }
      // Note: If successful, the browser will automatically navigate away to Google's login screen.
    } catch (err) {
      console.error("Google login initiation crash:", err);
      setServerError("Could not connect to Google sign-in.");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setIsLoading(true);

    try {
      console.log("Attempting login for:", email);
      
      // 1. Pack the form inputs into native FormData for the Server Action
      const rawFormData = new FormData();
      rawFormData.append('email', email);
      rawFormData.append('password', password);

      // 2. Call the backend login action from utils/supabase/actions.ts
      const result = await loginStudent(rawFormData);

      // 3. Handle the response schema
      if (result?.error) {
        // This captures 'Invalid email or password!' and updates the state
        setServerError(result.error);
      } else if (result?.success) {
        // If successful, redirect the user seamlessly to the dashboard
        router.push('/dashboard'); 
      }
    } catch (error) {
      console.error("Login submission execution error:", error);
      setServerError("An unexpected runtime connection error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    email.includes('@') &&
    password.length >= 6 &&
    !emailError &&
    !passwordError &&
    !isLoading;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {serverError && (
      <div className={styles.errorBanner}>
        <span>⚠️</span>
        <span>{serverError}</span>
      </div>
    )}

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

      <button type="submit" className={styles.loginBtn} disabled={!isFormValid}>
        {isLoading ? 'Processing...' : 'Sign In'}
      </button>

      <div className={styles.divider}><span>OR</span></div>

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
<<<<<<< HEAD
}
=======
}
>>>>>>> 1aeca1be5e804b85d646b87891612e0e9c2b7d4e
