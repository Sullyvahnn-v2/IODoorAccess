## 🛠️ Technologie i Biblioteki

* **React 18** (Vite) - Szkielet aplikacji.
* **Axios** - Komunikacja z API Flask.
* **React Router DOM** - Zarządzanie trasami i dostępem (`ProtectedRoute`).
* **QRCode.react** - Generowanie dynamicznych kodów dostępu dla pracowników.
* **React Webcam** - Przechwytywanie obrazu do weryfikacji biometrycznej.

## 📋 Wymagania wstępne

* **Node.js** (wersja >= 18.x)
* **Kamera internetowa** (niezbędna do modułu Bramki)
* **Backend Flask** uruchomiony pod adresem `http://127.0.0.1:5000`

## 🚀 Instalacja

1. Przejdź do folderu frontendu:
   ```bash
   cd frontend
   
2. Zainstaluj wymagane biblioteki:
   ```bash
   npm install
   npm install axios react-router-dom react-hook-form qrcode.react html5-qrcode react-webcam recharts lucide-react clsx tailwind-merge
   npm install -D tailwindcss postcss autoprefixer

## Uruchamianie
   ```bash
    npm run dev -- --host