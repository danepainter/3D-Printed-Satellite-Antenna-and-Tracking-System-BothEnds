#JUSTIN ISARAPHANICH 9/3/2025 LAST MODIFIED
#INITIALIZE A DATABASE FILE, CREATE THE TABLES

from flask import Flask
from config import Config
from database import db
from models import Data, Positions

#Create the Flask app
app = Flask(__name__)
app.config.from_object(Config)

#initialize the db
db.init_app(app)

#create all tables
with app.app_context():
    db.create_all()
    print("Tables created successfully")
