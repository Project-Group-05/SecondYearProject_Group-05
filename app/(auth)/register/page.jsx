import RegisterForm from '../../components/auth/RegisterForm';
import styles from './register.module.css';

export default function RegisterPage() {
  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <div className={styles.header}>
          <h1 className={styles.appNameText}>Adaptive Chemistry</h1>
          <p className={styles.pageSubtitleText}>Create your account to start learning.</p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}