from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_jwt_extended.exceptions import NoAuthorizationError
from flask_restx import Api
from config import Config


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    from models import db
    db.init_app(app)

    jwt = JWTManager(app)
    CORS(app)

    api = Api(
        app,
        version='1.0',
        title='Authentication & Access Control API',
        description='A secure authentication system with JWT tokens, biometric support, and access logging',
        doc='/',
    )

    @api.errorhandler(NoAuthorizationError)
    def restx_no_auth_handler(error):
        return {'error': 'Missing or invalid token'}, 401

    # --- Rejestracja Przestrzeni Nazw (Namespaces) ---
    # WAŻNE: Parametr 'path' MUSI zaczynać się od '/'

    # 1. Użytkownicy
    from routes.user import user_ns
    api.add_namespace(user_ns, path='/users')

    # 2. Autoryzacja (Login/Signup)
    from routes.auth import auth_ns
    api.add_namespace(auth_ns, path='/auth')  # <-- Tutaj był błąd (brakowało /)

    # 3. Logi wejść
    from routes.log import log_ns
    api.add_namespace(log_ns, path='/logs')

    # 4. Kontrola Dostępu (Bramka + QR)
    from routes.access_control import access_ns
    api.add_namespace(access_ns, path='/access')

    # Create database tables
    with app.app_context():
        db.create_all()

        # Create default admin user if not exists
        from models import User
        ADMIN_EMAIL = app.config.get("ADMIN_EMAIL", "admin@admin.com")
        ADMIN_PASS = app.config.get("ADMIN_PASS", "admin123")
        
        try:
            admin = User.query.filter_by(email=ADMIN_EMAIL).first()
            if not admin:
                print(f"Creating default admin: {ADMIN_EMAIL}")
                admin = User(
                    email=ADMIN_EMAIL,
                    is_admin=True
                )
                admin.set_password(ADMIN_PASS)
                # Inicjalizujemy token QR dla admina, żeby nie było błędów null
                admin.regenerate_qr_token()
                db.session.add(admin)
                db.session.commit()
        except Exception as e:
            print(f"Warning: Could not create admin user (Database might not be ready): {e}")

    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'error': 'Token has expired'}, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'error': 'Invalid token'}, 401

    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        return {'error': 'Missing authorization token'}, 401

    return app