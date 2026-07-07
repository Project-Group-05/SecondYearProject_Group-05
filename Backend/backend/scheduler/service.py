from database import supabase
from utils.date_helpers import days_since, is_on_cooldown

MAX_GAPS = {
    "beginner": 3,
    "intermediate": 7,
    "advanced": 14
}

MULTIPLIERS = {
    "beginner": 3.0,
    "intermediate": 2.0,
    "advanced": 0.5
}

def get_todays_plan(student_id: int):
    progress = supabase.table("student_progress")\
        .select("*, subtopics(id, title, group_name)")\
        .eq("student_id", student_id)\
        .execute().data

    weak_topics = []
    strong_topics = []

    for record in progress:
        last_studied = record.get("last_studied_date")
        level = record["current_level"]

        if is_on_cooldown(last_studied):
            continue

        gap = days_since(last_studied)

        if gap > MAX_GAPS.get(level, 14):
            score = 999 + gap
            is_overdue = True
        else:
            score = gap * MULTIPLIERS.get(level, 1.0)
            is_overdue = False

        entry = {
            "subtopic_id":       record["subtopic_id"],
            "subtopic_title":    record["subtopics"]["title"],
            "group_name":        record["subtopics"]["group_name"],
            "current_level":     level,
            "is_overdue":        is_overdue,
            "last_quiz_score":   record["last_quiz_score"],
            "last_studied_date": last_studied,
            "priority_score":    score
        }

        if level == "advanced":
            strong_topics.append(entry)
        else:
            weak_topics.append(entry)

    weak_topics.sort(key=lambda x: x["priority_score"], reverse=True)
    strong_topics.sort(key=lambda x: x["priority_score"], reverse=True)

    plan = weak_topics[:2] + strong_topics[:1]

    if len(plan) < 3:
        remaining = weak_topics[2:3 - len(plan) + 2]
        plan += remaining

    for entry in plan:
        entry.pop("priority_score")
        if entry in weak_topics:
            entry["type"] = "weak"
        else:
            entry["type"] = "strong"

    for entry in plan:
        if entry["current_level"] == "advanced":
            entry["type"] = "strong"
        else:
            entry["type"] = "weak"

    return plan

def generate_recommended_timetable(student_id: int):
    from diagnostic.service import get_student_subtopic_levels
    
    # 1. Fetch student subtopic levels
    levels_data = get_student_subtopic_levels(str(student_id))
    
    # Sort subtopics so weak ones come first (Beginner -> Intermediate -> Advanced)
    level_priority = {"beginner": 1, "intermediate": 2, "advanced": 3}
    levels_data.sort(key=lambda x: level_priority.get(x["level"].lower(), 99))
    
    # Weekly slots template (Monday to Friday, at 16:00)
    slots = [
        {"day": "Monday", "time": "16:00"},
        {"day": "Tuesday", "time": "16:00"},
        {"day": "Wednesday", "time": "16:00"},
        {"day": "Thursday", "time": "16:00"},
        {"day": "Friday", "time": "16:00"}
    ]
    
    timetable = []
    study_queue = []
    
    # Populate the study queue:
    # - Weaker/Beginner topics: 2 slots per week
    # - Intermediate topics: 1 slot per week
    for item in levels_data:
        lvl = item["level"].lower()
        if lvl == "beginner":
            study_queue.append(item)
            study_queue.append(item)
        elif lvl == "intermediate":
            study_queue.append(item)
            
    # Fill remaining slots with Advanced topics
    if len(study_queue) < len(slots):
        for item in levels_data:
            if item["level"].lower() == "advanced":
                study_queue.append(item)
                
    # Assign queue items to slots
    for i, slot in enumerate(slots):
        if i < len(study_queue):
            topic = study_queue[i]
            timetable.append({
                "day_of_week": slot["day"],
                "time": slot["time"],
                "subtopic_id": topic["subtopic_id"],
                "subtopic_name": topic["subtopic_name"],
                "level": topic["level"],
                "score": topic["score"],
                "reason": f"Priority review for {topic['level']} subtopic (Score: {topic['score']}%)"
            })
            
    return timetable

def generate_best_timetable(student_id: int, availabilities: list):
    from diagnostic.service import get_student_subtopic_levels
    
    # 1. Fetch student subtopic levels
    levels_data = get_student_subtopic_levels(str(student_id))
    
    # Group subtopics by level
    beginners = [x for x in levels_data if x["level"].lower() == "beginner"]
    intermediates = [x for x in levels_data if x["level"].lower() == "intermediate"]
    advanceds = [x for x in levels_data if x["level"].lower() == "advanced"]
    
    # Create prioritized study queue:
    # - Beginners: weight 3 (appears 3 times in round rotation)
    # - Intermediates: weight 2 (appears 2 times in round rotation)
    # - Advanceds: weight 1 (appears 1 time in round rotation)
    pool = []
    max_rounds = 3
    for round_idx in range(1, max_rounds + 1):
        for b in beginners:
            pool.append(b)
        for i in intermediates:
            if round_idx <= 2:
                pool.append(i)
        for a in advanceds:
            if round_idx <= 1:
                pool.append(a)
                
    # Assign queue items to user custom available slots
    timetable = []
    for idx, slot in enumerate(availabilities):
        day = slot.get("day_of_week")
        time_str = slot.get("time")
        
        if pool:
            topic = pool[idx % len(pool)]
            timetable.append({
                "day_of_week": day,
                "time": time_str,
                "subtopic_id": topic["subtopic_id"],
                "subtopic_name": topic["subtopic_name"],
                "level": topic["level"],
                "score": topic["score"],
                "reason": f"Custom scheduled based on {topic['level']} priority (Score: {topic['score']}%). Weaker subtopics scheduled more frequently."
            })
            
    return timetable