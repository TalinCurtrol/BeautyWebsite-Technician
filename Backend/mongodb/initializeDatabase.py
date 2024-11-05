import csv
import glob
from pymongo import MongoClient
from ast import literal_eval
import os
import hashlib

def remove_all_documents(collection):
    """Remove all documents from the specified collection."""
    collection.delete_many({})

def read_csv_to_mongodb(file_path, collection):
    """Read data from CSV file and insert into MongoDB collection."""
    with open(file_path, 'r',encoding='utf-8-sig') as csvfile:
        csv_reader = csv.DictReader(csvfile)
        for row in csv_reader:
            # Convert string values to appropriate data types
            for key, value in row.items():
                # Check if the value is a list in string format
                if value.startswith('[') and value.endswith(']'):
                    # Convert string representation of list to actual list
                    row[key] = literal_eval(value)
                else:
                    # Convert to int if possible
                    try:
                        row[key] = int(value)
                    except ValueError:
                        try:
                            row[key] = float(value)
                        except ValueError:
                            if value.lower() == 'true':
                                row[key] = True
                            elif value.lower() == 'false':
                                row[key] = False
                            else:
                                # Not a boolean, leave it as string
                                pass
            collection.insert_one(row)

def image_to_binary(image_path):
    with open(image_path, 'rb') as image_file:
        binary_data = image_file.read()
    return binary_data

def store_technician_image(image_path,technician_id, collection):
    file_name=os.path.basename(image_path)
    att_name=file_name.split('.')[0]
    image_data = image_to_binary(image_path)
    collection.update_one(
        {"id": technician_id},
        {"$set":{att_name:image_data }}
    )


def get_hash_password(password):
    salt = 'thisIsASalt'
    salted_password = password + salt
    # 使用 SHA-256 进行哈希
    hashed_password = hashlib.sha256(salted_password.encode()).hexdigest()
    return hashed_password

if __name__ == "__main__":
    client = MongoClient('mongodb://localhost:27017/')
    db = client['Client']
    userProfile = db['userProfile']
    service = db['Service']
    addon = db['Addon']
    order = db['Order']
    technician = db['Technician']

    # Remove all documents from the Service collection
    remove_all_documents(service)
    remove_all_documents(addon)
    remove_all_documents(order)
    remove_all_documents(userProfile)
    remove_all_documents(technician)

    # Read data from Service.csv and insert into MongoDB
    csv_file_path = 'Service.csv'
    read_csv_to_mongodb(csv_file_path, service)
    unique_categories = service.distinct('category')
    print(unique_categories)
    for category in unique_categories:
        category_path = os.path.join('imgs', 'service', category)
        img_files = [f for f in os.listdir(category_path) if os.path.isfile(os.path.join(category_path, f))]
        data= []
        for img_file in img_files:
            with open(os.path.join(category_path, img_file), 'rb') as image_file:
                image_data = image_file.read()
                data.append(image_data)
        service.update_many({'category': category}, {'$set': {'images': data}})

    csv_file_path = 'Addon.csv'
    read_csv_to_mongodb(csv_file_path, addon)
    addon.create_index([('id', 1)], unique=True)

    csv_file_path = 'Order.csv'
    read_csv_to_mongodb(csv_file_path, order)
    order.create_index([('id', 1)], unique=True)

    csv_file_path = 'userProfile.csv'
    read_csv_to_mongodb(csv_file_path, userProfile)
    userProfile.create_index([('id', 1)], unique=True)

    csv_file_path = 'Technician.csv'
    read_csv_to_mongodb(csv_file_path, technician)
    technician.create_index([('id', 1)], unique=True)
    for i in range(1,6,1):
        techncian_path=os.path.join('imgs', 'technician',str(i))
        for file_path in glob.glob(os.path.join(techncian_path, '*')):
            if os.path.isfile(file_path):
                store_technician_image(file_path,i,technician)

    db = client['Users']
    users = db['users']
    remove_all_documents(users)
    csv_file_path = 'users.csv'
    read_csv_to_mongodb(csv_file_path, users)
    users.create_index([('username', 1)], unique=True)
    all_users = users.find()
    for user in all_users:
        hashed_password = get_hash_password(user['password_hash'])
        users.update_one({'_id': user['_id']}, {'$set': {'password_hash': hashed_password}})
