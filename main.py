from flask import Flask, render_template, request, url_for, redirect, flash, send_from_directory, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, String, Float
from flask_login import UserMixin, login_user, LoginManager, login_required, current_user, logout_user
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from dotenv import load_dotenv
import os
from flask_cors import CORS
import json
import re
from flask_migrate import Migrate
import uuid

from datetime import timedelta


#Imaging Libraries
from PIL import Image
from openai import OpenAI
import base64
import easyocr
import cv2

#AWS3
import boto3
from botocore.client import Config

s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION"),  
    config=Config(signature_version='s3v4')  
)


S3_BUCKET = os.getenv("S3_BUCKET_NAME")


load_dotenv()
app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config['JWT_VERIFY_SUB'] = False
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15) 
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)    
reader = easyocr.Reader(['en'], gpu=True)
jwt = JWTManager(app)

class Base(DeclarativeBase):
    pass


# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://tonytan:Ur2smart@localhost:5432/autoceipt_db'

db = SQLAlchemy(model_class=Base)
db.init_app(app)


# After initializing `db`
migrate = Migrate(app, db)
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# Create Tables 
class User(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    password: Mapped[str] = mapped_column(String(1000))
    name: Mapped[str] = mapped_column(String(1000))

class Receipt(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    userID: Mapped[int] = mapped_column(Integer)
    storeName: Mapped[str] = mapped_column(String(100))
    storeAddress: Mapped[str] = mapped_column(String(100))
    date: Mapped[str] = mapped_column(String(100))
    time: Mapped[str] = mapped_column(String(100))
    paymentMethod: Mapped[str] = mapped_column(String(100))
    cardLast4: Mapped[str] = mapped_column(String(100))
    subTotal: Mapped[str] = mapped_column(String(100))
    tax: Mapped[str] = mapped_column(String(100))
    total: Mapped[str] = mapped_column(String(100))
    filepath: Mapped[str] = mapped_column(String(512), nullable=True)

with app.app_context():
    db.create_all()

client = OpenAI(api_key=os.getenv("OPENAI_KEY"))

# Function to encode the image
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
@app.route("/")
def main():
    message = {'message':"Welcome to the Autoceipt API."}
    return jsonify(message)
@app.route("/register", methods=["GET","POST"])
def register():
    if(request.method == "GET"):
        return jsonify({"API": "Register (GET)"})
    if request.method == "POST":
        userMetaData = request.get_json()
        if userMetaData:
            name = userMetaData.get("name")
            email = userMetaData.get("email")
            password = userMetaData.get("password")
            confirmPassword = userMetaData.get("confirmPassword")
            if name == None or email == None or password == None or confirmPassword == None:
                # Returns if the request went through
                return jsonify({"status" : False})
            else:
                if User.query.filter_by(email=f'{email}').first() != None:
                    return jsonify({"status" : "User already exists"}), 403
                if password != confirmPassword:
                    return jsonify({"status" : "Passwords do not match"}), 403
                user = User(email=email, name=name, password = generate_password_hash(password=password))  # Hashes the user's password for creating a User object

                #Generate User's Token to auto-login after registration
                db.session.add(user)
                db.session.commit()
                access_token = create_access_token(identity=str(user.id), fresh=True)
                return jsonify({"access_token": access_token,"userID" : user.id, "username" : user.name, "email" : user.email, "status":True})
        else:
            return jsonify({"error": "Empty receipt data"}), 400
        
@app.route("/login", methods=["GET","POST"])
def login():
    if(request.method == "GET"):
        return jsonify({"API": "Login (GET)"}), 403
    if(request.method == "POST"):
        userMetaData = request.get_json()
        user = User.query.filter_by(email=f'{userMetaData.get("email")}').first()
        if user != None:
            if check_password_hash(user.password, userMetaData.get("password")):
                stringID = str(user.id)
                access_token = create_access_token(identity=stringID, fresh=True)
                return jsonify({"access_token": access_token,"userID" : user.id, "username" : user.name, "email" : user.email, "status":True})

            else:
                #Incorrect password
                return jsonify({"status" : False}), 200
        else:
            #Couldn't find a user under that email
            return jsonify({"status" : False}), 200
        
@app.route("/create", methods=["GET", "POST"])
@jwt_required()
def create():
    if request.method == "GET":
        return jsonify({"API": "Create (GET)"}), 403

    userID = get_jwt_identity()
    if userID is None:
        return jsonify({"status": "No token used for create"}), 400

    try:
        userID = int(userID)
    except ValueError:
        return jsonify({"status": "Invalid user ID in token"}), 400

    with db.session() as session:
        user = session.get(User, userID)
        if user:
            file = request.files['image']

            if file.filename == '':
                return jsonify({"status": "No selected file"}), 400
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                # base64_image = encode_image(filepath)
                # reader = easyocr.Reader(['en'], gpu=True)
                img = cv2.imread(filepath)

                if img is None:
                    return jsonify({"error": "Image failed to load. Ensure file is valid and correctly saved."}), 400
                result = reader.readtext(img, detail=0)
                response = client.responses.create(
                model="gpt-4.1-nano",
                input=f'''
            Clean and structure the following OCR text:
            {result}

            - Fix typos and inconsistent casing (e.g., "BuRger" → "Burger", "$12.2" → "$12.20").
            - Do not include dollar sign ($) (e.g., "$12.20" →  "12.20")
            - Use title case for names and addresses.
            - Format dates as MM-DD-YYYY (e.g., 06-21-2025).
            - If any field is unclear or missing, use "None".

            Respond with JSON only in this format:

            {{
            "vendor": {{
                "storeName": "",
                "storeAddress": "",
                "store_id": ""
            }},
            "metadata": {{
                "date": "",
                "time": "",
                "paymentMethod": "",
                "cardLast4": "",
                "subTotal": "",
                "tax": "",
                "total": "",
                "imageURL": null
            }}
            }}
            '''
            )



                
                # response = client.responses.create(
                #     model="gpt-4.1",
                #     input=[
                #         {
                #             "role": "user",
                #             "content": [
                #                 { "type": "input_text", "text": "what's in this image?" },
                #                 {
                #                     "type": "input_image",
                #                     "image_url": f"data:image/jpeg;base64,{base64_image}",
                #                 },
                #             ],
                #         }
                #     ],
                # )
                return jsonify({
                    "status": "success",
                    # "Receipt Message": f"{response.output_text}",
                    # "result:" : result,
                    "Receipt Message": json.loads(re.sub(r'^```json\n|\n```$', '', response.output_text)),
                })
        else:
            return jsonify({"error": "User not found"}), 404  

@app.route("/edit", methods=["PATCH"])
@jwt_required()
def edit():
    # Make it where there's an algorithm on the user's mobile app that checks each field and see if any values changed, if so, put it in a sepearate array and put it in a json to send here in the edit to patch.
    pass

# @app.route("/submit", methods=["POST"])
# @jwt_required()
# def submit():
#     receiptData = request.get_json()

#     if receiptData is None:
#         return jsonify({"error": "No valid receipt data"}), 400
#     userID = get_jwt_identity()
#     try:
#         userID = int(userID)
#     except ValueError:
#         return jsonify({"status": "Invalid user ID in token"}), 400
#     vendor = receiptData.get("vendor", {})
#     metadata = receiptData.get("metadata", {})
#     # Vendor fields
#     store_name = vendor.get("storeName")
#     store_address = vendor.get("storeAddress")
#     store_id = vendor.get("store_id")

#     # Metadata fields
#     date = metadata.get("date")
#     time = metadata.get("time")
#     payment_method = metadata.get("paymentMethod")
#     card_last4 = metadata.get("cardLast4")
#     sub_total = metadata.get("subTotal")
#     tax = metadata.get("tax")
#     total = metadata.get("total")
#     image_url = metadata.get("imageURL")

#     receipt = Receipt(
#         userID=userID, 
#         storeName=vendor.get("storeName"),
#         storeAddress=vendor.get("storeAddress"),
#         date=metadata.get("date"),
#         time=metadata.get("time"),
#         paymentMethod=metadata.get("paymentMethod"),
#         cardLast4=metadata.get("cardLast4"),
#         subTotal=metadata.get("subTotal"),
#         tax=metadata.get("tax"),
#         total=metadata.get("total")
#     )
#     db.session.add(receipt)
#     db.session.commit()
#     return jsonify({"Success":"Saved Receipt To DB"})

@app.route("/search", methods=["GET"])
@jwt_required()
def search():
    #Make it where when a user searches, a button they press loads the inital pagination 0 - 20, then a next button increments 0 and 20 by +20 and vice versa for the previous button being subtract 20 from each, for the next ones, etc. Optimization potential since we're going to need to search and spew out the search results every time we click next or previous
    user_id = int(get_jwt_identity())

    # Base query for current user
    query = db.session.query(Receipt).filter(Receipt.userID == user_id)

    # Fields you want to allow filtering on
    filter_fields = [
        "id", "storeName", "storeAddress", "date", "time",
        "paymentMethod", "cardLast4", "subTotal", "tax", "total"
    ]

    # Dynamically add filters if present in query string
    for field in filter_fields:
        value = request.args.get(field)
        if value is not None:
            # Cast types if needed (int, float)
            column = getattr(Receipt, field)
            # Converts cardLast4 string to int
            if field in {"id", "cardLast4"}:
                value = int(value)
            # Converts subTotal, tax, and total from string to float
            elif field in {"subTotal", "tax", "total"}:
                value = float(value)
            # All other fields, being strings are added to the query filter
            query = query.filter(column == value)

    # Optional: limit/pagination
    limit = request.args.get("limit", default=20, type=int)
    offset = request.args.get("offset", default=0, type=int)

    results = query.offset(offset).limit(limit).all()

    return jsonify([
        {
            "id": r.id,
            "storeName": r.storeName,
            "date": r.date,
            "total": r.total,
            "subTotal": r.subTotal,
            "tax": r.tax,
            "paymentMethod": r.paymentMethod,
        } for r in results
    ])

@app.route("/uploadsubmission", methods=["POST"])
@jwt_required()
def uploadsubmission():
    user_id = int(get_jwt_identity())
    imagefile = request.files["imagefile"]

    if imagefile is None:
        return jsonify({"error": "No image uploaded"}), 400
    else:
        print(f"This is our file: {imagefile}")
    print(f'Our imagefilename: {imagefile.filename}')
    unique_filename = f"{uuid.uuid4()}_{secure_filename(imagefile.filename)}"
    s3_key = f"photos/user_{user_id}/{unique_filename}"
    card_last4 = request.form.get('cardLast4')
    date = request.form.get('date')
    payment_method = request.form.get('paymentMethod')
    subtotal = request.form.get('subTotal')
    tax = request.form.get('tax')
    time = request.form.get('time')
    total = request.form.get('total')
    store_address = request.form.get('storeAddress')
    store_name = request.form.get('storeName')

    receipt = Receipt(
        userID=user_id,
        storeName=store_name if store_name else "",
        storeAddress=store_address if store_address else "",
        date=date if date else "",
        time=time if time else "",
        paymentMethod=payment_method if payment_method else "",
        cardLast4=card_last4 if card_last4 else "",
        subTotal=subtotal if subtotal else "",
        tax=tax if tax else "",
        total=total if total else "",
        filepath = s3_key,
    )
    try:
        db.session.add(receipt)
        db.session.commit()
        print("This commited just fine")
    except Exception as db_error:
        db.session.rollback()
        print("DB COMMIT ERROR:", str(db_error))
        return jsonify({"error": f"Database error: {str(db_error)}"}), 500

    try:
        print("we got in here before uploading to AWS3")
        print(f'submitting key: {s3_key}')
        s3.upload_fileobj(imagefile, "autoceiptbucket", s3_key)
        print("Successfully uploaded to AWS3")
        return jsonify({"status":True})


    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/getimageurl', methods=["POST"])
@jwt_required()
def getimageurl():
    data = request.get_json()
    s3_key = data.get("filepath")

    if not s3_key:
        return jsonify({"error": "Missing 'filepath'"}), 400
    presigned_url = s3.generate_presigned_url(
        ClientMethod='get_object',
        Params={
            'Bucket': 'autoceiptbucket',
            'Key': s3_key
        },
        ExpiresIn=3600  # link valid for 1 hour (3600 seconds)
    )
    print(f"We are returning { presigned_url}")
    return jsonify({"status": True, "url": presigned_url})    
#Make it where it'll display up to 10 of them, and for each of those buttons, before it takes you to that page, have the getimageurl be activated so that the image url can be generated and sent with you through a navgiation.navigate to that page to view it.

@app.route("/getreceipts", methods=["GET"])
@jwt_required()
def getreceipts():
    userid = int(get_jwt_identity())
    receipts = Receipt.query.filter(
    Receipt.userID == userid,
    # Receipt.id.between(0, 20)
    ).all()
    receiptData = []
    for r in receipts:
        receiptData.append(

                {
                    "id": r.id,
                    "userID": r.userID,
                    "storeName": r.storeName,
                    "storeAddress": r.storeAddress,
                    "date": r.date,
                    "time": r.time,
                    "paymentMethod": r.paymentMethod,
                    "cardLast4": r.cardLast4,
                    "subTotal": r.subTotal,
                    "tax": r.tax,
                    "total": r.total,
                    "filepath": r.filepath
                }
        )
    return jsonify(receiptData)
    

@app.route("/checkToken", methods=["GET","POST"])
@jwt_required()
def checkToken():
    return jsonify({"ValidToken":True})

        
if __name__ == '__main__':
    # app.run(debug=True, port=5001)
    app.run(debug=True,host='0.0.0.0', port=5001)
