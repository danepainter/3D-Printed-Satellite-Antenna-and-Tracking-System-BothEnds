'''This file is used to define the models/tables needed for the database'''
'''create relationships between tables'''
'''This file is used to define the models/tables needed for the database'''
'''create relationships between tables'''
#JUSTIN ISARAPHANICH 9/3/2025 LAST MODIFIED
#MODELS FILE, CREATE THE TABLES AND RELATIONSHIPS BETWEEN THEM

from database import db
from datetime import datetime

class Data(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(100), unique=True, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    filepath = db.Column(db.String(200), unique=True, nullable=False)
    satellite = db.Column(db.String(100), nullable=False)

    # Relationship to positions
    positions = db.relationship('Positions', backref='data', lazy=True)
    

class Positions(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    data_id = db.Column(db.Integer, db.ForeignKey('data.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    satlatitude = db.Column(db.Float, nullable=False)
    satlongitude = db.Column(db.Float, nullable=False)
    sataltitude = db.Column(db.Float, nullable=False)
    azimuth = db.Column(db.Float, nullable=False)
    elevation = db.Column(db.Float, nullable=False)
    ra = db.Column(db.Float, nullable=False)
    dec = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)