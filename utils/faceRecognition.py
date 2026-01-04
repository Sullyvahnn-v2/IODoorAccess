import cv2
import numpy as np
from insightface.app import FaceAnalysis

# Initialize InsightFace app
face_app = FaceAnalysis(name='buffalo_l')
face_app.prepare(ctx_id=0, det_size=(640, 640))

def get_embedding(image):
    faces = face_app.get(image)
    if len(faces) == 0:
        return None
    return faces[0].embedding


def authenticate(image, user_emb, threshold=0.42):
    """
    Returns (True, user_id, similarity) if face matches database, else (False, None, 0.0)
    """
    emb = get_embedding(image)
    if emb is None:
        return False, None, 0.0

    if user_emb is None or user_emb == 0:
        return False, None, 0.0

    best_match = None

    sim = np.dot(emb, user_emb) / (np.linalg.norm(emb) * np.linalg.norm(user_emb))
    if sim > threshold:
        return True, best_match, sim

    return False, None, 0.0


def capture_image():
    cam = cv2.VideoCapture(0)
    ret, frame = cam.read()
    cam.release()
    return get_embedding(frame)

