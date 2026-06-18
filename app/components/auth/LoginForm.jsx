"use client";

import { useState } from 'react';
import styles from '../../(auth)/login/login.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BACKEND_URL = "http://127.0.0.1:8000";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!result.success) {
        setServerError(result.message || "Login failed.");
      } else {
        localStorage.setItem("student", JSON.stringify(result.data));
        localStorage.setItem("access_token", result.data.access_token);
        localStorage.setItem("student_id", result.data.id);
        router.push('/dashboard');
      }
    } catch (err) {
      console.error("Login error:", err);
      setServerError("Could not reach the server.");
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

      <div className={styles.footer}>
        <p>Don't have an account? <Link href="/register">Sign up</Link></p>
      </div>
    </form>
  );
}