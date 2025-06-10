import json
from flask import Flask, jsonify
import sqlalchemy

app = Flask(__name__)

@app.route("/")
def main():
    message = {'message':"Welcome to the Autoceipt API."}
    return jsonify(message)
if __name__ == '__main__':
    app.run()