import sys, os
sys.path.append('backend')
from app.auth import utils

new_hash = utils.get_password_hash('SuperAdmin@123')
print('NEW_HASH:', new_hash)