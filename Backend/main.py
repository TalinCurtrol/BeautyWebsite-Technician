from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
import base64
import requests
import stripe

stripe.api_key = 'sk_test_51Jk5NZLE22eIGJeai3ffzlUYKUVUkTNcvyd8Wyq7DtCxsTGAvOGtxWxoMAOyoMDx0njjB5THiZFdgEsVShIscmv300jKL4a24r'

app = Flask(__name__)
CORS(app, origins="*")
client = MongoClient('mongodb://localhost:27017/')
db = client['Client']
userProfile = db['userProfile']
service = db['Service']
addon = db['Addon']
order = db['Order']
technician = db['Technician']

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
    userId = 1
    technicianId = int(data['technician'])
    serviceList = data['selectedServices']
    duration = sum(ser.get('durations', 0) for ser in serviceList)
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
    }
    res = order.find_one({'userId':userId,'technicianId':technicianId,'date&time': time})
    if res:
        pass
    else:
        result = order.insert_one(new_order)
    return price


@app.route('/create-payment-intent', methods=['POST'])
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
@app.route('/profile', methods=['POST'])
def create_profile():
    data = request.json
    if data:
        profile_id = userProfile.insert_one(data).inserted_id
        return jsonify({"success": True, "message": "Profile created successfully", "profile_id": str(profile_id)}), 201
    else:
        return jsonify({"success": False, "message": "No data provided"}), 400

@app.route('/postProfile', methods=["POST"])
def update_profile():
    print(request.json)
    data = request.json
    customer_id = data['id']
    if data:
        try:
            userProfile.update_one({"id": customer_id}, {"$set": {"firstName": data['firstName'], "lastName": data['lastName'], "email": data['email'], "phone": data['phone'], "address": data['address'], "postCode": data['postCode']}})
            return jsonify({"success": True, "message": "Profile updated successfully"}), 201
        except:
            return jsonify({"success": False, "message": "Profile updated failed"}), 204

@app.route('/getServicesByLocation', methods=['POST'])
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

@app.route('/getAddons', methods=['POST'])
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

@app.route('/getTechnicians', methods=['POST'])
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

@app.route('/getTimeNotAvaliable', methods=['POST'])
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
@app.route('/profile/<profile_id>', methods=['GET'])
def get_profile(profile_id):
    #find one return a object
    #（{}, {'_id': 0}） means not showing _id in the output
    profile = userProfile.find_one({"id": int(profile_id)}, {'_id': 0})
    print(profile)
    if profile:
        return jsonify(profile), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

@app.route('/getOrderByUserId/<user_id>', methods=['GET'])
def get_orders_by_userId(user_id):
    #find one return a object
    #（{}, {'_id': 0}） means not showing _id in the output
    orders = order.find({"id": int(user_id)}, {'_id': 0})
    orders_list = []
    for ord in orders:

        tech = technician.find_one({"id": ord["technicianId"]}, {'_id': 0, 'firstName': 1, 'lastName': 1})
        user = userProfile.find_one({"id": ord["userId"]}, {'_id': 0, 'firstName': 1, 'lastName': 1})
        order_with_profile = {**ord, **tech, **user}
        orders_list.append(order_with_profile)
    if orders_list:
        return jsonify(orders_list), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404
    
# @app.route('/postOrder', methods=['POST'])
# def post_order

@app.route('/getServices', methods=['GET'])
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

@app.route('/getServices/<post_code>', methods=['GET'])
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

@app.route('/getTechnicianName/<id>', methods=['GET'])
def get_technician_name(id):
    #find return a cursor
    print("get technician name")
    tech = technician.find_one({"id":int(id)}, {'_id': 0,"id":1,"firstName":1,"lastName":1,})
    print(tech)
    if tech:
        return jsonify(tech), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

