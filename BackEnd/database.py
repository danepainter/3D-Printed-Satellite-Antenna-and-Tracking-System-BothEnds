''' initializes the database (?)'''
'''initialize tables function (?)'''
#JUSTIN ISARAPHANICH 9/3/2025 LAST MODIFIED
#DATABASE FILE, INITIALIZE THE DATABASE AND CREATE THE TABLES

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

def init_db(app):
    """Initialize the database with the Flask app"""
    db.init_app(app)
    
    with app.app_context():
        # Create all tables
        db.create_all()