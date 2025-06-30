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

#Imaging Libraries
from PIL import Image
from openai import OpenAI
import base64
import easyocr
import cv2

load_dotenv()
app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config['JWT_VERIFY_SUB'] = False
reader = easyocr.Reader(['en'], gpu=True)
jwt = JWTManager(app)

class Base(DeclarativeBase):
    pass


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
db = SQLAlchemy(model_class=Base)
db.init_app(app)

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# Create Tables 
class User(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    password: Mapped[str] = mapped_column(String(100))
    name: Mapped[str] = mapped_column(String(1000))

class Receipt(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    userID: Mapped[int] = mapped_column(Integer)
    storeName: Mapped[str] = mapped_column(String(100))
    storeAddress: Mapped[str] = mapped_column(String(100))
    date: Mapped[str] = mapped_column(String(100))
    time: Mapped[str] = mapped_column(String(100))
    paymentMethod: Mapped[str] = mapped_column(String(100))
    cardLast4: Mapped[int] = mapped_column(Integer)
    subTotal: Mapped[float] = mapped_column(Float)
    tax: Mapped[float] = mapped_column(Float)
    total: Mapped[float] = mapped_column(Float)

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

            if name == None or email == None or password == None:
                # Returns if the request went through
                return jsonify({"status" : False})
            else:
                if User.query.filter_by(email=f'{email}').first() != None:
                    return jsonify({"status" : "User already exists"}), 403
                user = User(email=email, name=name, password = generate_password_hash(password=password))  # Hashes the user's password for creating a User object

                #Generate User's Token to auto-login after registration
                db.session.add(user)
                db.session.commit()
                access_token = create_access_token(identity=str(user.id), fresh=True)
                return jsonify({"access_token": access_token,"userID" : user.id, "username" : user.name, "email" : user.email})
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
                return jsonify({"access_token": access_token,"userID" : user.id, "username" : user.name, "email" : user.email})

            else:
                return jsonify({"status" : f"Incorrect Password"}), 403
        else:
            return jsonify({"status" : f"User not found under email: {userMetaData.get("email")}"}), 403
        
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
                return redirect(request.url)
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                # base64_image = encode_image(filepath)
                reader = easyocr.Reader(['en'], gpu=True)
                img = cv2.imread(filepath)

                if img is None:
                    return jsonify({"error": "Image failed to load. Ensure file is valid and correctly saved."}), 400
                result = reader.readtext(img, detail=0)
                response = client.responses.create(
                    model="gpt-4.1-nano",
                    input=f'''
                Clean the text in the following OCR lines:
                {result}

                Correct any typos or inconsistent casing (e.g. fix "BuRger" to "Burger or $12.2 to $12.20"). Use title casing for names and addresses when appropriate. Only make educated guesses. If a value is missing or unclear, return it as "None".

                Respond with JSON only, following this exact format:
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
                    "cardLast4":,
                    "subTotal":,
                    "tax":,
                    "total":,
                    "imageURL" None: 
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
                    "result:" : result,
                    "Receipt Message": json.loads(re.sub(r'^```json\n|\n```$', '', response.output_text)),
                })
            return jsonify({
                "status": "success",
                "Receipt Message": "Heee"
            })
        else:
            return jsonify({"error": "User not found"}), 404  

@app.route("/edit", methods=["PATCH"])
@jwt_required
def edit():
    # Make it where there's an algorithm on the user's mobile app that checks each field and see if any values changed, if so, put it in a sepearate array and put it in a json to send here in the edit to patch.
    pass

@app.route("/submit", methods=["POST"])
@jwt_required()
def submit():
    receiptData = request.get_json()

    if receiptData is None:
        return jsonify({"error": "No valid receipt data"}), 400
    userID = get_jwt_identity()
    try:
        userID = int(userID)
    except ValueError:
        return jsonify({"status": "Invalid user ID in token"}), 400
    vendor = receiptData.get("vendor", {})
    metadata = receiptData.get("metadata", {})
    # Vendor fields
    store_name = vendor.get("storeName")
    store_address = vendor.get("storeAddress")
    store_id = vendor.get("store_id")

    # Metadata fields
    date = metadata.get("date")
    time = metadata.get("time")
    payment_method = metadata.get("paymentMethod")
    card_last4 = metadata.get("cardLast4")
    sub_total = metadata.get("subTotal")
    tax = metadata.get("tax")
    total = metadata.get("total")
    image_url = metadata.get("imageURL")

    receipt = Receipt(
        userID=userID, 
        storeName=vendor.get("storeName"),
        storeAddress=vendor.get("storeAddress"),
        date=metadata.get("date"),
        time=metadata.get("time"),
        paymentMethod=metadata.get("paymentMethod"),
        cardLast4=metadata.get("cardLast4"),
        subTotal=metadata.get("subTotal"),
        tax=metadata.get("tax"),
        total=metadata.get("total")
    )
    db.session.add(receipt)
    db.session.commit()
    return jsonify({"Success":"Saved Receipt To DB"})

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
        
        
if __name__ == '__main__':
    app.run(debug=True, port=5001)