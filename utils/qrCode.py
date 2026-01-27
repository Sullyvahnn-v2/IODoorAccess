import secrets
import hashlib
import hmac
import time

from models import User

SECRET_KEY = "chuj".encode("utf-8")

def generate_secure_token(user_id):
    """
    Generate a secure token for the user
    Format: user_id|timestamp|hmac_signature
    """

    # Create the message to sign
    message = f"{user_id}"

    # Generate HMAC signature
    signature = hmac.new(
        SECRET_KEY,
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    token = f"{user_id}|{signature}"
    return token


def verify_token(token):
    """
    Verify the token and extract user_id if valid
    Returns: (is_valid, user_id, error_message)
    """
    parts = token.split('|')
    if len(parts) != 2:
        return None

    user_id, received_signature = parts
    user = User.query.get(int(user_id))
    if user.is_expired():
        return None

    # Recreate the message and verify signature
    message = f"{user_id}"
    expected_signature = hmac.new(
        SECRET_KEY,
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # Constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(received_signature, expected_signature):
        return None

    return user_id


