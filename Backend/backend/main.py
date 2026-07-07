from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from datetime import datetime

from database import supabase
from utils.email_helper import send_email_reminder

from auth.router import router as auth_router
from diagnostic.router import router as diagnostic_router
from content.router import router as content_router
from quiz.router import router as quiz_router
from results.router import router as results_router
from explanation.router import router as explanation_router
from progress.router import router as progress_router
from behaviour.router import router as behaviour_router
from scheduler.router import router as scheduler_router

app = FastAPI(title="Adaptive Chemistry API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
                   "http://127.0.0.1:3000",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,        prefix="/auth")
app.include_router(diagnostic_router,  prefix="/diagnostic")
app.include_router(content_router,     prefix="/content")
app.include_router(quiz_router,        prefix="/quiz")
app.include_router(results_router,     prefix="/results")
app.include_router(explanation_router, prefix="/explanation")
app.include_router(progress_router,    prefix="/progress")
app.include_router(behaviour_router,   prefix="/behaviour")
app.include_router(scheduler_router,   prefix="/scheduler", tags=["Scheduler"])

async def run_daily_reminder_check():
    while True:
        try:
            print("[SCHEDULER] Checking for upcoming study sessions today...")
            now = datetime.now()
            today_str = now.strftime("%Y-%m-%d")
            
            # Fetch all scheduled sessions for today
            res = supabase.table("session_summary").select("*").eq("session_date", today_str).execute()
            
            for session in res.data:
                lock_reason = session.get("lock_reason") or ""
                # We check if it is a scheduled booking and not reminded yet
                if lock_reason.startswith("scheduled:") and not lock_reason.endswith(":reminded"):
                    scheduled_time = lock_reason.replace("scheduled:", "")
                    student_id = session.get("student_id")
                    subtopic_id = session.get("subtopic_id")
                    
                    # Fetch student info
                    student_res = supabase.table("students").select("name, email").eq("id", student_id).execute()
                    # Fetch subtopic info
                    subtopic_res = supabase.table("subtopics").select("title").eq("id", subtopic_id).execute()
                    
                    if student_res.data and subtopic_res.data:
                        student_name = student_res.data[0]["name"]
                        student_email = student_res.data[0]["email"]
                        subtopic_title = subtopic_res.data[0]["title"]
                        
                        # Trigger email helper
                        success = send_email_reminder(
                            to_email=student_email,
                            student_name=student_name,
                            subtopic_title=subtopic_title,
                            scheduled_time=scheduled_time
                        )
                        
                        if success:
                            # Update to prevent multiple emails
                            supabase.table("session_summary")\
                                .update({"lock_reason": f"{lock_reason}:reminded"})\
                                .eq("id", session["id"])\
                                .execute()
                            print(f"[SCHEDULER] Sent reminder and updated session {session['id']}")
        except Exception as e:
            print(f"[SCHEDULER ERROR] Background loop exception: {str(e)}")
            
        # Check every hour (3600 seconds)
        await asyncio.sleep(3600)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(run_daily_reminder_check())

@app.get("/")
def root():
    return {"message": "Adaptive Chemistry API is running"}