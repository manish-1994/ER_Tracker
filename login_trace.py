import traceback
import sys, os
sys.path.append('backend')
from fastapi.testclient import TestClient
from backend.app.main import app  # assuming main creates FastAPI app
from backend.app.core.config import settings
from backend.app.auth import utils

client = TestClient(app)

def attempt_login(username: str, password: str):
    try:
        print('STEP 1 - LOGIN REQUEST')
        response = client.post('/api/auth/login', data={'username': username, 'password': password})
        print('STEP 2 - RESPONSE RECEIVED')
        print('Status code:', response.status_code)
        print('JSON:', response.json())
    except Exception as e:
        print('=' * 80)
        print('LOGIN EXCEPTION')
        print(type(e).__name__)
        print(str(e))
        traceback.print_exc()
        print('=' * 80)
        raise

if __name__ == '__main__':
    print('SECRET_KEY length:', len(settings.SECRET_KEY))
    print('ALGORITHM:', settings.ALGORITHM)
    attempt_login('superadmin', 'SuperAdmin@123')