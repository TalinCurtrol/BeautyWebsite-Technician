from datetime import datetime, timedelta
from flask import Flask, make_response, request, jsonify, Blueprint
from pymongo import MongoClient
import base64
import requests
import stripe
import config

technician_bp = Blueprint('technician', __name__)

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


@technician_bp.before_request
def before_request():
    if request.method == 'OPTIONS':
        # CORS preflight request
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        return response

######
#Technician
######
###
#POST
###
@technician_bp.route('/technician_account', methods=['POST'])
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

@technician_bp.route('/takejob', methods=['POST'])
def take_job_by_id():
    result = request.json
    technician_id=technician.find_one({'email':result['technician_userName']})['id']
    order.update_one({'id':int(result['order_id'])}, {'$set': {'status':"Accept",'currentState':"Accept",'technicianId':technician_id,'acceptedTime':datetime.now().strftime('%Y/%m/%d %H:%M')}})
    
    if result:
        return jsonify(result), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

@technician_bp.route('/updatetime', methods=['POST'])
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

@technician_bp.route('/updatetechnicianreview', methods=['POST'])
def update_technician_review():
    review = request.json
    order_id=review["order_id"]
    rating=review["rating"]
    feedback=review["feedback"]
    order.update_one({'id':int(order_id)}, {'$set': {'technicianRating':rating,'technicianFeedback':feedback,'reviewed':1}})

    return jsonify(review), 200
@technician_bp.route('/servicedaylist', methods=['POST'])
def get_service_list_by_date():
    data = request.json
    date=data['date']
    date_object = datetime.strptime(date, "%Y/%m/%d")
    year = date_object.year
    month = date_object.month
    day = date_object.day
    formatted_date = f"{year}/{month}/{day}"    
    userName=data['userName']
    print("userName",userName)
    technician_id=technician.find_one({'email':userName},{'_id': 0})['id']
    print("technician_id",technician_id)
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

@technician_bp.route('/getHighlightByMonth', methods=['POST'])
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


@technician_bp.route('/getmatricsbydate', methods=['POST'])
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
# @technician_bp.route('/fetchmatrics', methods=['POST'])
# def fetch_three_matrics(technician_userName):
#     i=technician.find_one({'email':technician_userName})['id']
#     order_list=order.find()

#     for o in order_list:
#         if o['technicianId']==i :


#     return jsonify(review), 200

###
#GET
###
@technician_bp.route('/transaction/tracking/<technician_userName>', methods=['GET'])
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

@technician_bp.route('/technician_account/<user_email>', methods=['GET'])
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

@technician_bp.route('/jobs/in10miles/<user_email>', methods=['GET'])
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


@technician_bp.route('/jobs/more10miles/<user_email>', methods=['GET'])
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


@technician_bp.route('/jobs/specifyme/<user_email>', methods=['GET'])
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

@technician_bp.route('/transactions/<user_email>', methods=['GET'])
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


@technician_bp.route('/technicianreview/<order_id>', methods=['GET'])
def get_technician_review_by_id(order_id):

    transaction=order.find_one({'id':int(order_id)})
    review={}
    review["order_id"]=order_id
    review["rating"]=transaction["technicianRating"]
    review["feedback"]=transaction["technicianFeedback"]
    return jsonify(review), 200

