from database import supabase
from datetime import datetime
from typing import List, Dict, Any
from collections import defaultdict
from diagnostic.bkt import run_bkt, classify_level


def get_diagnostic_questions():
    result = supabase.table("main_exam_questions")\
        .select("id, question_text, option_a, option_b, option_c, option_d, option_e, subtopic_id")\
        .gte("id", 1)\
        .lte("id", 10)\
        .order("id", desc=False)\
        .execute()
    return result.data

def _update_student_progress_with_bkt(student_id: str):
    """Runs BKT for all subtopics and updates student_progress table."""

    # 1. Fetch subtopics
    subtopics_raw = supabase.table("subtopics").select("id").execute()
    subtopics_list = subtopics_raw.data

    # 2. Fetch BKT parameters
    bkt_raw = supabase.table("bkt_parameters").select("*").execute()
    bkt_map = {row["subtopic_id"]: row for row in bkt_raw.data}

    # 3. Fetch student's full answer history
    answers_raw = supabase.table("student_answers")\
        .select("subtopic_id, is_correct, answered_at")\
        .eq("student_id", student_id)\
        .order("answered_at", desc=False)\
        .execute()

    # 4. Group by subtopic
    subtopic_sequences = defaultdict(list)
    subtopic_correct   = defaultdict(int)
    subtopic_total     = defaultdict(int)

    for row in answers_raw.data:
        s_id = row["subtopic_id"]
        subtopic_sequences[s_id].append(row["is_correct"])
        subtopic_total[s_id] += 1
        if row["is_correct"]:
            subtopic_correct[s_id] += 1

    # 5. Run BKT per subtopic and upsert student_progress
    for subtopic in subtopics_list:
        s_id = subtopic["id"]

        params = bkt_map.get(s_id, {
            "p_known": 0.4,
            "p_learn": 0.15,
            "p_guess": 0.2,
            "p_slip":  0.1
        })

        answer_seq = subtopic_sequences.get(s_id, [])
        total      = subtopic_total.get(s_id, 0)
        correct    = subtopic_correct.get(s_id, 0)

        p_know = run_bkt(
            answer_sequence=answer_seq,
            p_known=float(params["p_known"]),
            p_learn=float(params["p_learn"]),
            p_guess=float(params["p_guess"]),
            p_slip=float(params["p_slip"]),
        )

        level = classify_level(p_know)
        score = int((correct / total) * 100) if total > 0 else 0

        # Fetch existing session count
        existing = supabase.table("student_progress")\
            .select("total_sessions")\
            .eq("student_id", student_id)\
            .eq("subtopic_id", s_id)\
            .execute()

        current_sessions = existing.data[0].get("total_sessions", 0) if existing.data else 0

        # Upsert updated level and score
        supabase.table("student_progress").upsert({
            "student_id":      student_id,
            "subtopic_id":     s_id,
            "current_level":   level,
            "last_quiz_score": score,
            "total_sessions":  current_sessions + 1,
        }, on_conflict="student_id,subtopic_id").execute()

def submit_diagnostic(student_id: str, student_email: str, answers: list):
    # 1. Fetch correct answers and subtopic mapping
    questions_raw = supabase.table("main_exam_questions")\
        .select("id, correct_option, subtopic_id")\
        .gte("id", 1)\
        .lte("id", 10)\
        .execute()

    questions = questions_raw.data
    question_map = {q["id"]: q for q in questions}

    correct_count = 0
    total_questions = len(questions)
    answer_records = []

    # 2. Grade each answer and build individual answer records
    for answer in answers:
        q_id = answer.get("question_id")
        student_ans = answer.get("student_answer", "")

        if q_id not in question_map:
            continue

        q = question_map[q_id]
        is_correct = str(student_ans).strip().upper() == str(q["correct_option"]).strip().upper()

        if is_correct:
            correct_count += 1

        # Build record for student_answers table
        answer_records.append({
            "student_id": student_id,
            "question_id": q_id,
            "subtopic_id": q["subtopic_id"],
            "is_correct": is_correct,
        })

    # 3. Save individual answers for BKT processing
    if answer_records:
        supabase.table("student_answers").insert(answer_records).execute()
        _update_student_progress_with_bkt(student_id) 

    # 4. Calculate overall score
    score_percentage = int((correct_count / total_questions) * 100) if total_questions > 0 else 0

    # 5. Save exam attempt
    exam_attempt_record = {
        "student_id": student_id,
        "student_email": student_email,
        "total_questions": total_questions,
        "correct_answers": correct_count,
        "score_percentage": score_percentage,
        "submitted_at": datetime.utcnow().isoformat()
    }

    db_response = supabase.table("main_exam_attempts").insert(exam_attempt_record).execute()

    if hasattr(db_response, 'error') and db_response.error:
        raise Exception(db_response.error.message)

    return {
        "total_questions": total_questions,
        "correct_answers": correct_count,
        "score_percentage": score_percentage
    }


def get_student_subtopic_levels(student_id: str) -> List[Dict[str, Any]]:
    # 1. Fetch all subtopics
    subtopics_raw = supabase.table("subtopics").select("id, title").execute()
    subtopics_list = subtopics_raw.data

    # 2. Fetch BKT parameters for all subtopics
    bkt_raw = supabase.table("bkt_parameters").select("*").execute()
    bkt_map = {row["subtopic_id"]: row for row in bkt_raw.data}

    # 3. Fetch student's full answer history ordered by time
    answers_raw = supabase.table("student_answers")\
        .select("subtopic_id, is_correct, answered_at")\
        .eq("student_id", student_id)\
        .order("answered_at", desc=False)\
        .execute()

    # 4. Group answer sequences by subtopic
    subtopic_sequences = defaultdict(list)
    subtopic_correct = defaultdict(int)
    subtopic_total = defaultdict(int)

    for row in answers_raw.data:
        s_id = row["subtopic_id"]
        is_correct = row["is_correct"]
        subtopic_sequences[s_id].append(is_correct)
        subtopic_total[s_id] += 1
        if is_correct:
            subtopic_correct[s_id] += 1

    # 5. Run BKT per subtopic and build results
    results_summary = []

    for subtopic in subtopics_list:
        s_id = subtopic["id"]

        # Get BKT params — fall back to A/L Chemistry S-block defaults
        params = bkt_map.get(s_id, {
            "p_known": 0.4,
            "p_learn": 0.15,
            "p_guess": 0.2,
            "p_slip":  0.1
        })

        answer_seq = subtopic_sequences.get(s_id, [])
        total = subtopic_total.get(s_id, 0)
        correct = subtopic_correct.get(s_id, 0)

        # Run BKT over answer sequence
        p_know = run_bkt(
            answer_sequence=answer_seq,
            p_known=float(params["p_known"]),
            p_learn=float(params["p_learn"]),
            p_guess=float(params["p_guess"]),
            p_slip=float(params["p_slip"]),
        )

        level = classify_level(p_know)
        score = int((correct / total) * 100) if total > 0 else 0

        results_summary.append({
            "subtopic_id": s_id,
            "subtopic_name": subtopic["title"],
            "level": level,
            "score": score,
            "correct": correct,
            "total_questions": total,
            "p_know": round(p_know, 3),  # BKT probability for debugging
        })

    return results_summary