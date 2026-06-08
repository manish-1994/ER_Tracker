import sys, json  
sys.path.append('backend')  
from app.main import app  
routes = [{'path': r.path, 'methods': list(r.methods)} for r in app.routes]  
print(json.dumps(routes, indent=2)) 
