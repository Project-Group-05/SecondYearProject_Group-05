from fastapi import APIRouter, Request
from pydantic import BaseModel, EmailStr
from typing import List
from diagnostic.service import get_diagnostic_questions, submit_diagnostic
from utils.response import success_response, error_response
from diagnostic.service import get_student_subtopic_levels
from database import supabase

router = APIRouter()

class AnswerItem(BaseModel):
    question_id: int
    student_answer: str

class DiagnosticSubmit(BaseModel):
    student_id: str
    student_email: str
    answers: List[AnswerItem]

@router.get("/questions")
def fetch_diagnostic_questions():
    try:
        data = get_diagnostic_questions()
        return success_response("Questions fetched successfully", {
            "total_questions": len(data),
            "questions": data
        })
    except Exception as e:
        return error_response(str(e))

@router.post("/submit")
def submit_diagnostic_answers(req: DiagnosticSubmit):
    try:
        answers_list = [a.dict() for a in req.answers]
        results = submit_diagnostic(
            student_id=req.student_id,
            student_email=req.student_email,
            answers=answers_list
        )
        return success_response("Exam evaluation recorded completely", {"results": results})
    except Exception as e:
        return error_response(str(e))

@router.get("/student/{student_id}/proficiency")
def fetch_student_proficiency(student_id: str):
    try:
        levels_data = get_student_subtopic_levels(student_id)
        return success_response("Student subtopic levels evaluated successfully", {
            "subtopics": levels_data
        })
    except Exception as e:
        return error_response(str(e))

@router.get("/student/{student_id}/results")
def fetch_student_results(student_id: str):
    try:
        levels_data = get_student_subtopic_levels(student_id)

        total = len(levels_data)
        summary = {"beginner": 0, "intermediate": 0, "advanced": 0}

        for item in levels_data:
            level = item.get("level", "").lower()
            if level in summary:
                summary[level] += 1

        return success_response("Student diagnostic results fetched successfully", {
            "student_id": student_id,
            "total_subtopics": total,
            "level_summary": summary,
            "subtopics": [
                {
                    "subtopic_id": item.get("subtopic_id"),
                    "subtopic_name": item.get("subtopic_name"),
                    "level": item.get("level"),
                    "score": item.get("score"),
                    "correct": item.get("correct"),
                    "total_questions": item.get("total_questions"),
                }
                for item in levels_data
            ]
        })
    except Exception as e:
        return error_response(str(e))

# ← fixed: was "/diagnostic/complete" but router is already mounted at /diagnostic
@router.post("/complete")
async def mark_diagnostic_complete(request: Request):
    try:
        payload = await request.json()
        student_id = payload.get("student_id")

        supabase.table("students")\
            .update({"diagnostic_completed": True})\
            .eq("auth_id", student_id)\
            .execute()

        return success_response("Diagnostic marked complete.", None)
    except Exception as e:
        return error_response(str(e))