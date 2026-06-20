"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../../(auth)/register/register.module.css';
import { FcGoogle } from "react-icons/fc";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reset Google loading state on mount (handles back-navigation edge case)
  useEffect(() => {
    setIsGoogleLoading(false);
  }, []);

  const validate = (name, value) => {
    let error = "";
    if (name === 'fullName' && value.length < 2) error = "Minimum 2 characters required";
    if (name === 'email' && !value.includes('@')) error = "Invalid email address";
    if (name === 'password' && value.length < 6) error = "Minimum 6 characters required";
    if (name === 'confirmPassword' && value !== formData.password) error = "Passwords do not match";
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validate(name, value);
  };

  const handleGoogleClick = async () => {
    setServerError('');
    setIsGoogleLoading(true);

     console.log("Fetching Google URL...");

    const timeout = setTimeout(() => {
      setIsGoogleLoading(false);
      setServerError("Google sign-in is taking too long. Please try again.");
    }, 10000);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/google/url`, {
        method: "GET",
      });

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Google URL result:", result);

      if (!result.success) {
        clearTimeout(timeout);
        setServerError(result.message || "Google sign-up failed.");
        setIsGoogleLoading(false);
        return;
      }

      clearTimeout(timeout);
      window.location.href = result.data.url;

    } catch (err) {
      clearTimeout(timeout);
      console.error("Google sign-up error:", err);
      setServerError("Could not connect to Google sign-in.");
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        setServerError(result.message || "Registration failed.");
      } else {
        localStorage.setItem('student', JSON.stringify({
          id: result.data.id,
          email: result.data.email,
          name: result.data.name,
          diagnostic_completed: result.data.diagnostic_completed,
          access_token: result.data.access_token,
        }));
        localStorage.setItem('access_token', result.data.access_token);
        localStorage.setItem('student_id', result.data.id);
        router.push('/diagnostic');
      }
    } catch (err) {
      setServerError("Could not reach the authentication server.");
      console.error("Signup network error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.fullName.length >= 2 &&
    formData.email.includes('@') &&
    formData.password.length >= 6 &&
    formData.password === formData.confirmPassword &&
    !isLoading &&
    !isGoogleLoading;

  return (
    <form className={styles.form} onSubmit={handleSubmit} autoComplete="off">
      {serverError && (
        <div className={styles.errorBanner}>
          <span>⚠️</span>
          <span>{serverError}</span>
        </div>
      )}

      <div className={styles.inputGroup}>
        <label>Full Name</label>
        <input
          name="fullName"
          type="text"
          placeholder="John Smith"
          value={formData.fullName}
          onChange={handleChange}
          className={errors.fullName ? styles.inputError : ''}
          autoComplete="off"
          required
        />
        {errors.fullName && <span className={styles.fieldErrorText}>{errors.fullName}</span>}
      </div>

      <div className={styles.inputGroup}>
        <label>Email Address</label>
        <input
          name="email"
          type="email"
          placeholder="john@gmail.com"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? styles.inputError : ''}
          autoComplete="off"
          required
        />
        {errors.email && <span className={styles.fieldErrorText}>{errors.email}</span>}
      </div>

      <div className={styles.inputGroup}>
        <label>Password</label>
        <div className={styles.passwordWrapper}>
          <input
            name="password"
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? styles.inputError : ''}
            autoComplete="off"
            required
          />
          <button type="button" onClick={() => setShowPass(!showPass)} className={styles.toggleBtn}>
            {showPass ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <span className={styles.fieldErrorText}>{errors.password}</span>}
      </div>

      <div className={styles.inputGroup}>
        <label>Confirm Password</label>
        <div className={styles.passwordWrapper}>
          <input
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={errors.confirmPassword ? styles.inputError : ''}
            autoComplete="off"
            required
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className={styles.toggleBtn}>
            {showConfirm ? "Hide" : "Show"}
          </button>
        </div>
        {errors.confirmPassword && <span className={styles.fieldErrorText}>{errors.confirmPassword}</span>}
      </div>

      <button
        type="submit"
        className={styles.registerBtn}
        disabled={!isFormValid}
      >
        {isLoading ? "Creating Account..." : "Sign Up"}
      </button>

      <div className={styles.divider}><span>OR</span></div>

      <button
        type="button"
        className={styles.googleBtn}
        onClick={handleGoogleClick}
        disabled={isGoogleLoading || isLoading}
      >
        <FcGoogle size={20} />
        {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
      </button>

      <div className={styles.footer}>
        <p>Already have an account? <Link href="/login">Sign in</Link></p>
      </div>
    </form>
  );
}