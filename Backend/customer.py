from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Blueprint, g
from pymongo import MongoClient
import base64
import requests
import stripe
import config

customer_bp = Blueprint('customer', __name__)

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

def get_postcode(address):
    # Google Geocoding API endpoint
    endpoint = 'https://maps.googleapis.com/maps/api/geocode/json'
    # 使用你的 API 密钥
    api_key = 'AIzaSyCys2fKmj6p1ihjar-ABq7dl5D1HfiFpbE'
    # 构建请求参数
    params = {
        'address': address,
        'key': api_key
    }

    # 发送请求
    response = requests.get(endpoint, params=params)
    result = response.json()

    # 解析响应结果
    if 'results' in result and len(result['results']) > 0:
        location = result['results'][0]
        # 获取邮政编码
        for component in location['address_components']:
            if 'postal_code' in component['types']:
                return component['long_name']
    return None

def create_order(data):
    # Replace this constant with a calculation of the order's amount
    # Calculate the order total on the server to prevent
    # people from directly manipulating the amount on the client
    print("create_order")
    id = order.find_one(sort=[("id", -1)])['id']+1
    userId = g.get('user_id')
    technicianId = int(data['technician'])
    serviceList = data['selectedServices']
    duration = sum(int(ser.get('durations', 0)) for ser in serviceList)
    serIds = [ser['id'] for ser in serviceList if 'id' in ser]
    addonList = data['selectedAddons']
    addonIds = [ser['id'] for ser in addonList if 'id' in ser]
    time = data['time']
    location = data['location']
    price = sum(ser.get('price', 0) for ser in serviceList)+sum(ser.get('price', 0) for ser in addonList)
    print(id,userId,technicianId,serIds,addonIds,duration,time,location,price)
    new_order = {
        'id': id,
        'userId':userId,
        'technicianId':technicianId,
        'status':'Pending',
        'serviceId':serIds,
        'addonId': addonIds,
        'location': location,
        'createdAt': datetime.now(),
        'date&time': time,
        'commissions': 40,
        'surcharge': 5,
        'currentState':'Pending',
        'durations': duration,
        'price': price,
    }
    res = order.find_one({'id':id})
    if res:
        pass
    else:
        result = order.insert_one(new_order)
    return price


@customer_bp.route('/create-payment-intent', methods=['POST'])
def create_payment():
    print('createPayment')
    data = request.json["allData"]
    # Create a PaymentIntent with the order amount and currency
    intent = stripe.PaymentIntent.create(
        amount=create_order(data['allData'])*100,
        currency='aud',
        # In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        automatic_payment_methods={
            'enabled': True,
        },
    )
    print(intent['client_secret'])
    return jsonify({
        'clientSecret': intent['client_secret']
    })
    return jsonify(error=str(e)), 403
######
#Customer
######

###
#POST
###
@customer_bp.route('/profile', methods=['POST'])
def create_profile():
    data = request.json
    if data:
        profile_id = userProfile.insert_one(data).inserted_id
        return jsonify({"success": True, "message": "Profile created successfully", "profile_id": str(profile_id)}), 201
    else:
        return jsonify({"success": False, "message": "No data provided"}), 400

@customer_bp.route('/postProfile', methods=["POST"])
def update_profile():
    print(request.json)
    data = request.json
    customer_id = g.get('user_id')
    if data:
        try:
            userProfile.update_one({"id": customer_id}, {"$set": {"firstName": data['firstName'], "lastName": data['lastName'], "email": data['email'], "phone": data['phone'], "address": data['address'], "postCode": data['postCode']}})
            return jsonify({"success": True, "message": "Profile updated successfully"}), 201
        except:
            return jsonify({"success": False, "message": "Profile updated failed"}), 204

@customer_bp.route('/getServicesByLocation', methods=['POST'])
def get_services_by_location():
    #find return a cursor
    print("get Services By Location")
    data = request.json
    location = data["location"]
    post_code = get_postcode(location)
    print(post_code)
    #get
    serviceList = []
    cursor = technician.find({}, {'_id': 0})
    #need to go through it with a loop
    for i in cursor:
        if abs(i["postCode"] - int(post_code))<5:
            serviceList.extend(i['service'])
    unique_elements = list(set(serviceList))
    serviceList = []
    cursor = service.find({}, {'_id': 0})
    for i in cursor:
        if i['id'] in unique_elements:
            serviceList.append(i)
    for ser in serviceList:
        if 'images' in ser:
            for i, img_data in enumerate(ser['images']):
                ser['images'][i] = base64.b64encode(img_data).decode('utf-8')
    if serviceList:
        return jsonify(serviceList), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

@customer_bp.route('/getAddons', methods=['POST'])
def get_addon_of_services():
    #find return a cursor
    print("get addon of services")
    services = request.json['services']
    service_ids = [service['id'] for service in services]
    AddonList = []
    cursor = service.find({}, {'_id': 0})
    #need to go through it with a loop
    for i in cursor:
        if i["id"] in service_ids:
            AddonList.extend(i['addon'])
    unique_elements = list(set(AddonList))
    AddonList = []
    cursor = addon.find({}, {'_id': 0})
    for i in cursor:
        if i['id'] in unique_elements:
            AddonList.append(i)
    #print(AddonList)
    if AddonList:
        return jsonify(AddonList), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

