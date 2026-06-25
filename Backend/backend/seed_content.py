# seed_content.py  ← root of your project

from database import supabase
from content.service import generate_content_for_subtopic

subtopics = supabase.table("subtopics").select("id, title").execute().data
levels = ["beginner", "intermediate", "advanced"]

# Check what's already been generated so we don't waste calls regenerating it
existing = supabase.table("content").select("subtopic_id, level").execute().data
done = {(row["subtopic_id"], row["level"]) for row in existing}

for subtopic in subtopics:
    for level in levels:
        if (subtopic["id"], level) in done:
            print(f"Skipping (already exists): {subtopic['title']} - {level}")
            continue

        print(f"Generating: {subtopic['title']} - {level}")

        text = generate_content_for_subtopic(subtopic["title"], level)

        supabase.table("content").insert({
            "subtopic_id": subtopic["id"],
            "level": level,
            "body": text
        }).execute()

print("Done!")