import sys, os
sys.path.append('backend')
from app.auth import utils

stored_hash = "$argon2id$v=19$m=65536,t=3,p=4$Pud8L4UQAkCI0fo/Z6yVkg$IjyMIybN0QwlPGfNZcWUoW0EyfYLzBXByX0soIGqfMQ"
result = utils.verify_password('SuperAdmin@123', stored_hash)
print('verify result:', result)