import cv2
import mediapipe as mp
import time
import numpy as np

# Initialize MediaPipe
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh()

cap = cv2.VideoCapture(0)

blink_count = 0
prev_eye_dist = None
eye_closed_frames = 0

face_positions = []

start_time = time.time()

print("🎥 Facial Analyzer Started (Press ESC to stop)")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:

            # LEFT EYE (approx landmarks)
            left_eye_top = face_landmarks.landmark[159]
            left_eye_bottom = face_landmarks.landmark[145]

            # RIGHT EYE
            right_eye_top = face_landmarks.landmark[386]
            right_eye_bottom = face_landmarks.landmark[374]

            # Eye vertical distance
            left_eye_dist = abs(left_eye_top.y - left_eye_bottom.y)
            right_eye_dist = abs(right_eye_top.y - right_eye_bottom.y)

            eye_dist = (left_eye_dist + right_eye_dist) / 2

            # Blink detection
            if prev_eye_dist is not None:
                if eye_dist < 0.01 and prev_eye_dist >= 0.01:
                    blink_count += 1

            prev_eye_dist = eye_dist

            # Eye closure detection
            if eye_dist < 0.01:
                eye_closed_frames += 1

            # Face center for stability
            nose = face_landmarks.landmark[1]
            cx, cy = int(nose.x * w), int(nose.y * h)
            face_positions.append((cx, cy))

            # Draw center
            cv2.circle(frame, (cx, cy), 3, (0, 255, 0), -1)

    cv2.imshow("Facial Analyzer", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()

# -------------------------------
# METRICS CALCULATION
# -------------------------------
duration = time.time() - start_time

blink_rate = blink_count / duration if duration > 0 else 0

# Stability (movement variance)
if len(face_positions) > 1:
    movements = [
        np.linalg.norm(np.array(face_positions[i]) - np.array(face_positions[i - 1]))
        for i in range(1, len(face_positions))
    ]
    stability = np.std(movements)
else:
    stability = 0

# Eye closure time
eye_closure_time = eye_closed_frames / 30  # approx fps

# -------------------------------
# OUTPUT
# -------------------------------
print("\n📊 Facial Metrics:")
print("Blink Count:", blink_count)
print("Blink Rate (per sec):", round(blink_rate, 2))
print("Eye Closure Time (sec):", round(eye_closure_time, 2))
print("Face Stability Score:", round(stability, 2))

# Simple interpretation
if blink_rate > 0.5 or stability > 5:
    print("⚠️ Possible fatigue / instability detected")
else:
    print("✅ Normal facial behavior")