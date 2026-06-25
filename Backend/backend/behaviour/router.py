import cv2
import numpy as np
from fastapi import APIRouter, File, UploadFile
from ultralytics import YOLO

router = APIRouter(tags=["Behaviour"])

# 🧠 Load a lightweight, pre-trained YOLOv8 Nano model
# It automatically handles tracking maps and checks for 'person' (0) and 'cell phone' (67)
model = YOLO("yolov8n.pt")

@router.post("/analyze-frame")
async def analyze_frame(file: UploadFile = File(...)):
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
        if phone_detected:
            # Rule 1: High Priority Flag - Physical device spotted in frame bounding tracking lanes
            return {
                "success": True,
                "data": {
                    "distracted": True,
                    "message": "🚫 Mobile phone detected! Please put away your device to resume."
                }
            }

        if person_count == 0:
            # Rule 2: Student has left their seat or blocked the camera array
            return {
                "success": True,
                "data": {
                    "distracted": True,
                    "message": "❌ No student detected! Please remain in front of the camera feed."
                }
            }
        
        elif person_count > 1:
            # Rule 3: Integrity Hazard - More than one individual in view
            return {
                "success": True,
                "data": {
                    "distracted": True,
                    "message": "⚠️ Multiple people detected! Ensure you are evaluating alone."
                }
            }
        
        else:
            # Exactly one student confirmed, and absolutely zero phones visible!
            return {
                "success": True,
                "data": {
                    "distracted": False,
                    "message": "Monitoring Feed Active 🟢"
                }
            }

    except Exception as e:
        print(f"YOLO Proctoring pipeline exception: {str(e)}")
        return {"success": False, "message": f"Internal object tracking crash: {str(e)}"}