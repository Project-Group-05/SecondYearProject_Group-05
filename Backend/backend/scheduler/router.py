from fastapi import APIRouter, Request
from scheduler.service import get_todays_plan
from utils.response import success_response, error_response
from google.oauth2 import service_account
from googleapiclient.discovery import build
import os

router = APIRouter()

# --- Google Calendar Google Cloud Engine Setup ---
SCOPES = ['https://www.googleapis.com/auth/calendar']
# This looks up one directory level to find your 'google_creds.json' file
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

        if not student_email or not start_time or not end_time:
            return error_response("Missing required scheduling parameters.")

        service = get_calendar_service()
        calendar_id = os.getenv("GOOGLE_CALENDAR_ID")

        # 🌟 Cleaned Event Payload Configuration Structure
        event_body = {
            'summary': f'🎓 Study Session: {topic}',
            'description': 'Automated study appointment synced via EduFX platform dashboard.',
            'start': {
                'dateTime': start_time,
                'timeZone': 'Asia/Colombo',
            },
            'end': {
                'dateTime': end_time,
                'timeZone': 'Asia/Colombo',
            },
            # ❌ REMOVED the 'attendees' list to bypass the Domain-Wide Delegation error
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 15},
                ],
            },
        }

        # 🌟 Insert event without the sendUpdates argument
        event = service.events().insert(
            calendarId=calendar_id, 
            body=event_body
        ).execute()

        return success_response(
            "Study session successfully booked!", 
            {"event_link": event.get('htmlLink'), "success": True}
        )

    except Exception as e:
        return error_response(f"Calendar Cloud Sync Failed: {str(e)}")