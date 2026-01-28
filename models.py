from datetime import datetime
import time
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import hashlib

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    biometric_hash = db.Column(db.String(256), nullable=True)
    expire_time = db.Column(db.DateTime, default=datetime.now())
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(), nullable=False)

    # Relationship
    logs = db.relationship('Log', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def set_password(self, password):
        """Hash password using SHA-256"""
        self.password_hash = hashlib.sha256(password.encode()).hexdigest()

    def check_password(self, password):
        """Verify password against hash"""
        return self.password_hash == hashlib.sha256(password.encode()).hexdigest()

    def set_biometric(self, biometric_data):
        """Hash biometric data using SHA-256"""
        if isinstance(biometric_data, str):
            self.biometric_hash = hashlib.sha256(biometric_data.encode()).hexdigest()
        else:
            # If biometric_data is bytes (e.g., image data)
            self.biometric_hash = hashlib.sha256(biometric_data).hexdigest()

    def check_biometric(self, biometric_data):
        """Verify biometric data against hash"""
        if isinstance(biometric_data, str):
            return self.biometric_hash == hashlib.sha256(biometric_data.encode()).hexdigest()
        else:
            return self.biometric_hash == hashlib.sha256(biometric_data).hexdigest()

    def is_expired(self):
        """Check if user account is expired"""
        if self.expire_time:
            return datetime.now() > self.expire_time
        return False

    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary"""
        data = {
            'id': self.id,
            'email': self.email,
            'is_admin': self.is_admin,
            'expire_time': self.expire_time.isoformat() if self.expire_time else None,
            'created_at': self.created_at.isoformat()
        }
        if include_sensitive:
            data['biometric_hash'] = self.biometric_hash
        return data

    def __repr__(self):
        return f'<User {self.email}>'


class Log(db.Model):
    __tablename__ = 'logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    access_granted = db.Column(db.Boolean, nullable=False)
    error_log = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        """Convert log to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_email': self.user.email if self.user else None,
            'access_granted': self.access_granted,
            'error_log': self.error_log,
            'created_at': self.time.isoformat(),
        }

    def __repr__(self):
        return f'<Log {self.id} - User {self.user_id} - {"Granted" if self.access_granted else "Denied"}>'