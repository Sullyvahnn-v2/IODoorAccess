from flask import request, send_file
from flask_restx import Namespace, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.datastructures import FileStorage
from models import db, User, Log
import numpy as np
import cv2
import io
import json
from datetime import datetime

# --- IMPORT FUNKCJI KOLEGI ---
# Importujemy funkcje z plików w folderze 'auth'
# Upewnij się, że masz plik auth/__init__.py (może być pusty), aby Python widział folder jako pakiet
try:
    from auth.faceRecognition import get_embedding, authenticate
    from auth.qrCode import generate_qr_code, verify_token
except ImportError as e:
    print(f"BŁĄD KRYTYCZNY: Nie można zaimportować modułów auth. Sprawdź czy pliki istnieją. Szczegóły: {e}")
    # Definiujemy atrapy, żeby Swagger mógł wstać mimo błędu (do debugowania)
    get_embedding, authenticate = None, None
    generate_qr_code, verify_token = None, None

access_ns = Namespace('access', description='Kontrola dostępu (Integrated: InsightFace + SecureQR)')

# --- Parsery Swaggera ---
upload_parser = access_ns.parser()
upload_parser.add_argument('file', location='files', type=FileStorage, required=True, help='Zdjęcie twarzy do rejestracji (JPG/PNG)')

verify_parser = access_ns.parser()
verify_parser.add_argument('qr_token', type=str, required=True, location='form', help='Treść zeskanowanego kodu QR (string)')
verify_parser.add_argument('image', location='files', type=FileStorage, required=True, help='Zdjęcie z kamery na bramce')


