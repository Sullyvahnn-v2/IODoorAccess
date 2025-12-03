from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, User
from datetime import datetime
from functools import wraps

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
    'email': fields.String(description='New email address', example='newemail@loco.pl'),
    'password': fields.String(description='New password', example='newpassword123'),
    'biometric_data': fields.String(description='New biometric data', example='new_fingerprint_data'),
    'expire_time': fields.String(description='New expiration time (ISO format)', example='2026-12-31T23:59:59'),
    'is_admin': fields.Boolean(description='Admin privileges (admin only)', example=False)
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
    'users_with_biometric': fields.Integer(description='Users with biometric auth enabled')
})

message_model = user_ns.model('Message', {
    'message': fields.String(description='Success message'),
    'user': fields.Nested(user_model)
})

error_model = user_ns.model('Error', {
    'error': fields.String(description='Error message')
})


def admin_required():
    """Decorator to require admin privileges"""

    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            if not claims.get('is_admin', False):
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
            'users': [user.to_dict() for user in users.items],
            'total': users.total,
            'page': users.page,
            'pages': users.pages
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
    @jwt_required()
    def put(self, user_id):
        identity = get_jwt_identity()
        user = User.query.filter_by(email=identity).first()
        """Update user information"""
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}, 404

        if not user.is_admin and user.id != user_id:
            return {'error': 'Not authorized'}, 401
        try:
            data = user_ns.payload

            if data.get('email'):
                existing_user = User.query.filter_by(email=data['email']).first()
                if existing_user and existing_user.id != user_id:
                    return {'error': 'Email already in use'}, 409
                user.email = data['email']

            if data.get('password'):
                user.set_password(data['password'])

            if data.get('biometric_data'):
                user.set_biometric(data['biometric_data'])

            if 'expire_time' in data and user.is_admin:
                if data['expire_time']:
                    try:
                        user.expire_time = datetime.fromisoformat(data['expire_time'])
                    except ValueError:
                        return {'error': 'Invalid expire_time format. Use ISO format'}, 400
                else:
                    user.expire_time = None

            db.session.commit()

            return {
                'message': 'User updated successfully',
                'user': user.to_dict()
            }, 200

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