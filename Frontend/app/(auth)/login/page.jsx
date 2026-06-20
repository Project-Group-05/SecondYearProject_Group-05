import LoginForm from '../../components/auth/LoginForm';
import styles from './login.module.css';
import Link from 'next/link';



export default function LoginPage() {
 return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <div className={styles.header}>
          <h1 className={styles.appNameText}>Edu<span className={styles.logoAccent}>FX</span></h1>
        </div>

        <LoginForm />

      </div>
    </div>
  );
}
