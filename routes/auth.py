from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_access_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity
)
from models import User, db
from datetime import datetime
import hashlib

# Namespace
auth_ns = Namespace('auth', description='Authentication operations')

# Swagger Models
signup_model = auth_ns.model('Signup', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password')
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


@auth_ns.route('/signup')
class Signup(Resource):
    @auth_ns.expect(signup_model)
    @auth_ns.response(201, 'User created successfully')
    @auth_ns.response(400, 'Email and password are required')
    @auth_ns.response(409, 'Email already exists')
    def post(self):
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return {'message': 'Email and password are required'}, 400

        if User.query.filter_by(email=email).first():
            return {'message': 'Email already exists'}, 409

        user = User(email=email)
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

        if user.is_expired():
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