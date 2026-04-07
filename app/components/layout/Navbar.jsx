"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [studentName, setStudentName] = useState('Student');
  const router = useRouter();

  useEffect(() => {
    // Access localStorage to get the saved name after login [cite: 14]
    const savedName = localStorage.getItem('name');
    if (savedName) {
      setStudentName(savedName);
    }
  }, []);

  const handleLogout = () => {
    // --- BACKEND CONNECTION ---
    // Optional: Call POST /auth/logout if using server-side sessions
    
    localStorage.clear(); // Clear student_id and name [cite: 4, 185]
    router.push('/login'); // Redirect to login page 
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        {/* Logo / App Name  */}
        <Link href="/dashboard" className={styles.logo}>
          Adaptive Chemistry
        </Link>

        {/* Navigation Links [cite: 4, 185] */}
        <div className={styles.navLinks}>
          <Link href="/progress" className={styles.navItem}>
            My Progress
          </Link>
        </div>

        {/* User Profile & Logout  */}
        <div className={styles.userSection}>
          <span className={styles.studentName}>Hello, {studentName}</span>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
        
        {/* Mobile Menu Icon  */}
        <button className={styles.mobileMenuIcon} aria-label="Menu">
          ☰
        </button>
      </div>
    </nav>
  );
}