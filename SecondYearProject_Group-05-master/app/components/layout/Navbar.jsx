"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { createClient } from '../../utils/supabase/client';

export default function Navbar() {
  const [studentName, setStudentName] = useState('Student');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      // 1. Get the current active session user from Supabase Auth
      const { data: { user }, error } = await supabase.auth.getUser();

      if (user) {
        // 2. Check for Google OAuth metadata name, then standard registration metadata name
        const oauthName = user.user_metadata?.full_name;
        const customRegName = user.user_metadata?.name || user.user_metadata?.full_name;
        
        if (oauthName) {
          setStudentName(oauthName);
        } else if (customRegName) {
          setStudentName(customRegName);
        }
      } else {
        // 3. Fallback to localStorage if no Supabase session is present (for old email login test cases)
        const savedName = localStorage.getItem('name');
        if (savedName) {
          setStudentName(savedName);
        }
      }
    }

    fetchUser();
  }, []);

  const handleLogout = async () => {
    // 🟢 BACKEND CONNECTION FIXED: Sign out of Supabase to clear secure session cookies
    await supabase.auth.signOut();
    
    localStorage.clear(); // Clear local custom items
    router.push('/login'); // Redirect to login page 
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        {/* Logo / App Name  */}
        <div>
            <h1 className={styles.appNameText}>Edu<span className={styles.logoAccent}>FX</span></h1>
        </div>

        {/* Navigation Links [cite: 4, 185] */}
        <div className={styles.navLinks}>
          <Link href="/progress" className={styles.navItem}>
            Progress
          </Link>
        </div>

        <div className={styles.navLinks}>
          <Link href="/diagnostic/results" className={styles.navItem}>
            Results
          </Link>
        </div>

        {/* User Profile & Logout  */}
        <div className={styles.userSection}>
          <span className={styles.studentName}>Hello, {studentName}</span>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}