def file_to_opencv_image(file_storage):
    """Konwersja FileStorage -> OpenCV Image (numpy array)"""
    file_bytes = np.frombuffer(file_storage.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    return img


@access_ns.route('/register-biometrics')
class RegisterBiometrics(Resource):
    @jwt_required()
    @access_ns.expect(upload_parser)
    @access_ns.response(200, 'Biometria zapisana pomyślnie')
    def post(self):
        """Rejestracja twarzy (InsightFace)"""
        args = upload_parser.parse_args()
        file = args['file']
        
        current_user_email = get_jwt_identity()
        user = User.query.filter_by(email=current_user_email).first()
        
        if not user:
            return {'error': 'Użytkownik nieznany'}, 404

        try:
            img = file_to_opencv_image(file)
            if img is None:
                 return {'error': 'Nieprawidłowy plik obrazu'}, 400

            # Użycie funkcji kolegi
            if get_embedding is None:
                 return {'error': 'Moduł faceRecognition nie został poprawnie załadowany.'}, 500

            embedding = get_embedding(img)
            
            if embedding is None:
                return {'error': 'Nie wykryto twarzy. Upewnij się, że twarz jest dobrze oświetlona.'}, 400
            
            # Zapisujemy wektor jako listę JSON
            # InsightFace zwraca float32, konwertujemy na standardowy float
            encoding_list = embedding.tolist()
            user.set_biometric_encoding(encoding_list)
            
            db.session.commit()
            
            return {'message': 'Biometria zarejestrowana pomyślnie.'}, 200
            
        except Exception as e:
            return {'error': f'Błąd przetwarzania: {str(e)}'}, 500


@access_ns.route('/my-qr')
class MyQRCode(Resource):
    @jwt_required()
    def get(self):
        """
        Generuje dynamiczny, bezpieczny kod QR (ważny 5 minut).
        Wykorzystuje auth/qrCode.py
        """
        current_user_email = get_jwt_identity()
        user = User.query.filter_by(email=current_user_email).first()
        
        if not user:
            return {'error': 'User not found'}, 404
            
        try:
            # Używamy funkcji kolegi: generate_qr_code(user_id)
            if generate_qr_code is None:
                return {'error': 'Moduł qrCode nie został poprawnie załadowany.'}, 500

            # Przekazujemy user.id jako identyfikator
            pil_image = generate_qr_code(str(user.id))
            
            # Zapisz do pamięci RAM, żeby wysłać do przeglądarki
            buf = io.BytesIO()
            pil_image.save(buf, format='PNG')
            buf.seek(0)
            
            return send_file(buf, mimetype='image/png', as_attachment=False, download_name='secure_pass.png')
            
        except Exception as e:
            return {'error': f'Błąd generowania QR: {str(e)}'}, 500


@access_ns.route('/verify-entry')
class VerifyEntry(Resource):
    @access_ns.expect(verify_parser)
    def post(self):
        """
        BRAMKA WEJŚCIOWA:
        1. Weryfikuje podpis cyfrowy i ważność kodu QR (auth/qrCode.py)
        2. Weryfikuje twarz (auth/faceRecognition.py)
        3. Rejestruje próbę w bazie (models.py)
        """
        args = verify_parser.parse_args()
        qr_token_string = args['qr_token'] # To jest string odczytany z QR
        image_file = args['image']         # To jest zdjęcie z kamery
        
        # Sprawdzenie czy moduły są załadowane
        if verify_token is None or authenticate is None:
             return {'message': 'Błąd serwera: Moduły autoryzacji niedostępne', 'access_granted': False}, 500

        # --- ETAP 1: Weryfikacja QR (Krypto + Czas) ---
        
        # Funkcja verify_token zwraca ID usera (jeśli OK) lub None (jeśli błąd/atak)
        user_id_from_qr = verify_token(qr_token_string)
        
        if not user_id_from_qr:
            return {'message': 'QR nieważny, wygasł lub sfałszowany', 'access_granted': False}, 401
            
        # Pobieramy użytkownika z bazy na podstawie ID z tokena
        user = User.query.get(int(user_id_from_qr))
        
        if not user:
            return {'message': 'Token poprawny, ale użytkownik nie istnieje w bazie', 'access_granted': False}, 404

        # Inicjalizacja logu
        log = Log(user=user, created_at=datetime.utcnow(), verification_method='SecureQR+InsightFace')

        # --- ETAP 2: Sprawdzenie statusu konta ---
        if user.is_expired():
            log.access_granted = False
            log.error_log = "Konto pracownika wygasło"
            db.session.add(log)
            db.session.commit()
            return {'message': 'Konto wygasło', 'access_granted': False}, 403

        # --- ETAP 3: Sprawdzenie czy użytkownik ma zarejestrowaną twarz ---
        stored_encoding_list = user.get_biometric_encoding()
        if not stored_encoding_list:
            log.access_granted = False
            log.error_log = "Brak zarejestrowanej biometrii"
            db.session.add(log)
            db.session.commit()
            return {'message': 'Brak wzorca twarzy w bazie. Udaj się do HR.', 'access_granted': False}, 400

        # --- ETAP 4: Weryfikacja Twarzy (AI) ---
        try:
            # Konwersja zdjęcia z kamery
            img_camera = file_to_opencv_image(image_file)
            
            # Konwersja wzorca z bazy (JSON list -> Numpy array)
            user_emb_np = np.array(stored_encoding_list, dtype=np.float32)
            
            # Wywołanie funkcji kolegi: authenticate(image, user_emb)
            # Zwraca: (True/False, user_id, similarity)
            is_match, _, similarity = authenticate(img_camera, user_emb_np, threshold=0.5) 
            
            if is_match:
                # SUKCES!
                log.access_granted = True
                log.error_log = None
                db.session.add(log)
                db.session.commit()
                return {
                    'message': f'Wstęp dozwolony. Witaj {user.email}!',
                    'similarity': float(similarity),
                    'access_granted': True
                }, 200
            else:
                # PORAŻKA BIOMETRYCZNA
                log.access_granted = False
                log.error_log = f"Twarz nie pasuje (podobieństwo: {similarity:.2f})"
                db.session.add(log)
                db.session.commit()
                return {
                    'message': 'Weryfikacja twarzy nieudana. To nie jest Twoja przepustka.',
                    'similarity': float(similarity),
                    'access_granted': False
                }, 401

        except Exception as e:
            log.access_granted = False
            log.error_log = f"Błąd systemu: {str(e)}"
            db.session.add(log)
            db.session.commit()
            return {'message': 'Wewnętrzny błąd serwera', 'access_granted': False}, 500