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
    emb = get_embedding(image)
    if emb is None or user_emb is None:
        return False, 0.0
    sim = np.dot(emb, user_emb) / (np.linalg.norm(emb) * np.linalg.norm(user_emb))
    return sim > threshold, sim


def capture_image():
    cam = cv2.VideoCapture(0)
    ret, frame = cam.read()

    from matplotlib import pyplot as plt

    plt.imshow(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    plt.show()

    cam.release()
    return get_embedding(frame)



