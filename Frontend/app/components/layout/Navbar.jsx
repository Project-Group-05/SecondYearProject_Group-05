"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

const BACKEND_URL = "http://127.0.0.1:8000";

export default function Navbar() {
  const [studentName, setStudentName] = useState('Student');
  const router = useRouter();

  useEffect(() => {
    // Read name directly from localStorage (saved during login)
    const student = JSON.parse(localStorage.getItem("student"));
    if (student?.name) {
      setStudentName(student.name);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const student = JSON.parse(localStorage.getItem("student"));

      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${student?.access_token}`
        }
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      router.push('/login');
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div>
          <h1 className={styles.appNameText}>Edu<span className={styles.logoAccent}>FX</span></h1>
        </div>

        <div className={styles.navLinks}>
          <Link href="/progress" className={styles.navItem}>Progress</Link>
        </div>

        <div className={styles.navLinks}>
          <Link href="/diagnostic/results" className={styles.navItem}>Results</Link>
        </div>

        <div className={styles.userSection}>
          <span className={styles.studentName}>Hello, {studentName}</span>
          <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
        </div>
      </div>
    </nav>
  );
}