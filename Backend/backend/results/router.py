from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from results.service import submit_quiz, get_session_results
from utils.response import success_response, error_response

router = APIRouter()

class AnswerItem(BaseModel):
    question_id: int
    student_answer: str

class QuizSubmit(BaseModel):
    student_id: int
    session_id: int
    subtopic_id: int
    webcam_enabled: bool = False
    answers: List[AnswerItem]

@router.post("/submit-quiz")
def submit(req: QuizSubmit):
    try:
        answers = [a.dict() for a in req.answers]
        data = submit_quiz(
            req.student_id,
            req.session_id,
            req.subtopic_id,
            req.webcam_enabled,
            answers
        )
        return success_response("Quiz submitted successfully", data)
    except Exception as e:
        return error_response(str(e))

@router.get("/session/{session_id}/{student_id}")
def session_results(session_id: int, student_id: int):
    try:
        data = get_session_results(session_id, student_id)
        if not data:
            return error_response("Session not found")
        return success_response("Session results fetched", data)
    except Exception as e:
        return error_response(str(e))

class SessionCreate(BaseModel):
    student_id: int
    subtopic_id: int
    webcam_enabled: bool = False

@router.post("/create-session")
def api_create_session(req: SessionCreate):
    try:
        from quiz.service import create_session
        from database import supabase
        session_id = create_session(req.student_id, req.subtopic_id)
        if req.webcam_enabled:
            supabase.table("session_summary").update({"webcam_enabled": True}).eq("id", session_id).execute()
        return success_response("Session created successfully", {"session_id": session_id})
    except Exception as e:
        return error_response(str(e))
