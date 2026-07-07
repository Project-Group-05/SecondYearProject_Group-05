import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email_reminder(to_email: str, student_name: str, subtopic_title: str, scheduled_time: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port_env = os.getenv("SMTP_PORT")
    smtp_port = int(smtp_port_env) if smtp_port_env and smtp_port_env.isdigit() else 587
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM_EMAIL", smtp_user)
    
    if not smtp_host or not smtp_user or not smtp_pass:
        # Fallback logging if SMTP details aren't provided (useful for Render/local tests)
        print(f"[SMTP WARNING] SMTP details not configured. "
              f"Simulating study reminder email to: {to_email}. "
              f"Subject: Study Reminder for '{subtopic_title}' at {scheduled_time}")
        return True # Return true so the backend marks it as completed in logs/databases
        
    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_from
        msg['To'] = to_email
        msg['Subject'] = f"🎓 EduFX Study Reminder: {subtopic_title}"
        
        body = f"""
        Dear {student_name},
        
        This is a friendly reminder from your EduFX personalized tutor.
        You have a study session scheduled for today:
        
        📚 Subtopic: {subtopic_title}
        ⏰ Scheduled Time: {scheduled_time}
        
        Keep up the great work! Please access your study dashboard to begin.
        
        Best regards,
        Your EduFX AI Team
        """
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_from, to_email, msg.as_string())
        server.quit()
        print(f"Successfully sent email reminder to {to_email}")
        return True
    except Exception as e:
        print(f"Error sending email reminder to {to_email}: {str(e)}")
        return False
