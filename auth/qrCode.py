import cv2
import qrcode
import numpy as np
from pyzbar.pyzbar import decode
import secrets
import hashlib
import hmac
import time

SECRET_KEY = secrets.token_bytes(32)

# QR code validity period (in seconds)
QR_VALIDITY_PERIOD = 300  # 5 minutes

# Database file
QR_DATABASE = "qr_users.pkl"


def generate_secure_token(user_id):
    """
    Generate a secure token for the user
    Format: user_id|timestamp|hmac_signature
    """
    timestamp = int(time.time())

    # Create the message to sign
    message = f"{user_id}|{timestamp}"

    # Generate HMAC signature
    signature = hmac.new(
        SECRET_KEY,
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    token = f"{user_id}|{timestamp}|{signature}"
    return token


def verify_token(token):
    """
    Verify the token and extract user_id if valid
    Returns: (is_valid, user_id, error_message)
    """
    parts = token.split('|')
    if len(parts) != 3:
        return None

    user_id, timestamp_str, received_signature = parts
    timestamp = int(timestamp_str)

    # Check if token has expired
    current_time = int(time.time())
    if current_time - timestamp > QR_VALIDITY_PERIOD:
        return None

    # Recreate the message and verify signature
    message = f"{user_id}|{timestamp}"
    expected_signature = hmac.new(
        SECRET_KEY,
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # Constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(received_signature, expected_signature):
        return None

    return user_id

def generate_qr_code(user_id, save_path=None):
    token = generate_secure_token(user_id)

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )

    qr.add_data(token)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    if save_path:
        img.save(save_path)
        print(f"QR code saved to: {save_path}")

    print(f"QR code generated for user: {user_id}")
    print(f"Token validity: {QR_VALIDITY_PERIOD} seconds")

    return img

def scan_qr_from_camera():
    cam = cv2.VideoCapture(0)

    if not cam.isOpened():
        return False, None, "Cannot access camera"

    last_decoded = None
    last_decode_time = 0

    try:
        while True:
            ret, frame = cam.read()
            if not ret:
                continue

            decoded_objects = decode(frame)

            for obj in decoded_objects:
                # Extract the data
                qr_data = obj.data.decode('utf-8')

                # Draw rectangle around QR code
                points = obj.polygon
                if len(points) == 4:
                    pts = np.array(points, dtype=np.int32)
                    cv2.polylines(frame, [pts], True, (0, 255, 0), 3)

                # Verify token (with debouncing)
                current_time = time.time()
                if qr_data != last_decoded or current_time - last_decode_time > 1.0:
                    last_decoded = qr_data
                    last_decode_time = current_time

                    user_id = verify_token(qr_data)
                    if user_id is not None:
                        return True, user_id, qr_data

        cam.release()
        cv2.destroyAllWindows()
        return False, None, "Scanning cancelled"

    except Exception as e:
        cam.release()
        cv2.destroyAllWindows()
        return False, None, f"Error: {str(e)}"

if __name__ == "__main__":
    print("\n🔐 SECURE QR CODE AUTHENTICATION SYSTEM\n")

    while True:
        print("\nOptions:")
        print("1. Generate QR code for user")
        print("2. Scan QR code from camera")
        print("3. Scan QR code from image file")
        print("4. List all users")
        print("5. Exit")

        choice = input("\nEnter your choice (1-5): ").strip()

        if choice == '1':
            user_id = input("Enter user ID: ").strip()
            if user_id:
                save_path = f"qr_{user_id}_{int(time.time())}.png"
                img = generate_qr_code(user_id, save_path)
                print(f"✓ QR code generated and saved!")

        elif choice == '2':
            success, user_id, message = scan_qr_from_camera()
            if success:
                print(f"\n✓ SUCCESS: User '{user_id}' authenticated!")
            else:
                print(f"\n✗ FAILED: {message}")

        elif choice == '5':
            print("\nGoodbye!")
            break

        else:
            print("\nInvalid choice. Please try again.")