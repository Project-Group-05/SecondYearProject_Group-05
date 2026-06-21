from fastapi import APIRouter, UploadFile, File
from utils.response import success_response, error_response
import cv2
import numpy as np
from ultralytics import YOLO

router = APIRouter()

# 🧠 Load the ultra-lightweight YOLOv8 Nano model
# (It will automatically download the 6MB 'yolov8n.pt' weights file on your first test run)
model = YOLO("yolov8n.pt")

@router.post("/analyze-frame")
async def analyze_frame(file: UploadFile = File(...)):
    try:
        # 1. Convert the incoming browser snapshot data into an OpenCV image matrix
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return error_response("Invalid image frame received.")

        # 2. Fire the frame through the Neural Network
        results = model(frame, verbose=False)[0]
        
        detected_objects = []
        is_distracted = False
        alert_message = "Student is focused 🟢"

        # 3. Read the classification labels from the model's bounding boxes
        for box in results.boxes:
            class_id = int(box.cls[0])
            object_name = model.names[class_id]
            detected_objects.append(object_name)

            # 📱 Trigger distraction flag if a phone enters the frame matrix
            if object_name == "cell phone":
                is_distracted = True
                alert_message = "📱 Phone Usage Detected! Please stay focused on your studies."

        # 👤 Trigger warning if the student walks out of the camera's bounding box
        if "person" not in detected_objects:
            is_distracted = True
            alert_message = "⚠️ No student detected! Please remain in front of the camera feed."

        return success_response("Frame parsed successfully", {
            "distracted": is_distracted,
            "message": alert_message,
            "objects": detected_objects
        })

    except Exception as e:
        return error_response(f"AI Matrix processing error: {str(e)}")