import requests

BASE_URL = "http://localhost.local:5000"

session = requests.Session()

login_data={
    "email": "admin@admin.com",
    "password": "admin"
}

login_response = session.post(f"{BASE_URL}/auth/login", json=login_data)

print(login_response.cookies)

for i in range(1, 21):
    user = {
        "email": f"user{i}@example.com",
        "days": f"{i}"
    }

    response = session.post(f"{BASE_URL}/users", json=user)

    print(i, response.status_code, response.json())