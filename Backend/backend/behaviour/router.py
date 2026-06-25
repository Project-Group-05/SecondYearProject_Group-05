import cv2
import numpy as np
from fastapi import APIRouter, File, UploadFile

router = APIRouter(tags=["Behaviour"])
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

@router.post("/analyze-frame")
async def analyze_frame(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"success": False, "message": "Failed to parse image frame grid stream."}

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))
        face_count = len(faces)

        if face_count == 0:
            return {
                "success": True,
                "data": {
                    "distracted": True,
                    "message": "❌ No student detected! Please remain in front of the camera feed."
                }
            }
        elif face_count > 1:
            return {
                "success": True,
                "data": {
                    "distracted": True,
                    "message": "⚠️ Multiple faces detected! Ensure you are evaluating alone."
                }
            }
        else:
            return {
                "success": True,
                "data": {
                    "distracted": False,
                    "message": "Monitoring Feed Active 🟢"
                }
            }
    except Exception as e:
        print(f"Behaviour tracking error: {str(e)}")
        return {"success": False, "message": f"Internal tracking crash: {str(e)}"}