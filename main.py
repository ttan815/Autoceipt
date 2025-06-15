from flask import Flask, render_template, request, url_for, redirect, flash, send_from_directory, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, String, Float
from flask_login import UserMixin, login_user, LoginManager, login_required, current_user, logout_user
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity

from dotenv import load_dotenv
import os
from flask_cors import CORS

load_dotenv()
app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
jwt = JWTManager(app)

class Base(DeclarativeBase):
    pass


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
db = SQLAlchemy(model_class=Base)
db.init_app(app)

# CREATE TABLE IN DB


class User(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    password: Mapped[str] = mapped_column(String(100))
    name: Mapped[str] = mapped_column(String(1000))

class Receipt(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    storeName: Mapped[str] = mapped_column(String(100))
    storeAddress: Mapped[str] = mapped_column(String(100))
    receiptID: Mapped[str] = mapped_column(String(100))
    date: Mapped[str] = mapped_column(String(100))
    time: Mapped[str] = mapped_column(String(100))
    paymentMethod: Mapped[str] = mapped_column(String(100))
    cardLast4: Mapped[int] = mapped_column(Integer)
    subTotal: Mapped[float] = mapped_column(Float)
    tax: Mapped[float] = mapped_column(Float)
    total: Mapped[float] = mapped_column(Float)

with app.app_context():
    db.create_all()

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
                access_token = create_access_token(identity=user.id)
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
                access_token = create_access_token(identity=user.id)
                return jsonify({"access_token": access_token,"userID" : user.id, "username" : user.name, "email" : user.email})

            else:
                return jsonify({"status" : f"Incorrect Password"}), 403
        else:
            return jsonify({"status" : f"User not found under email: {userMetaData.get("email")}"}), 403

if __name__ == '__main__':
    app.run(debug=True, port=5001)
