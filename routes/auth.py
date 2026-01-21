from datetime import datetime, timedelta
from routes.log import make_log

from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import (
    create_access_token,
    set_access_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity
)

from models import User, db
from routes.user import admin_required
from utils.qrCode import verify_token, generate_secure_token

# Namespace
auth_ns = Namespace('auth', description='Authentication operations')

# Swagger Models
signup_model = auth_ns.model('Signup', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password'),
    'days': fields.Integer(required=False, description='Expiration date', default=365)
})

qr_generate_model = auth_ns.model('QrGenerate', {
    'user_id': fields.String(required=True, description='User id'),
})

login_model = auth_ns.model('Login', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password')
})

user_model = auth_ns.model('User', {
    'id': fields.Integer,
    'email': fields.String,
    'is_admin': fields.Boolean,
    'expire_time': fields.String,
    'created_at': fields.String
})
qr_token_model = auth_ns.model('QRToken', {
    'token': fields.String(description='QR authentication token')
})

qr_verify_model = auth_ns.model('QRVerify', {
    'token': fields.String(required=True, description='QR token to verify')
})


@auth_ns.route('/create')
class Signup(Resource):
    @admin_required()
    @auth_ns.expect(signup_model)
    @auth_ns.response(201, 'User created successfully')
    @auth_ns.response(400, 'Email and password are required')
    @auth_ns.response(409, 'Email already exists')
    def post(self):
        data = request.json
        email = data.get('email')
        password = data.get('password')
        days = data.get('days')

        if not email or not password:
            return {'message': 'Email and password are required'}, 400

        if User.query.filter_by(email=email).first():
            return {'message': 'Email already exists'}, 409

        try:
            expire_time = datetime.now() + timedelta(days=days)
        except Exception:
            return {'message': 'Invalid date format. Use DD.MM.YYYY'}, 400

        user = User(email=email, expire_time=expire_time)
        user.set_password(password)

        db.session.add(user)
        db.session.commit()
        return {'message': 'User created successfully'}, 201


@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.expect(login_model)
    @auth_ns.response(200, 'Login successful')
    @auth_ns.response(400, 'Email and password required')
    @auth_ns.response(401, 'Invalid credentials')
    @auth_ns.response(403, 'Account expired')
    def post(self):
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return {'message': 'Email and password required'}, 400

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return {'message': 'Invalid credentials'}, 401

        if user.is_expired() and not user.is_admin:
            return {'message': 'Account expired'}, 403

        access_token = create_access_token(identity=user.email)

        resp = jsonify({'message': 'Login successful'})
        set_access_cookies(resp, access_token)

        return resp


@auth_ns.route('/logout')
class Logout(Resource):
    @jwt_required()
    @auth_ns.response(200, 'Logged out')
    def post(self):
        resp = jsonify({'message': 'Logged out'})
        unset_jwt_cookies(resp)
        return resp


@auth_ns.route('/me')
class Me(Resource):
    @jwt_required()
    @auth_ns.marshal_with(user_model)
    @auth_ns.response(200, 'Success', user_model)
    @auth_ns.response(404, 'User not found')
    def get(self):
        user_email = get_jwt_identity()
        user = User.query.filter_by(email=user_email).first()
        user = User.query.get(user.id)

        if not user:
            return {'message': 'User not found'}, 404

        return user.to_dict()


@auth_ns.route('/qr/generate')
class GenerateQR(Resource):
    @admin_required()
    @auth_ns.marshal_with(qr_token_model)
    @auth_ns.expect(qr_generate_model)
    @auth_ns.response(200, 'QR token generated')
    def post(self):
        data = request.json
        user_id = data.get('user_id')
        user = User.query.get(user_id)

        if not user:
            return {'message': 'User not found'}, 404

        token = generate_secure_token(user_id)

        return {'token': token}

@auth_ns.route('/qr/verify')
class VerifyQR(Resource):
    @auth_ns.response(200, 'QR verified')
    @auth_ns.expect(qr_verify_model)
    @auth_ns.response(401, 'Invalid or expired QR token')
    def post(self):
        data = request.json
        token = data.get('token')

        if not token:
            return {'message': 'Token is required'}, 400

        user_id = verify_token(token)
        if not user_id:
            make_log(-1, False, "Invalid or expired QR token")
            return {'message': 'Invalid or expired QR token'}, 401

        user = User.query.get(user_id)
        if not user:
            return {'message': 'User not found'}, 404

        make_log(user_id, True, "QR authentication successful")
        resp = jsonify({
            'message': 'QR authentication successful',
            'user': user.email
        })

        return resp