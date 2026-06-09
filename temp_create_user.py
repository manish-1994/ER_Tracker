import requests

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdXBlcmFkbWluIiwiZXhwIjoxNzgxMDE2NDc2fQ.CwL2IxUArHmyz5Ft3v1S6MlaGeQx1_iAE0gzTiYfURY"

def main():
    url = "http://127.0.0.1:8001/api/api/users/"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {"username": "testuser", "password": "Pass123!", "role_ids": [2]}
    resp = requests.post(url, json=payload, headers=headers)
    print("status", resp.status_code)
    print("body", resp.text)

if __name__ == "__main__":
    main()
