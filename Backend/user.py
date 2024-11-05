from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Blueprint
from pymongo import MongoClient
import base64
import requests
import stripe
import config
import hashlib
import jwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

user_bp = Blueprint('user', __name__)

#stripe key
stripe.api_key = config.STRIPE_API_KEY

#database
client = MongoClient(config.MONGO_URI)
db = client[config.DB_NAME]
userProfile = db[config.USER_PROFILE_COLLECTION]
technician = db[config.TECHNICIAN_COLLECTION]
user_db = client[config.USERS_DB_NAME]
users = user_db[config.USERS_COLLECTION]

def generate_rsa_key():
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    return private_key

def private_key_to_pem(private_key):
    pem_private_key = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    return pem_private_key

def public_key_to_pem(private_key):
    public_key = private_key.public_key()
    pem_public_key = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return pem_public_key

rsa_key = generate_rsa_key()
pem_private_key = private_key_to_pem(rsa_key)
pem_public_key = public_key_to_pem(rsa_key)

def get_hash_password(password):
    salt = 'thisIsASalt'
    salted_password = password + salt
    hashed_password = hashlib.sha256(salted_password.encode()).hexdigest()
    return hashed_password

def generate_token(username, usertype, user_id):
    now = datetime.utcnow()
    expiration = now + timedelta(minutes=3000)
    exp_timestamp = int(expiration.timestamp())
    iat_timestamp = int(now.timestamp())

    payload = {
        "sub": username,
        "ROLE": usertype,
        "ID": user_id,
        "exp": exp_timestamp,
        "iat": iat_timestamp
    }

    token = jwt.encode(payload, pem_private_key, algorithm='RS256')
    return token

def decode_token(token):
    try:
        payload = jwt.decode(token, pem_public_key, algorithms=['RS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return "Token has expired"
    except jwt.InvalidTokenError:
        return "Invalid token"

def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response

###
#POST
###

@user_bp.route('/auth/login', methods=['POST', 'OPTIONS'])
def login():
    # login
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response = add_cors_headers(response)
        return response
    if request.method == 'POST':
        data = request.json
        username = data.get('userName')
        password = data.get('password')
        user = users.find_one({'username': username})
        if user:
            # Verify password
            hashed_password = get_hash_password(password)
            print(hashed_password,user['password_hash'])
            if hashed_password == user['password_hash']:
                # Generate token
                token = generate_token(username, user['usertype'], user['id'])
                print(token)
                return token
            else:
                return jsonify({'message': 'Invalid username or password'}), 401
        else:
            return jsonify({'message': 'User not found'}), 404

@user_bp.route('/auth/register/<type>', methods=['POST'])
def register(type):
    # register
    data = request.json
    username = data.get('userName')
    password = data.get('password')
    usertype = type.lower()
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    email = data.get('email')
    phone = data.get('phone')
    address = data.get('address')
    post_code = data.get('postCode')
    if usertype == 'technician':
        id = technician.find_one(sort=[("id", -1)])['id']+1
    elif usertype == 'customer':
        id = userProfile.find_one(sort=[("id", -1)])['id']+1
    else:
        return jsonify({'message': 'Invalid request'}), 400
    usertype = "ROLE_"+usertype.upper()
    existing_user = users.find_one({'username': username})
    if existing_user:
        return jsonify({'message': 'Username already exists'}), 400

    # Hash the password
    hashed_password = get_hash_password(password)

    # Insert the new user into the database
    new_user = {
        'username': username,
        'password_hash': hashed_password,
        'usertype': usertype,  # Assuming you have a user type field
        'id':id
    }

    users.insert_one(new_user)

    user_profile = {
        'id': id,
        'firstName': first_name,
        'lastName': last_name,
        'email': email,
        'phone': phone,
        'address': address,
        'postCode': post_code
    }

    if usertype == 'technician':
        id = technician.insert_one(user_profile)
    elif usertype == 'customer':
        id = userProfile.insert_one(user_profile)

    user = users.find_one({'username': username})
    # Generate token
    token = generate_token(username, user['usertype'], user['id'])

    # Return token as JSON response
    return jsonify({'token': token})

###
#GET
###

@user_bp.route('/logout', methods=['GET'])
def logout():
    # logout
    pass
