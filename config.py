import os
from datetime import timedelta
from dotenv import load_dotenv

# Ładowanie zmiennych z pliku .env (przydatne lokalnie)
load_dotenv()

class Config:
    # Flask - wartości domyślne dla developmentu
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'domyslny-klucz-dla-dev-nie-uzywac-na-produkcji'

    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///database.db'
    ADMIN_PASS = os.environ.get('ADMIN_PASS') or 'admin123'
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL') or 'admin@admin.com'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'domyslny-klucz-jwt-dla-dev'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_COOKIE_SECURE = False  # False dla http (lokalnie), True dla https (produkcja)
    JWT_COOKIE_SAMESITE = "Strict"
    JWT_COOKIE_CSRF_PROTECT = False

    # CORS
    CORS_HEADERS = 'Content-Type'


class DevelopmentConfig(Config):
    """Konfiguracja pod środowisko deweloperskie (lokalne)"""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class ProductionConfig(Config):
    """Konfiguracja pod środowisko produkcyjne"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    
    # Wymuszamy bezpieczne ciasteczka na produkcji
    JWT_COOKIE_SECURE = True 
    
    # Usunięto blokady 'raise ValueError' dla łatwiejszego uruchamiania lokalnie
    