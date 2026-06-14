import base64, json, sys

jwt = sys.argv[1] if len(sys.argv) > 1 else ''
if not jwt:
    print('No JWT provided')
    sys.exit(1)
payload_part = jwt.split('.')[1]
# Pad base64 string
payload_part += '=' * (-len(payload_part) % 4)
payload = json.loads(base64.urlsafe_b64decode(payload_part).decode())
print(payload)