######
#Technician
######
###
#POST
###
@app.route('/technician_account', methods=['POST'])
def update_technician_account():
    #find return a cursor

    result = request.json
    try:
        # 查找现有文档
        existing_document = technician.find_one({'email': result['email']})
        if existing_document:
            result['driverLicenseImage'] = base64.b64decode(result['driverLicenseImage'])
            result['secondaryIdImage'] = base64.b64decode(result['secondaryIdImage'])
            result['workingPermitImage'] = base64.b64decode(result['workingPermitImage'])
            result['galleryImage1'] = base64.b64decode(result['galleryImage1'])
            result['galleryImage2'] = base64.b64decode(result['galleryImage2'])
            result['galleryImage3'] = base64.b64decode(result['galleryImage3'])
            result['galleryImage4'] = base64.b64decode(result['galleryImage4'])
            result['nailLicenseImage'] = base64.b64decode(result['nailLicenseImage'])
            result['facialLicenseImage'] = base64.b64decode(result['facialLicenseImage'])
            result['policeCheckImage'] = base64.b64decode(result['policeCheckImage'])
            result['cvImage']= base64.b64decode(result['cvImage'])

            technician.update_one({'email': result['email']}, {'$set': result})
            return jsonify({'message': 'Data updated successfully'})
        else:
             return jsonify({"success": False, "message": "Profile not found"}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/takejob', methods=['POST'])
def take_job_by_id():
    result = request.json
    technician_id=technician.find_one({'email':result['technician_userName']})['id']
    order.update_one({'id':result['order_id']}, {'$set': {'status':"Accept",'technicianId':technician_id,'acceptedTime':datetime.now().strftime('%Y/%m/%d %H:%M')}})

    if result:
        return jsonify(result), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

@app.route('/updatetime', methods=['POST'])
def update_time():
    result = request.json
    time=result['time']
    transaction_id=result['transaction_id']
    transaction=order.find_one({'id':transaction_id},)
    if transaction['onTheWayTime'] == '' or 'onTheWayTime' not in order.find_one({'id':transaction_id,},):
        order.update_one({'id':transaction_id}, {'$set': {'onTheWayTime':time}})
    elif transaction['inProgressTime'] == '' or 'inProgressTime' not in order.find_one({'id':transaction_id,},):
        order.update_one({'id':transaction_id}, {'$set': {'inProgressTime':time}})
    elif transaction['doneTime'] == '' or 'doneTime' not in order.find_one({'id':transaction_id,},):
        order.update_one({'id':transaction_id}, {'$set': {'doneTime':time}})

    if result:
        return jsonify(result), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

@app.route('/updatetechnicianreview', methods=['POST'])
def update_technician_review():
    review = request.json
    order_id=review["order_id"]
    rating=review["rating"]
    feedback=review["feedback"]
    order.update_one({'id':int(order_id)}, {'$set': {'technicianRating':rating,'technicianFeedback':feedback,'reviewed':1}})

    return jsonify(review), 200
@app.route('/servicedaylist', methods=['POST'])
def get_service_list_by_date():
    data = request.json
    date=data['date']
    date_object = datetime.strptime(date, "%Y/%m/%d")
    year = date_object.year
    month = date_object.month
    day = date_object.day
    formatted_date = f"{year}/{month}/{day}"    
    userName=data['userName']
    technician_id=technician.find_one({'email':userName},{'_id': 0})['id']
    o_list=order.find({'technicianId':int(technician_id),} )
    l=[]
    for o in o_list:
        o_date=o['date&time'].split(' ')[0]
        if o_date==date or formatted_date==o_date:
            transaction={}
            transaction['id']=o['id']
            transaction['technician_id']=o['technicianId']
            ser=service.find_one({'id':int(o['serviceId'][0])},{'_id': 0})
            transaction['service_name']=ser['name']
            transaction['service_date']=o['date&time']
            customer=userProfile.find_one({'id':int(o["userId"])},{'_id': 0})
            transaction['customer_name']=customer['firstName']
            transaction['customer_address']=customer['address']
            transaction['customer_phone']=customer['phone']
            transaction['commissions']=o['commissions']
            transaction['surcharge']=o['surcharge']
            transaction['current_state']=o['currentState']
            transaction['accepted_time']=o['acceptedTime']
            transaction['on_the_way_time']=o['onTheWayTime']
            transaction['in_progress_time']=o['inProgressTime']
            transaction['done_time']=o['doneTime']
            transaction['reviewed']=o['reviewed']
            l.append(transaction)
        
    print(l[0])
    return jsonify(l), 200

@app.route('/getHighlightByMonth', methods=['POST'])
def get_highlight_days_by_month():
    data = request.json
    year=data['year']
    month=data['month']
    date=year+"/"+month
    date_object = datetime.strptime(date, "%Y/%m")
    year = date_object.year
    month = date_object.month
    formatted_date = f"{year}/{month}"    
    userName=data['userName']
    technician_id=technician.find_one({'email':userName},{'_id': 0})['id']
    o_list=order.find({'technicianId':int(technician_id),} )
    l=[]
    for o in o_list:
        o_date=o['date&time'].split(' ')[0].split('/')[0]+"/"+o['date&time'].split(' ')[0].split('/')[1]
        if o_date==date or formatted_date==o_date:
            day=o['date&time'].split(' ')[0].split('/')[2]
            l.append(day)
        
    print(l[0])
    return jsonify(l), 200


@app.route('/getmatricsbydate', methods=['POST'])
def get_three_matrics():
    data = request.json
    dateFrom=data['dateFrom']
    dateTo=data['dateTo']
    date_object_from = datetime.strptime(dateFrom, "%Y/%m/%d")
    date_object_to=datetime.strptime(dateTo, "%Y/%m/%d")
       
    userName=data['userName']
    technician_id=technician.find_one({'email':userName},{'_id': 0})['id']
    o_list=order.find({'technicianId':int(technician_id),} )
    m1=0
    m2=0
    m3=0
    for o in o_list:
        
        date_object_o=datetime.strptime(o['date&time'].split(' ')[0], "%Y/%m/%d")
        if date_object_o<date_object_to and date_object_o>date_object_from:
            m3=m3+1
            if o['status']=="Completed":
                m2=m2+1
                m1=m1+o['commissions']
        
    
    return jsonify({'m1':m1,'m2':m2,'m3':m3}), 200
# @app.route('/fetchmatrics', methods=['POST'])
# def fetch_three_matrics(technician_userName):
#     i=technician.find_one({'email':technician_userName})['id']
#     order_list=order.find()

#     for o in order_list:
#         if o['technicianId']==i :


#     return jsonify(review), 200

###
#GET
###
@app.route('/transaction/tracking/<technician_userName>', methods=['GET'])
def get_tracking_transaction(technician_userName):

    technician_id=technician.find_one({'email':technician_userName},{'_id': 0})['id']
    o_list=order.find({'technicianId':int(technician_id),} )
    
    l=[]
    for o in o_list:
        dateofO=o['date&time'].split(' ')[0]
        FOrtoday=datetime.today().strftime("%Y/%m/%d")
        year = datetime.today().year
        month = datetime.today().month
        day = datetime.today().day
        noZeroToday= f"{year}/{month}/{day}"
        if dateofO==FOrtoday or dateofO==noZeroToday:
            print(datetime.today().strftime("%Y/%m/%d"))
            transaction={}
            transaction['id']=o['id']
            transaction['technician_id']=o['technicianId']
            ser=service.find_one({'id':int(o['serviceId'][0])},{'_id': 0})
            transaction['service_name']=ser['name']
            transaction['service_date']=o['date&time']
            customer=userProfile.find_one({'id':int(o["userId"])},{'_id': 0})
            transaction['customer_name']=customer['firstName']
            transaction['customer_address']=customer['address']
            transaction['customer_phone']=customer['phone']
            transaction['commissions']=o['commissions']
            transaction['surcharge']=o['surcharge']
            transaction['current_state']=o['currentState']
            transaction['accepted_time']=o['acceptedTime']
            transaction['on_the_way_time']=o['onTheWayTime']
            transaction['in_progress_time']=o['inProgressTime']
            transaction['done_time']=o['doneTime']
            transaction['reviewed']=o['reviewed']
            l.append(transaction)
    print(l)
    return jsonify(l), 200

@app.route('/technician_account/<user_email>', methods=['GET'])
def get_technician_account_by_email(user_email):
    #find one return a object
    #（{}, {'_id': 0}） means not showing _id in the output
    result = technician.find_one({'email': user_email},{'_id': 0})
    if result is not None:

        result['driverLicenseImage'] = base64.b64encode(result['driverLicenseImage']).decode('utf-8')
        result['secondaryIdImage'] = base64.b64encode(result['secondaryIdImage']).decode('utf-8')
        result['workingPermitImage'] = base64.b64encode(result['workingPermitImage']).decode('utf-8')
        result['galleryImage1'] = base64.b64encode(result['galleryImage1']).decode('utf-8')
        result['galleryImage2'] = base64.b64encode(result['galleryImage2']).decode('utf-8')
        result['galleryImage3'] = base64.b64encode(result['galleryImage3']).decode('utf-8')
        result['galleryImage4'] = base64.b64encode(result['galleryImage4']).decode('utf-8')
        result['nailLicenseImage'] = base64.b64encode(result['nailLicenseImage']).decode('utf-8')
        result['facialLicenseImage'] = base64.b64encode(result['facialLicenseImage']).decode('utf-8')
        result['policeCheckImage'] = base64.b64encode(result['policeCheckImage']).decode('utf-8')
        result['cvImage']= base64.b64encode(result['cvImage']).decode('utf-8')

    if result:
        return jsonify(result), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

@app.route('/jobs/in10miles/<user_email>', methods=['GET'])
def get_jobs_in_10miles_by_email(user_email):
    #find one return a object
    #（{}, {'_id': 0}） means not showing _id in the output
    technician_postcode = technician.find_one({'email': user_email},{'_id': 0})['postCode']
    order_list=order.find({'status':'Pending'})

    job_list=[]
    for ord in order_list:
        code=userProfile.find_one({'id': int(ord['userId'])},{'_id': 0})['postCode']
        if abs(technician_postcode - code)<5:
            job={}
            job['id']=ord["id"]
            job['customer_id']=ord["userId"]
            customer=userProfile.find_one({'id':int(ord["userId"])},{'_id': 0})
            job['customer_name']=customer['firstName']+customer['lastName']
            job['customer_address']=customer['address']
            job['commissions']=ord["commissions"]
            ser=service.find_one({'id':int(ord['serviceId'][0])},{'_id': 0})
            job['service_name']=ser['name']
            job['service_date']=ord['date&time']
            job['post_time']=ord['createdAt']
            job_list.append(job)


    return jsonify(job_list), 200


@app.route('/jobs/more10miles/<user_email>', methods=['GET'])
def get_jobs_more_10miles_by_email(user_email):
    #find one return a object
    #（{}, {'_id': 0}） means not showing _id in the output
    technician_postcode = technician.find_one({'email': user_email},{'_id': 0})['postCode']
    order_list=order.find({'status':'Pending'})

    job_list=[]
    for ord in order_list:
        code=userProfile.find_one({'id': int(ord['userId'])},{'_id': 0})['postCode']
        if abs(technician_postcode - code)>5:
            job={}
            job['id']=ord["id"]
            job['customer_id']=ord["userId"]
            customer=userProfile.find_one({'id':int(ord["userId"])},{'_id': 0})
            job['customer_name']=customer['firstName']+customer['lastName']
            job['customer_address']=customer['address']
            job['commissions']=ord["commissions"]
            ser=service.find_one({'id':int(ord['serviceId'][0])},{'_id': 0})
            job['service_name']=ser['name']
            job['service_date']=ord['date&time']
            job['post_time']=ord['createdAt']
            job_list.append(job)


    return jsonify(job_list), 200


@app.route('/jobs/specifyme/<user_email>', methods=['GET'])
def get_jobs_specifyme_by_email(user_email):
    #find one return a object
    #（{}, {'_id': 0}） means not showing _id in the output
    technician_id=technician.find_one({'email': user_email},{'_id': 0})['id']
    order_list=order.find({'status':'Pending','technicianId':technician_id},{'_id': 0})
    job_list=[]
    for ord in order_list:
        job={}
        job['id']=ord["id"]
        job['customer_id']=ord["userId"]
        customer=userProfile.find_one({'id':int(ord["userId"])},{'_id': 0})
        job['customer_name']=customer['firstName']
        job['customer_address']=customer['address']
        job['commissions']=ord["commissions"]
        ser=service.find_one({'id':int(ord['serviceId'][0])},{'_id': 0})
        job['service_name']=ser['name']
        job['service_date']=ord['date&time']
        job['post_time']=ord['createdAt']
        job_list.append(job)

    return jsonify(job_list), 200

@app.route('/transactions/<user_email>', methods=['GET'])
def get_transacitons_by_email(user_email):

    technician_id=technician.find_one({'email':user_email},{'_id': 0})['id']

    order_list=order.find({'technicianId':technician_id},{'_id': 0})
    transaction_list=[]
    for o in order_list:
        if o['status']!="Pending":
            transaction={}
            transaction['id']=o['id']
            transaction['technician_id']=o['technicianId']
            ser=service.find_one({'id':int(o['serviceId'][0])},{'_id': 0})
            transaction['service_name']=ser['name']
            transaction['service_date']=o['date&time']
            customer=userProfile.find_one({'id':int(o["userId"])},{'_id': 0})
            transaction['customer_name']=customer['firstName']
            transaction['customer_address']=customer['address']
            transaction['customer_phone']=customer['phone']
            transaction['commissions']=o['commissions']
            transaction['surcharge']=o['surcharge']
            transaction['current_state']=o['currentState']
            transaction['accepted_time']=o['acceptedTime']
            transaction['on_the_way_time']=o['onTheWayTime']
            transaction['in_progress_time']=o['inProgressTime']
            transaction['done_time']=o['doneTime']
            transaction['reviewed']=o['reviewed']
            transaction_list.append(transaction)

    return jsonify(transaction_list), 200


@app.route('/technicianreview/<order_id>', methods=['GET'])
def get_technician_review_by_id(order_id):

    transaction=order.find_one({'id':int(order_id)})
    review={}
    review["order_id"]=order_id
    review["rating"]=transaction["technicianRating"]
    review["feedback"]=transaction["technicianFeedback"]
    return jsonify(review), 200



######
#Admin
######

###
#POST
###

###
#GET
###

if __name__ == '__main__':
    app.run(debug=True)
