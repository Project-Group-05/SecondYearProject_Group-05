from fastapi import APIRouter, Request
from utils.response import success_response, error_response
from database import supabase
import os

router = APIRouter()


# ── Email/Password Login ──────────────────────────────────────────────
@router.post("/login")
async def login_with_email(request: Request):
    try:
        payload = await request.json()
        email = payload.get("email")
        password = payload.get("password")

        if not email or not password:
            return error_response("Email and password are required.")

        try:
            auth_res = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })
        except Exception as e:
            return error_response("Invalid email or password.")

        if not auth_res or not auth_res.user:
            return error_response("Invalid email or password.")

        student = supabase.table("students")\
            .select("*")\
            .eq("email", email)\
            .execute()

        if not student.data:
            return error_response("Account not found.")

        student_data = student.data[0]

        # Sync auth_id if missing
        if not student_data.get("auth_id"):
            supabase.table("students")\
                .update({"auth_id": auth_res.user.id})\
                .eq("email", email)\
                .execute()

        return success_response("Login successful!", {
            "id": auth_res.user.id,
            "email": student_data["email"],
            "name": student_data["name"],
            "diagnostic_completed": student_data["diagnostic_completed"],
            "access_token": auth_res.session.access_token,
        })

    except Exception as e:
        return error_response(str(e))


# ── Google OAuth — Step 1: Get redirect URL ───────────────────────────
@router.get("/google/url")
def get_google_auth_url():
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        redirect_to = "http://localhost:3000/auth/callback"

        url = (
            f"{supabase_url}/auth/v1/authorize"
            f"?provider=google"
            f"&redirect_to={redirect_to}"
        )

        return success_response("Google auth URL generated.", {
            "url": url
        })

    except Exception as e:
        return error_response(str(e))


# ── Google OAuth — Step 2: Handle callback ────────────────────────────
@router.get("/google/callback")
async def google_callback(code: str):
    try:
        auth_res = supabase.auth.exchange_code_for_session({"auth_code": code})

        if not auth_res or not auth_res.user:
            return error_response("Google authentication failed.")

        email = auth_res.user.email
        full_name = auth_res.user.user_metadata.get("full_name", email)
        user_uuid = auth_res.user.id

        existing = supabase.table("students")\
            .select("*")\
            .eq("email", email)\
            .execute()

        if existing.data:
            student_data = existing.data[0]

            # Sync auth_id if missing on older records
            if not student_data.get("auth_id"):
                supabase.table("students")\
                    .update({"auth_id": user_uuid})\
                    .eq("email", email)\
                    .execute()
                student_data["auth_id"] = user_uuid

        else:
            # New user — insert without id (bigint auto-generates)
            inserted = supabase.table("students").insert({
                "auth_id": user_uuid,
                "email": email,
                "name": full_name,
                "diagnostic_completed": False
            }).execute()
            student_data = inserted.data[0]

            # Seed default progress rows
            subtopics = supabase.table("subtopics").select("id").execute()
            if subtopics.data:
                progress_rows = [
                    {
                        "student_id": user_uuid,
                        "subtopic_id": topic["id"],
                        "current_level": "Beginner",
                        "last_quiz_score": 0,
                        "total_sessions": 0
                    }
                    for topic in subtopics.data
                ]
                supabase.table("student_progress").upsert(
                    progress_rows,
                    on_conflict="student_id,subtopic_id"
                ).execute()

        return success_response("Google login successful!", {
            "id": user_uuid,
            "email": student_data["email"],
            "name": student_data["name"],
            "diagnostic_completed": student_data["diagnostic_completed"],
            "access_token": auth_res.session.access_token,
        })

    except Exception as e:
        return error_response(str(e))


# ── Email/Password Register ───────────────────────────────────────────
@router.post("/register")
async def register_with_email(request: Request):
    try:
        payload = await request.json()
        email = payload.get("email")
        password = payload.get("password")
        full_name = payload.get("fullName")

        if not email or not password:
            return error_response("Email and password are required.")

        try:
            auth_res = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {"data": {"full_name": full_name}}
            })
        except Exception as e:
            error_msg = str(e)
            if "already registered" in error_msg.lower():
                return error_response("This email is already registered. Please login.")
            return error_response(error_msg)

        if not auth_res or not auth_res.user:
            return error_response("This email is already registered. Please login.")

        user_uuid = auth_res.user.id

        # ← do NOT pass "id" — it's a bigint and auto-generates
        # ← store auth_id instead so we can look up by UUID later
        db_res = supabase.table("students").upsert({
            "auth_id": user_uuid,
            "email": email,
            "name": full_name,
            "password": password,
            "diagnostic_completed": False
        }, on_conflict="email").execute()

        if not db_res.data:
            return error_response("Failed to save profile. Please try again.")

        subtopics = supabase.table("subtopics").select("id").execute()

        if subtopics.data:
            progress_rows = [
                {
                    "student_id": user_uuid,
                    "subtopic_id": topic["id"],
                    "current_level": "Beginner",
                    "last_quiz_score": 0,
                    "total_sessions": 0
                }
                for topic in subtopics.data
            ]
            supabase.table("student_progress").upsert(
                progress_rows,
                on_conflict="student_id,subtopic_id"
            ).execute()

        return success_response("Registration successful!", {
            "id": user_uuid,
            "email": email,
            "name": full_name,
            "diagnostic_completed": False,
            "access_token": auth_res.session.access_token if auth_res.session else None,
        })

    except Exception as e:
        return error_response(str(e))


# ── Logout ────────────────────────────────────────────────────────────
@router.post("/logout")
async def logout(request: Request):
    try:
        supabase.auth.sign_out()
        return success_response("Logged out successfully.", None)
    except Exception as e:
        return error_response(str(e))
    

# ── Google OAuth — Token flow (implicit/hash redirect) ───────────────
@router.post("/google/token")
async def google_token(request: Request):
    try:
        payload = await request.json()
        access_token = payload.get("access_token")

        if not access_token:
            return error_response("Access token is required.")

        # Get user info from the token
        user_res = supabase.auth.get_user(access_token)

        if not user_res or not user_res.user:
            return error_response("Invalid token.")

        email = user_res.user.email
        user_uuid = user_res.user.id
        full_name = user_res.user.user_metadata.get("full_name", email)

        # Check if student exists
        existing = supabase.table("students")\
            .select("*")\
            .eq("email", email)\
            .execute()

        if existing.data:
            student_data = existing.data[0]
            if not student_data.get("auth_id"):
                supabase.table("students")\
                    .update({"auth_id": user_uuid})\
                    .eq("email", email)\
                    .execute()
                student_data["auth_id"] = user_uuid
        else:
            inserted = supabase.table("students").insert({
                "auth_id": user_uuid,
                "email": email,
                "name": full_name,
                "diagnostic_completed": False
            }).execute()
            student_data = inserted.data[0]

            subtopics = supabase.table("subtopics").select("id").execute()
            if subtopics.data:
                progress_rows = [
                    {
                        "student_id": user_uuid,
                        "subtopic_id": topic["id"],
                        "current_level": "Beginner",
                        "last_quiz_score": 0,
                        "total_sessions": 0
                    }
                    for topic in subtopics.data
                ]
                supabase.table("student_progress").upsert(
                    progress_rows,
                    on_conflict="student_id,subtopic_id"
                ).execute()

        return success_response("Google login successful!", {
            "id": user_uuid,
            "email": student_data["email"],
            "name": student_data["name"],
            "diagnostic_completed": student_data["diagnostic_completed"],
            "access_token": access_token,
        })

    except Exception as e:
        return error_response(str(e))