@customer_bp.route('/getTechnicians', methods=['POST'])
def get_technician():
    #find return a cursor
    print("get technicians based on service")
    services = request.json['serviceId']
    location = request.json['location']
    print("services:",services)
    print("location:",location)
    service_ids = [service['id'] for service in services]
    technicianList = []
    cursor = technician.find({}, {'_id': 0, 'id': 1, 'cvImage': 1, 'firstName': 1, 'lastName': 1, 'description': 1, 'service': 1})
    #need to go through it with a loop
    for i in cursor:
        if any(service_id in i['service'] for service_id in service_ids):
            technicianList.append(i)
    print(technicianList)
    for tech in technicianList:
        tech['cvImage'] = base64.b64encode(tech['cvImage']).decode('utf-8')
    if technicianList:
        return jsonify(technicianList), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

@customer_bp.route('/getTimeNotAvaliable', methods=['POST'])
def get_time_not_avaliable():
    #find return a cursor
    print("get technicians based on service")
    technicianId = request.json['technicianId']
    duration = request.json['duration']
    date = request.json['date']
    date_part = ' '.join(date.split()[:4])
    date = datetime.strptime(date_part, '%a %b %d %Y').date()
    print("technicianId:",technicianId)
    print("local date:", date)
    print("duration:", duration)
    cursor = order.find({'technicianId':int(technicianId)}, {'_id': 0})
    #need to go through it with a loop
    timeNotAvaliable = [[7,30]]
    for i in cursor:
        order_datetime = datetime.strptime(i['date&time'], '%Y/%m/%d %H:%M')
        order_duration = i['durations']
        print(order_datetime)
        if order_datetime.date() == date:
            start_time = (order_datetime - timedelta(minutes=duration)).time()
            end_time = (order_datetime + timedelta(minutes=order_duration)).time()
            current_time = datetime.combine(datetime.min, start_time)
            while current_time.time() < end_time:
                timeNotAvaliable.append([int(current_time.strftime('%H')), int(current_time.strftime('%M'))])
                current_time += timedelta(minutes=30)
    print(timeNotAvaliable)
    if timeNotAvaliable:
        return jsonify(timeNotAvaliable), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404
###
#GET
###
@customer_bp.route('/profile/<profile_id>', methods=['GET'])
def get_profile(profile_id):
    #find one return a object
    #（{}, {'_id': 0}） means not showing _id in the output
    profile = userProfile.find_one({"id": int(profile_id)}, {'_id': 0})
    print(profile)
    if profile:
        return jsonify(profile), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

@customer_bp.route('/getOrderByUserId/<user_id>', methods=['GET'])
def get_orders_by_userId(user_id):
    #find one return a object
    #（{}, {'_id': 0}） means not showing _id in the output
    user_id = g.get('user_id')
    orders = order.find({"userId": int(user_id)}, {'_id': 0})
    orders_list = []
    for ord in orders:

        tech = technician.find_one({"id": ord["technicianId"]}, {'_id': 0, 'firstName': 1, 'lastName': 1})
        # user = userProfile.find_one({"id": ord["userId"]}, {'_id': 0, 'firstName': 1, 'lastName': 1})
        order_with_profile = {**ord, **tech}
        orders_list.append(order_with_profile)
    if orders_list:
        return jsonify(orders_list), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

# @customer_bp.route('/postOrder', methods=['POST'])
# def post_order

@customer_bp.route('/getServices', methods=['GET'])
def get_services():
    #find return a cursor
    print("get Services")
    serviceList = []
    cursor = service.find({}, {'_id': 0})
    #need to go through it with a loop
    for i in cursor:
        serviceList.append(i)
    for ser in serviceList:
        if 'images' in ser:
            for i, img_data in enumerate(ser['images']):
                ser['images'][i] = base64.b64encode(img_data).decode('utf-8')

    if serviceList:
        return jsonify(serviceList), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

@customer_bp.route('/getServices/<post_code>', methods=['GET'])
def get_services_by_postcode(post_code):
    #find return a cursor
    print("get Services By Postcode")
    serviceList = []
    cursor = technician.find({}, {'_id': 0})
    #need to go through it with a loop
    for i in cursor:
        if abs(i["postCode"] - int(post_code))<5:
            serviceList.extend(i['service'])
    unique_elements = list(set(serviceList))
    serviceList = []
    cursor = service.find({}, {'_id': 0})
    for i in cursor:
        if i['id'] in unique_elements:
            serviceList.append(i)
    if serviceList:
        return jsonify(serviceList), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

@customer_bp.route('/getTechnicianName/<id>', methods=['GET'])
def get_technician_name(id):
    #find return a cursor
    print("get technician name")
    tech = technician.find_one({"id":int(id)}, {'_id': 0,"id":1,"firstName":1,"lastName":1,})
    print(tech)
    if tech:
        return jsonify(tech), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404
