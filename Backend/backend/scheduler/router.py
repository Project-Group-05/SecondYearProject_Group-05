from fastapi import APIRouter, Request
from scheduler.service import get_todays_plan, generate_recommended_timetable, generate_best_timetable
from utils.response import success_response, error_response
from google.oauth2 import service_account
from googleapiclient.discovery import build
import os
import database

router = APIRouter()

# --- Google Calendar Google Cloud Engine Setup ---
SCOPES = ['https://www.googleapis.com/auth/calendar']
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), '..', 'google_creds.json')

def get_calendar_service():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build('calendar', 'v3', credentials=creds)


# --- GET: Fetch Today's Student Plan ---
@router.get("/todays-plan/{student_id}")
def todays_plan(student_id: int):
    try:
        plan = get_todays_plan(student_id)
        return success_response("Today's plan ready", {"plan": plan})
    except Exception as e:
        return error_response(str(e))


# --- POST: Schedule Live Google Calendar Event Slot ---
@router.post("/schedule")
async def create_study_session(request: Request):
    try:
        payload = await request.json()
        student_email = payload.get("email")
        topic = payload.get("topic", "General Study Session")
        start_time = payload.get("startTime")  
        end_time = payload.get("endTime")      
        subtopic_id = payload.get("subtopic_id")
        student_id = payload.get("student_id")

        if not student_email or not start_time or not end_time:
            return error_response("Missing required scheduling parameters.")

        # 1. Resolve student_id if not passed directly
        if not student_id:
            student_res = database.supabase.table("students").select("id").eq("email", student_email).execute()
            if student_res.data:
                student_id = student_res.data[0]["id"]
            else:
                return error_response(f"Student record not found for email: {student_email}")

        # 2. If subtopic_id is provided, resolve name and store booking in database
        if subtopic_id:
            subtopic_res = database.supabase.table("subtopics").select("title").eq("id", subtopic_id).execute()
            if subtopic_res.data:
                topic = subtopic_res.data[0]["title"]
            
            # Store in session_summary database table (quiz_score=None denotes scheduled booking)
            session_date = start_time.split("T")[0]
            database.supabase.table("session_summary").insert({
                "student_id": student_id,
                "subtopic_id": subtopic_id,
                "session_date": session_date,
                "lock_reason": f"scheduled:{start_time}",
                "webcam_enabled": False,
                "locked": False
            }).execute()

        # 3. Google Calendar insertion (with graceful fallback if credentials are missing)
        event_link = None
        if os.path.exists(SERVICE_ACCOUNT_FILE):
            try:
                service = get_calendar_service()
                calendar_id = os.getenv("GOOGLE_CALENDAR_ID")

                # 🌟 Cleaned Event Payload Configuration Structure
                event_body = {
                    'summary': f'🎓 Study Session: {topic}',
                    'description': f'Automated study appointment for {topic} synced via EduFX platform.',
                    'start': {
                        'dateTime': start_time,
                        'timeZone': 'Asia/Colombo',
                    },
                    'end': {
                        'dateTime': end_time,
                        'timeZone': 'Asia/Colombo',
                    },
                    'reminders': {
                        'useDefault': False,
                        'overrides': [
                            {'method': 'popup', 'minutes': 15},
                        ],
                    },
                }

                event = service.events().insert(
                    calendarId=calendar_id, 
                    body=event_body
                ).execute()
                event_link = event.get('htmlLink')
            except Exception as cal_err:
                print(f"[GOOGLE CALENDAR WARNING] Calendar Event Creation Failed: {str(cal_err)}")
        else:
            print("[GOOGLE CALENDAR WARNING] credentials file 'google_creds.json' not found. Skipping Google Calendar Sync.")

        return success_response(
            "Study session successfully booked!" if event_link else "Study session saved to dashboard planner! (Google Calendar sync skipped: credentials file missing)", 
            {"event_link": event_link, "success": True}
        )

    except Exception as e:
        return error_response(f"Booking Failed: {str(e)}")


# --- GET: Fetch AI Recommended Timetable ---
@router.get("/recommended-timetable/{student_id}")
def get_recommended_timetable_api(student_id: int):
    try:
        timetable = generate_recommended_timetable(student_id)
        return success_response("AI recommended weekly timetable generated.", {"timetable": timetable})
    except Exception as e:
        return error_response(str(e))


