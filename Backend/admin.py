from datetime import datetime, timedelta
from flask import Flask, make_response, request, jsonify, Blueprint
from pymongo import MongoClient
import base64
import requests
import stripe
import config
import hashlib

admin_bp = Blueprint('admin', __name__)

@admin_bp.before_request
def before_request():
    if request.method == 'OPTIONS':
        # CORS preflight request
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        return response

#stripe key
stripe.api_key = config.STRIPE_API_KEY

#database
client = MongoClient(config.MONGO_URI)
db = client[config.DB_NAME]
userProfile = db[config.USER_PROFILE_COLLECTION ]
service = db[config.SERVICE_COLLECTION ]
addon = db[config.ADDON_COLLECTION ]
order = db[config.ORDER_COLLECTION ]
technician = db[config.TECHNICIAN_COLLECTION ]

user = client[config.USERS_DB_NAME]
users = user[config.USERS_COLLECTION]

###
#POST
###
@admin_bp.route('/updateTechnicianInfo', methods=['POST'])
def update_technician_info():
    newInfo = request.json

    technician_id = newInfo["id"]
    firstName = newInfo["firstName"]
    lastName = newInfo["lastName"]
    email = newInfo["email"]
    phone= newInfo["phoneNumber"]
    address = newInfo["address"]
    status = 1 if newInfo["status"] == "pass" else 0

    technician.update_one({'id':int(technician_id)}, {'$set': {'firstName':firstName,'lastName':lastName,'email':email, 
                                                                'phone': phone, 'address': address, 'verification': status}})
    return jsonify(newInfo), 200

@admin_bp.route('/deleteTechnicianById', methods=['POST'])
def delete_technician():
    newInfo = request.json

    technician_id = newInfo["id"]
    result = technician.delete_one({'id': int(technician_id)})
    return "delete successfully", 200

@admin_bp.route('/deleteCustomerById', methods=['POST'])
def delete_customer():
    newInfo = request.json

    customer_id = newInfo["id"]
    result = userProfile.delete_one({'id': int(customer_id)})
    return "delete successfully", 200

@admin_bp.route('/updateCustomerInfo', methods=['POST'])
def update_customer_info():
    newInfo = request.json

    customer_id = newInfo["id"]
    firstName = newInfo["firstName"]
    lastName = newInfo["lastName"]
    email = newInfo["email"]
    phone= newInfo["phoneNumber"]
    address = newInfo["address"]
    postCode = newInfo["postCode"]

    userProfile.update_one({'id':int(customer_id)}, {'$set': {'firstName':firstName,'lastName':lastName,'email':email, 
                                                                'phone': phone, 'address': address, 'postCode': int(postCode)}})
    return jsonify(newInfo), 200

@admin_bp.route('/addCustomer', methods=['POST'])
def add_customer():
    newCustomer = request.json

    # customer_id = (userProfile.count_documents({}) *1000) + 1
    customer_id = users.find_one(sort=[("id", -1)])['id']+1
    firstName = newCustomer["firstName"]
    lastName = newCustomer["lastName"]
    email = newCustomer["email"]
    phone = newCustomer["phoneNumber"]
    address = newCustomer["address"]
    postCode = newCustomer["postCode"]
    userName = newCustomer["userName"]
    password = newCustomer["password"]

    existing_user = users.find_one({'username': userName})
    if existing_user:
        return jsonify({'message': 'Username already exists'}), 400
    else:
        userProfile.insert_one({
            'id': customer_id,
            'firstName': firstName,
            'lastName': lastName,
            'email': email,
            'phone': int(phone),
            'address': address,
            'postCode': int(postCode)
        })

        hashed_password = get_hash_password(password)

        new_user = {
            'username': userName,
            'password_hash': hashed_password,
            'usertype': "ROLE_CUSTOMER", 
            'id':customer_id
        }
        users.insert_one(new_user)

        return jsonify(newCustomer), 200

#-----------------------------------------------------------------------------------------------------------------------
###
#GET
###
@admin_bp.route('/allTechnicians', methods=['GET'])
def get_all_technicians():
    technicianList = []

    cursor = technician.find({}, {"_id": 0,"id": 1, "firstName": 1, "lastName": 1, "verification": 1,"email": 1, 
    "address":1,"phone":1,"driverLicenseImage":1, "secondaryIdImage":1, "workingPermitImage":1,"nailLicenseImage":1})
    
    for i in cursor:
        i['id'] = str(i['id'])
        i['status'] = 'pass' if i.pop('verification', 0) == 1 else 'needReview'
        i['phoneNumber'] = i.pop('phone', None)
        i['driverlicense'] = i.pop('driverLicenseImage', None)
        i['secondaryid'] = i.pop('secondaryIdImage', None)
        i['workingpermit'] = i.pop('workingPermitImage', None)
        i['naillicense'] = i.pop('nailLicenseImage', None)

        i['driverlicense'] = base64.b64encode(i['driverlicense']).decode('utf-8')
        i['secondaryid'] = base64.b64encode(i['secondaryid']).decode('utf-8')
        i['workingpermit'] = base64.b64encode(i['workingpermit']).decode('utf-8')
        i['naillicense'] = base64.b64encode(i['naillicense']).decode('utf-8')
        technicianList.append(i)
    print(technicianList)
    if technicianList:
        return jsonify(technicianList), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404
    
@admin_bp.route('/allCustomers', methods=['GET'])
def get_all_customers():
    customerList = []

    cursor = userProfile.find({}, {"_id": 0,"id": 1, "firstName": 1, "lastName": 1, "email": 1, 
    "address":1,"phone":1,"postCode":1})
    
    for i in cursor:
        i['id'] = str(i['id'])
        i['postCode'] = str(i['postCode'])
        i['phoneNumber'] = i.pop('phone', None)
        customerList.append(i)
    if customerList:
        return jsonify(customerList), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

def get_hash_password(password):
    salt = 'thisIsASalt'
    salted_password = password + salt
    hashed_password = hashlib.sha256(salted_password.encode()).hexdigest()
    return hashed_password