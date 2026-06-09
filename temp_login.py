import requests

def main():
    url = 'http://127.0.0.1:8001/api/auth/login'
    data = {'username': 'superadmin', 'password': 'SuperAdmin@123'}
    resp = requests.post(url, data=data)
    print('status', resp.status_code)
    print('body', resp.text)

if __name__ == '__main__':
    main()
