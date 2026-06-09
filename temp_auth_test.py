from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

# Login as superadmin (seeded credentials)
login_resp = client.post('/api/auth/login', data={'username': 'superadmin', 'password': 'superadmin'})
print('login status', login_resp.status_code)
print('login json', login_resp.json())

jwt = login_resp.json().get('access_token')
headers = {'Authorization': f'Bearer {jwt}'}

profile_resp = client.get('/api/profile', headers=headers)
print('profile status', profile_resp.status_code)
print('profile json', profile_resp.json())