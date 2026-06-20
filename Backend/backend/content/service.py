# content/service.py

import os
from dotenv import load_dotenv
from openai import OpenAI
from database import supabase
from content.textbook import TEXTBOOK

load_dotenv()

def get_all_subtopics():
    result = supabase.table("subtopics")\
        .select("*")\
        .order("order_index")\
        .execute()
    return result.data

def get_content_for_student(subtopic_id: int, student_id: int):
    progress = supabase.table("student_progress")\
        .select("current_level")\
        .eq("student_id", student_id)\
        .eq("subtopic_id", subtopic_id)\
        .execute()

    if not progress.data:
        level = "beginner"
    else:
        level = progress.data[0]["current_level"].lower()

    content = supabase.table("content")\
        .select("*")\
        .eq("subtopic_id", subtopic_id)\
        .eq("level", level)\
        .execute()

    if not content.data:
        return None

    subtopic = supabase.table("subtopics")\
        .select("title, group_name")\
        .eq("id", subtopic_id)\
        .execute()

    result = content.data[0]
    result["subtopic_title"] = subtopic.data[0]["title"]
    result["group_name"] = subtopic.data[0]["group_name"]
    result["level"] = level

    return result


def generate_content_for_subtopic(subtopic_title: str, level: str):
    source = TEXTBOOK[subtopic_title]

    level_instructions = {
        "beginner": "Use simple language, avoid complex equations, use analogies.",
        "intermediate": "Include key equations and trends. Assume basic chemistry knowledge.",
        "advanced": "Give full chemical reasoning, all equations, edge cases and exceptions."
    }

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY")
    )

    response = client.chat.completions.create(
        model="openrouter/free",  # completely free
        messages=[{
            "role": "user",
            "content": f"""You are a chemistry teacher preparing study material for A/L students.
Using ONLY the following textbook content:

{source}

Write a {level} level explanation for the topic: {subtopic_title}

Instructions: {level_instructions[level]}"""
        }]
    )

    return response.choices[0].message.content