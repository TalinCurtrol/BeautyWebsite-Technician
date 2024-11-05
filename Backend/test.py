# app.py
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from user import user_bp, decode_token, generate_token
from admin import admin_bp
from customer import customer_bp
from technician import technician_bp

app = Flask(__name__)
CORS(app)

def authenticate(usertype):
    def wrapper():
        # token = request.headers.get('Authorization')
        token = generate_token('user1', 'ROLE_CUSTOMER', '4')
        #print(token)
        if not token:
            return jsonify({"message": "Missing authorization header"}), 401
        payload = decode_token(token)
        print(payload)
        g.user_id = int(payload['ID'])
        print(g.user_id)
        if payload['ROLE'] != usertype:
            return jsonify({"message": "Invalid authorization header"}), 403
    return wrapper

admin_bp.before_request(authenticate('ROLE_ADMIN'))
customer_bp.before_request(authenticate('ROLE_CUSTOMER'))
technician_bp.before_request(authenticate('ROLE_TECHNICIAN'))

app.register_blueprint(user_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(customer_bp)
app.register_blueprint(technician_bp)

if __name__ == '__main__':
    app.run(debug=True)
