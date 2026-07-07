# content/service.py

import os
from dotenv import load_dotenv
from openai import OpenAI
from database import supabase
from content.textbook import TEXTBOOK
import bleach

ALLOWED_TAGS = ["p", "ul", "ol", "li", "strong", "em", "sub", "sup", "br", "h3", "h4"]

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
        model="openrouter/free",
        messages=[{
            "role": "user",
            "content": f"""You are a chemistry teacher preparing study material for A/L students.
Using ONLY the following textbook content:

{source}

Write a {level} level explanation for the topic: {subtopic_title}

Instructions: {level_instructions[level]}

Format your response as MARKDOWN (use #/## for headings, **bold**, bullet lists, and tables where useful — NOT raw HTML for the general text).

You MUST include relevant balanced chemical equations and/or ionic equations for this topic. For chemical formulas and equations ONLY, use inline HTML tags <sub> and <sup> for subscripts and superscripts — these are the only HTML tags allowed in your output.

FORMATTING RULES (strict):
- Subscripts (atom counts) must use <sub>...</sub>. Example: H<sub>2</sub>SO<sub>4</sub>
- Superscripts (ionic charges, isotope mass numbers) must use <sup>...</sup>. Example: Fe<sup>2+</sup>, SO<sub>4</sub><sup>2-</sup>
- Reaction arrows: use &rarr; for one-way reactions and &#8652; for equilibrium reactions.
- Example of a correctly formatted equation inside markdown:
  2H<sub>2</sub> + O<sub>2</sub> &rarr; 2H<sub>2</sub>O
- Example with ionic charge:
  Fe<sup>2+</sup> + 2e<sup>-</sup> &rarr; Fe
- Do NOT use plain text digits for atom counts (wrong: H2O). Always use <sub> (correct: H<sub>2</sub>O).
- Do NOT use the caret symbol (^) for charges.
- Do NOT wrap the whole response in HTML tags like <p> or <div> — only use <sub>/<sup> inline within markdown text.
- Output ONLY the content itself, no code fences, no explanation before or after.
"""
        }]
    )

    return bleach.clean(response.choices[0].message.content, tags=ALLOWED_TAGS, strip=True)