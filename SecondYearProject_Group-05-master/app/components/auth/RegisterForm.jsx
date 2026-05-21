"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from '../../(auth)/register/register.module.css';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
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
    formData.password === formData.confirmPassword; 

  return (
    <form className={styles.form}>
      <div className={styles.inputGroup}>
        <label>Full Name</label>
        <input name="fullName" type="text" placeholder="John Smith" onChange={handleChange} className={errors.fullName ? styles.inputError : ''} required />
        {errors.fullName && <span className={styles.fieldErrorText}>{errors.fullName}</span>}
      </div>

      <div className={styles.inputGroup}>
        <label>Email Address</label>
        <input name="email" type="email" placeholder="john@gmail.com" onChange={handleChange} className={errors.email ? styles.inputError : ''} required />
        {errors.email && <span className={styles.fieldErrorText}>{errors.email}</span>}
      </div>

      <div className={styles.inputGroup}>
        <label>Password</label>
        <div className={styles.passwordWrapper}>
          <input name="password" type={showPass ? "text" : "password"} placeholder="••••••••" onChange={handleChange} className={errors.password ? styles.inputError : ''} required />
          <button type="button" onClick={() => setShowPass(!showPass)} className={styles.toggleBtn}></button>
        </div>
        {errors.password && <span className={styles.fieldErrorText}>{errors.password}</span>}
      </div>

      <div className={styles.inputGroup}>
        <label>Confirm Password</label>
        <div className={styles.passwordWrapper}>
          <input name="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="••••••••" onChange={handleChange} className={errors.confirmPassword ? styles.inputError : ''} required />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className={styles.toggleBtn}></button>
        </div>
        {errors.confirmPassword && <span className={styles.fieldErrorText}>{errors.confirmPassword}</span>}
      </div>

      {/* --- BACKEND CONNECTION ---
          POST /auth/register
          On success: Save student_id/name to localStorage, redirect to /diagnostic
      */}

      <button type="submit" className={styles.registerBtn} disabled={!isFormValid}>
        Sign Up
      </button>

      <div className={styles.footer}>
        <p>Already have an account? <Link href="/login">Sign in</Link></p>
      </div>
    </form>
  );
}