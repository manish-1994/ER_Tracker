import requests

def main():
    # Login as SuperAdmin to obtain JWT
    login_resp = requests.post(
        "http://127.0.0.1:8001/api/auth/login",
        data={"username": "superadmin", "password": "SuperAdmin@123"},
    )
    token = login_resp.json().get("access_token")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {"username": "testuser3", "password": "Pass123!", "role_ids": [2]}
    # Note: due to current router prefixes, the endpoint is /api/api/users/
    resp = requests.post(
        "http://127.0.0.1:8001/api/api/users/",
        json=payload,
        headers=headers,
    )
    print("status", resp.status_code)
    print("body", resp.text)

if __name__ == "__main__":
    main()