# --- POST: Sync Full Recommended Timetable ---
@router.post("/sync-timetable")
async def sync_recommended_timetable(request: Request):
    try:
        payload = await request.json()
        student_id = payload.get("student_id")
        student_email = payload.get("email")
        timetable_slots = payload.get("timetable", [])

        if not student_id or not student_email:
            return error_response("Missing required parameters: student_id or email.")

        from datetime import datetime, timedelta
        day_map = {
            "monday": 0, "tuesday": 1, "wednesday": 2, 
            "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6
        }

        now = datetime.now()
        today_weekday = now.weekday() # Monday=0, Sunday=6

        # Check for service account file
        has_creds = os.path.exists(SERVICE_ACCOUNT_FILE)
        service = None
        calendar_id = None
        if has_creds:
            try:
                service = get_calendar_service()
                calendar_id = os.getenv("GOOGLE_CALENDAR_ID")
            except Exception as cal_setup_err:
                print(f"[GOOGLE CALENDAR WARNING] Failed to setup calendar service: {str(cal_setup_err)}")
                has_creds = False
        else:
            print("[GOOGLE CALENDAR WARNING] credentials file 'google_creds.json' not found. Skipping Google Calendar Sync.")

        synced_events = []

        for slot in timetable_slots:
            day = slot.get("day_of_week", "").lower()
            time_str = slot.get("time", "16:00")
            subtopic_id = slot.get("subtopic_id")
            subtopic_name = slot.get("subtopic_name", "Study Session")

            if day not in day_map or not subtopic_id:
                continue

            target_weekday = day_map[day]
            
            # Calculate date offset: next upcoming day of week
            days_ahead = target_weekday - today_weekday
            if days_ahead < 0:
                days_ahead += 7 # Schedule for next week

            target_date = now + timedelta(days=days_ahead)
            date_str = target_date.strftime("%Y-%m-%d")

            start_time = f"{date_str}T{time_str}:00"
            hour = int(time_str.split(":")[0])
            end_hour = f"{(hour + 1):02d}:{time_str.split(':')[1]}:00"
            end_time = f"{date_str}T{end_hour}"

            event_link = None
            if has_creds and service and calendar_id:
                try:
                    # Create calendar event
                    event_body = {
                        'summary': f'🎓 Study Session: {subtopic_name}',
                        'description': f'AI-Recommended study session for {subtopic_name} synced via EduFX.',
                        'start': {
                            'dateTime': start_time,
                            'timeZone': 'Asia/Colombo',
                        },
                        'end': {
                            'dateTime': end_time,
                            'timeZone': 'Asia/Colombo',
                        },
                        'reminders': {
                            'useDefault': False,
                            'overrides': [{'method': 'popup', 'minutes': 15}],
                        },
                    }

                    # Insert into Google Calendar
                    event = service.events().insert(
                        calendarId=calendar_id, 
                        body=event_body
                    ).execute()
                    event_link = event.get('htmlLink')
                except Exception as cal_insert_err:
                    print(f"[GOOGLE CALENDAR WARNING] Failed to insert calendar event: {str(cal_insert_err)}")

            # Save in database session_summary (Always runs!)
            database.supabase.table("session_summary").insert({
                "student_id": student_id,
                "subtopic_id": subtopic_id,
                "session_date": date_str,
                "lock_reason": f"scheduled:{start_time}",
                "webcam_enabled": False,
                "locked": False
            }).execute()

            synced_events.append({
                "subtopic_id": subtopic_id,
                "subtopic_name": subtopic_name,
                "date": date_str,
                "time": time_str,
                "event_link": event_link
            })

        msg = "Study timetable synced successfully!" if has_creds else "Study timetable saved to dashboard planner! (Google Calendar sync skipped: credentials file missing)"
        return success_response(msg, {"events": synced_events})

    except Exception as e:
        return error_response(f"Timetable sync failed: {str(e)}")


@router.post("/generate-best-timetable")
async def get_best_timetable_api(request: Request):
    try:
        payload = await request.json()
        student_id = payload.get("student_id")
        availabilities = payload.get("availabilities", [])

        if not student_id or not availabilities:
            return error_response("Missing student_id or availabilities list.")

        timetable = generate_best_timetable(student_id, availabilities)
        return success_response("AI optimized custom timetable generated.", {"timetable": timetable})
    except Exception as e:
        return error_response(str(e))


@router.get("/scheduled-sessions/{student_id}")
def get_scheduled_sessions(student_id: int):
    try:
        # Fetch active bookings (quiz_score IS NULL)
        res = database.supabase.table("session_summary")\
            .select("*")\
            .eq("student_id", student_id)\
            .is_("quiz_score", "null")\
            .execute()
            
        sessions = []
        for row in res.data:
            lock_reason = row.get("lock_reason") or ""
            if lock_reason.startswith("scheduled:") or lock_reason.startswith("reminded:"):
                subtopic_id = row.get("subtopic_id")
                subtopic_name = "General Study Session"
                
                # Retrieve subtopic name
                if subtopic_id:
                    subtopic_res = database.supabase.table("subtopics").select("title").eq("id", subtopic_id).execute()
                    if subtopic_res.data:
                        subtopic_name = subtopic_res.data[0]["title"]
                
                time_part = lock_reason.split(":", 1)[1] # e.g. "2026-07-08T14:30:00" or "2026-07-08T14:30:00:reminded"
                time_clean = time_part.split("T")[1][:5] if "T" in time_part else time_part
                
                sessions.append({
                    "id": row["id"],
                    "subtopic_id": subtopic_id,
                    "subtopic_name": subtopic_name,
                    "date": row["session_date"],
                    "time": time_clean,
                    "status": "Reminded" if ":reminded" in lock_reason else "Scheduled"
                })
                
        # Sort chronologically by date and time
        sessions.sort(key=lambda x: (x["date"], x["time"]))
        return success_response("Active scheduled sessions loaded from database.", {"sessions": sessions})
    except Exception as e:
        return error_response(str(e))


@router.delete("/cancel/{session_id}")
def cancel_session(session_id: int):
    try:
        database.supabase.table("session_summary").delete().eq("id", session_id).execute()
        return success_response("Study slot successfully cancelled and removed.")
    except Exception as e:
        return error_response(str(e))