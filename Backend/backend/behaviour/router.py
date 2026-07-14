import cv2
import numpy as np
from fastapi import APIRouter, File, UploadFile
from ultralytics import YOLO

router = APIRouter(tags=["Behaviour"])

# 🧠 Load a lightweight, pre-trained YOLOv8 Nano model
# It automatically handles tracking maps and checks for 'person' (0) and 'cell phone' (67)
model = YOLO("yolov8n.pt")

@router.post("/analyze-frame")
async def analyze_frame(
    file: UploadFile = File(...),
    student_id: int = None,
    session_id: int = None
):
    try:
        # 1. Stream the raw JPEG binary data payload coming from Next.js
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        
        # 2. Decode the binary chunk straight into an OpenCV pixel matrix
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"success": False, "message": "Failed to parse image frame grid stream."}

        # 3. Run predictions through YOLOv8
        # conf=0.45 sets a confident detection threshold to prevent background item false flags
        results = model(img, conf=0.45, verbose=False)[0]
        
        # Extract all detected class IDs present in the camera view
        detected_classes = results.boxes.cls.cpu().numpy().astype(int).tolist()

        # COCO Dataset Reference Mappings: 0 = person, 67 = cell phone
        person_count = detected_classes.count(0)
        phone_detected = 67 in detected_classes

        # 🛡️ COGNITIVE PROCTOR THREAT VERDICT MATRIX
        distracted = False
        message = "Monitoring Feed Active 🟢"

        if phone_detected:
            distracted = True
            message = "🚫 Mobile phone detected! Please put away your device to resume."
        elif person_count == 0:
            distracted = True
            message = "❌ No student detected! Please remain in front of the camera feed."
        elif person_count > 1:
            distracted = True
            message = "⚠️ Multiple people detected! Ensure you are evaluating alone."

        # If session_id is provided, incrementally update proctor metrics in Supabase
        if session_id:
            try:
                import database
                res = database.supabase.table("session_summary").select("*").eq("id", session_id).execute()
                if res.data:
                    row = res.data[0]
                    old_phone = row.get("phone_percent") or 0
                    old_absent = row.get("absent_percent") or 0
                    old_focus = row.get("focus_score") if row.get("focus_score") is not None else 100
                    
                    alpha = 0.08  # Weight of current frame
                    
                    phone_val = 100 if phone_detected else 0
                    absent_val = 100 if person_count == 0 else 0
                    current_focus = 0 if distracted else 100
                    
                    new_phone = int(old_phone * (1 - alpha) + phone_val * alpha)
                    new_absent = int(old_absent * (1 - alpha) + absent_val * alpha)
                    new_focus = int(old_focus * (1 - alpha) + current_focus * alpha)
                    
                    database.supabase.table("session_summary").update({
                        "phone_percent": new_phone,
                        "absent_percent": new_absent,
                        "focus_score": new_focus,
                        "webcam_enabled": True
                    }).eq("id", session_id).execute()
            except Exception as db_err:
                print(f"[PROCTOR DB ERROR] Failed to save proctor metrics: {str(db_err)}")

        return {
            "success": True,
            "data": {
                "distracted": distracted,
                "message": message
            }
        }

    except Exception as e:
        print(f"YOLO Proctoring pipeline exception: {str(e)}")
        return {"success": False, "message": f"Internal object tracking crash: {str(e)}"}


# --- GET: Fetch Behavior Tracking Report ---
@router.get("/report/{student_id}")
def get_behaviour_report(student_id: int):
    try:
        import database
        # Fetch all proctored sessions
        res = database.supabase.table("session_summary")\
            .select("*")\
            .eq("student_id", student_id)\
            .eq("webcam_enabled", True)\
            .execute()
            
        sessions_list = []
        total_focus = 0
        phone_warnings = 0
        absence_warnings = 0
        
        for row in res.data:
            subtopic_id = row.get("subtopic_id")
            subtopic_name = "General Session"
            if subtopic_id:
                sub_res = database.supabase.table("subtopics").select("title").eq("id", subtopic_id).execute()
                if sub_res.data:
                    subtopic_name = sub_res.data[0]["title"]
            
            focus = row.get("focus_score") if row.get("focus_score") is not None else 100
            phone = row.get("phone_percent") or 0
            absent = row.get("absent_percent") or 0
            
            total_focus += focus
            if phone > 5:
                phone_warnings += 1
            if absent > 10:
                absence_warnings += 1
                
            sessions_list.append({
                "session_id": row["id"],
                "subtopic_name": subtopic_name,
                "date": row["session_date"] or row["created_at"].split("T")[0],
                "focus_score": focus,
                "phone_percent": phone,
                "absent_percent": absent
            })
            
        count = len(sessions_list)
        overall_focus = int(total_focus / count) if count > 0 else 100
        
        # Sort sessions by date descending
        sessions_list.sort(key=lambda x: x["date"], reverse=True)
        
        return {
            "success": True,
            "data": {
                "overall_focus_average": overall_focus,
                "total_proctored_sessions": count,
                "phone_warning_count": phone_warnings,
                "absence_warning_count": absence_warnings,
                "sessions": sessions_list
            }
        }
    except Exception as e:
        return {"success": False, "message": str(e)}