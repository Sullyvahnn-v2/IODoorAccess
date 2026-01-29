import cv2
import numpy as np
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from jwt import ExpiredSignatureError

from models import db, User
from datetime import datetime, date, timedelta
from functools import wraps
from utils.faceRecognition import get_embedding

user_ns = Namespace('users', description='User management operations')

# Models for Swagger documentation
user_model = user_ns.model('User', {
    'id': fields.Integer(description='User ID', readonly=True),
    'email': fields.String(description='User email'),
    'is_admin': fields.Boolean(description='Admin status'),
    'expire_time': fields.String(description='Account expiration time'),
    'created_at': fields.String(description='Account creation time', readonly=True)
})

user_update_model = user_ns.model('UserUpdate', {
    'expire_in_days': fields.Integer(description='Expiration interval in days from now', required=True, default=365),
})

user_search_model = user_ns.model('UserSearch', {
    'users': fields.List(fields.Nested(user_model)),
    'count': fields.Integer(description='Number of results')
})

user_stats_model = user_ns.model('UserStats', {
    'total_users': fields.Integer(description='Total number of users'),
    'admin_users': fields.Integer(description='Number of admin users'),
    'regular_users': fields.Integer(description='Number of regular users'),
    'expired_users': fields.Integer(description='Number of expired users'),
    'users_with_biometric': fields.Integer(description='Users with biometric utils enabled')
})

message_model = user_ns.model('Message', {
    'message': fields.String(description='Success message'),
    'user': fields.Nested(user_model)
})

error_model = user_ns.model('Error', {
    'error': fields.String(description='Error message')
})


def admin_required():
    """Decorator to require admin privileges safely"""

    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                # verify JWT, this respects allow_expired=False
                verify_jwt_in_request()
                claims = get_jwt()
            except ExpiredSignatureError:
                return {'error': 'Token has expired'}, 401
            except Exception as e:
                return {'error': str(e)}, 401
            email = claims.get('sub')
            user = User.query.filter_by(email=email).first()
            if not user:
                return {'error': 'User does not exist'}, 401

            if not user.is_admin:
                return {'error': 'Admin privileges required'}, 403

            return fn(*args, **kwargs)

        return decorator

    return wrapper


@user_ns.route('/')
class UserList(Resource):
    @user_ns.doc('get_users',
                 description='Get all users (admin only) or current user information')
    @user_ns.response(401, 'Unauthorized', error_model)
    @user_ns.response(200, 'List of all users(admin)/ one user', user_stats_model)
    @admin_required()
    def get(self):
        """Get all users (admin) or current user"""
        users = User.query.all()

        return {
            'users': [user.to_dict() for user in users],
        }, 200


@user_ns.route('/<int:user_id>')
class UserDetail(Resource):
    @user_ns.doc('get_user',
                 description='Get specific user by ID. Users can only view their own data unless they are admin.',
                 params={'user_id': 'User ID'})
    @user_ns.response(200, 'Success', user_model)
    @user_ns.response(401, 'Unauthorized', error_model)
    @user_ns.response(403, 'Forbidden', error_model)
    @user_ns.response(404, 'User not found', error_model)
    @admin_required()
    def get(self, user_id):
        """Get user by ID"""

        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}, 404

        return user.to_dict(include_sensitive=True), 200

    @user_ns.doc('update_user',
                 description='Update user information. Users can only update their own data unless they are admin.',
                 params={'user_id': 'User ID'})
    @user_ns.expect(user_update_model)
    @user_ns.response(200, 'User updated successfully', message_model)
    @user_ns.response(400, 'Validation error', error_model)
    @user_ns.response(401, 'Unauthorized', error_model)
    @user_ns.response(403, 'Forbidden', error_model)
    @user_ns.response(404, 'User not found', error_model)
    @user_ns.response(409, 'Email already in use', error_model)
    @user_ns.response(500, 'Internal server error', error_model)
    @admin_required()
    def put(self, user_id):
        identity = get_jwt_identity()
        user = User.query.filter_by(email=identity).first()
        """Update user information"""
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}, 404

        try:
            data = user_ns.payload

            if 'days' in data:
                days = data.get('days')

                if days is None:
                    user.expire_time = user.expire_time
                else:
                    days = int(days)
                    user.expire_time = user.expire_time + timedelta(days=days)

            db.session.commit()

            return {
                'message': 'User updated successfully',
                'user': user.to_dict()
            }, 200

        except (ValueError, TypeError):
            db.session.rollback()
            return {'error': 'expire_days must be a number'}, 400

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @user_ns.doc('delete_user',
                 description='Delete user (admin only). Admins cannot delete themselves.',
                 params={'user_id': 'User ID'})
    @user_ns.response(200, 'User deleted successfully')
    @user_ns.response(400, 'Cannot delete own account', error_model)
    @user_ns.response(401, 'Unauthorized', error_model)
    @user_ns.response(403, 'Admin privileges required', error_model)
    @user_ns.response(404, 'User not found', error_model)
    @user_ns.response(500, 'Internal server error', error_model)
    @admin_required()
    def delete(self, user_id):
        """Delete user (admin only)"""
        identity = get_jwt_identity()
        user =User.query.filter_by(email=identity).first()

        if user.id == user_id:
            return {'error': 'Cannot delete your own account'}, 400

        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}, 404

        try:
            db.session.delete(user)
            db.session.commit()

            return {'message': 'User deleted successfully'}, 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

@user_ns.route('/<int:user_id>/photo')
class UserPhoto(Resource):

    def post(self, user_id):
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404

        if 'photo' not in request.files:
            return {"message": "No photo provided"}, 400

        file = request.files['photo']

        # --- read image ---
        np_img = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        if img is None:
            return {"message": "Invalid image"}, 400

        # --- compute embedding ---
        embedding = get_embedding(img)
        if embedding is None:
            return {"message": "No face detected"}, 400

        # --- save embedding ---
        user.biometric_hash = embedding.tolist()
        db.session.commit()

        return {
            "message": "Photo processed successfully",
            "user_id": user.id
        }, 200