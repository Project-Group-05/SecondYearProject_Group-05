// components/auth/RegisterForm.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerStudent } from '../../utils/supabase/actions';
import styles from '../../(auth)/register/register.module.css';

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
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const isFormValid = 
    formData.fullName.length >= 2 && 
    formData.email.includes('@') && 
    formData.password.length >= 6 && 
    formData.password === formData.confirmPassword &&
    !isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setIsLoading(true);

    // Prepare native form data for the Server Action
    const rawFormData = new FormData();
    rawFormData.append('fullName', formData.fullName);
    rawFormData.append('email', formData.email);
    rawFormData.append('password', formData.password);

    const result = await registerStudent(rawFormData);

    setIsLoading(false);

    if (result?.error) {
      setServerError(result.error);
    } else if (result?.success) {
      // Instead of relying on localStorage, Supabase cookies manage session data safely.
      // Redirect to your diagnostic phase directly.
      router.push('/diagnostic');
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
       {serverError && (
            <div className={styles.errorBanner}>
              <span>⚠️</span>
              <span>{serverError}</span>
            </div>
      )}

      <div className={styles.inputGroup}>
        <label>Full Name</label>
        <input name="fullName" type="text" placeholder="John Smith" value={formData.fullName} onChange={handleChange} className={errors.fullName ? styles.inputError : ''} required />
        {errors.fullName && <span className={styles.fieldErrorText}>{errors.fullName}</span>}
      </div>

      <div className={styles.inputGroup}>
        <label>Email Address</label>
        <input name="email" type="email" placeholder="john@gmail.com" value={formData.email} onChange={handleChange} className={errors.email ? styles.inputError : ''} required />
        {errors.email && <span className={styles.fieldErrorText}>{errors.email}</span>}
      </div>

      <div className={styles.inputGroup}>
        <label>Password</label>
        <div className={styles.passwordWrapper}>
          <input name="password" type={showPass ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} className={errors.password ? styles.inputError : ''} required />
          <button type="button" onClick={() => setShowPass(!showPass)} className={styles.toggleBtn}>
            {showPass ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <span className={styles.fieldErrorText}>{errors.password}</span>}
      </div>

      <div className={styles.inputGroup}>
        <label>Confirm Password</label>
        <div className={styles.passwordWrapper}>
          <input name="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} className={errors.confirmPassword ? styles.inputError : ''} required />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className={styles.toggleBtn}>
            {showConfirm ? "Hide" : "Show"}
          </button>
        </div>
        {errors.confirmPassword && <span className={styles.fieldErrorText}>{errors.confirmPassword}</span>}
      </div>

      <button type="submit" className={styles.registerBtn} disabled={!isFormValid}>
        {isLoading ? "Creating Account..." : "Sign Up"}
      </button>

      <div className={styles.footer}>
        <p>Already have an account? <Link href="/login">Sign in</Link></p>
      </div>
    </form>
  );
}