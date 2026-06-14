import requests, json

def get_token():
    # Login as superadmin to obtain JWT token
    login_url = 'http://127.0.0.1:8001/api/auth/login'
    # OAuth2PasswordRequestForm expects form-encoded data, not JSON
    login_payload = {'username': 'superadmin', 'password': 'SuperAdmin@123'}
    resp = requests.post(login_url, data=login_payload)
    data = resp.json()
    return data.get('access_token')

def main():
    token = get_token()
    if not token:
        print('Failed to obtain token')
        return
    url = 'http://127.0.0.1:8001/api/users/'
    payload = {
        'username': 'testuser',
        'password': 'Test123!',
        'role_ids': [1]
    }
    headers = {'Authorization': f'Bearer {token}'}
    resp = requests.post(url, json=payload, headers=headers)
    print('Status:', resp.status_code)
    print('Response:', resp.text)

if __name__ == '__main__':
    main()