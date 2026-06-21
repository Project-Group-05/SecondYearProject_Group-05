# seed_content.py  ← root of your project

from database import supabase
from content.service import generate_content_for_subtopic

subtopics = supabase.table("subtopics").select("id, title").execute().data
levels = ["beginner", "intermediate", "advanced"]

for subtopic in subtopics:
    for level in levels:
        print(f"Generating: {subtopic['title']} - {level}")

        text = generate_content_for_subtopic(subtopic["title"], level)

        supabase.table("content").insert({
            "subtopic_id": subtopic["id"],
            "level": level,
            "body": text
        }).execute()

print("Done!")