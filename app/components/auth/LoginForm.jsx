"use client";

import { useState } from 'react';
import styles from '../../(auth)/login/login.module.css';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Logging in with:", email);
    //  call Firebase Auth 
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
          placeholder="john@gmail.com  " 
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
        Sign In
      </button>
      <div className={styles.footer}>
          <p>Don't have an account? <Link href="/register">Sign up</Link></p>
        </div>
    </form>
  );
}