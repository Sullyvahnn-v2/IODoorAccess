import base64
import secrets
import hashlib
import hmac
import time

from models import User

SECRET_KEY = "chuj".encode("utf-8")


def generate_secure_token(user_id, length=12):
    """Generate a short, URL-safe HMAC token for a user."""
    message = str(user_id).encode('utf-8')
    signature = hmac.new(SECRET_KEY, message, hashlib.sha256).digest()

    # Zamiana na URL-safe base64 i skrócenie
    short_sig = base64.urlsafe_b64encode(signature)[:length].decode('utf-8')
    return f"{user_id}|{short_sig}"


def verify_token(token):
    """
    Verify the token and extract user_id if valid.
    Returns user_id if valid, else None.
    """
    try:
        parts = token.split('|')
        if len(parts) != 2:
            return None

        user_id_str, received_signature = parts
        user_id = int(user_id_str)

        user = User.query.get(user_id)
        if not user or user.is_expired():
            return None

        # Recreate the message and signature
        message = str(user_id).encode('utf-8')
        expected_signature = base64.urlsafe_b64encode(
            hmac.new(SECRET_KEY, message, hashlib.sha256).digest()
        )[:len(received_signature)].decode('utf-8')

        # Constant-time comparison
        if hmac.compare_digest(received_signature, expected_signature):
            return user_id
        else:
            return None

    except Exception:
        return None


